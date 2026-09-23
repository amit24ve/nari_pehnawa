import re
from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks, Request
from typing import List, Optional
from pydantic import BaseModel
from app.database.schemas.product import Product, ProductCreate, ProductUpdate
from app.database import get_database
from app.security import require_admin
from bson import ObjectId
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/products", tags=["Products"])


def send_new_product_newsletter(product_id: str, product_name: str, product_price: float, product_image: str):
    from datetime import datetime, timezone
    db = get_database()
    subscribers = set()
    
    # 1. Get users with newsletter settings True
    try:
        user_cursor = db["users"].find({"settings.notifications.newsletter": True}, {"email": 1})
        for u in user_cursor:
            email = u.get("email")
            if email:
                subscribers.add(email.strip().lower())
    except Exception as e:
        print(f"Error querying user newsletter settings: {e}")
        
    # 2. Get newsletter subscribers
    try:
        newsletter_cursor = db["newsletter_subscribers"].find({}, {"email": 1})
        for n in newsletter_cursor:
            email = n.get("email")
            if email:
                subscribers.add(email.strip().lower())
    except Exception as e:
        print(f"Error querying newsletter_subscribers: {e}")

    if subscribers:
        try:
            from app.services.notification_service import NotificationService
            notif = NotificationService(db)
            prod_url = f"https://naripehnawa.com/product/{product_id}"
            
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #8b0000; text-align: center; margin-top: 0;">✨ NARI PEHNAWA NEWSLETTER</h2>
                <p style="font-size: 14px; color: #334155; text-align: center;">We are excited to announce a new addition to our collection!</p>
                <div style="text-align: center; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
                    {f'<img src="{product_image}" style="max-width: 220px; height: auto; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />' if product_image else ''}
                    <h3 style="margin: 8px 0 4px 0; color: #0f172a; font-size: 16px;">{product_name}</h3>
                    <p style="font-weight: bold; font-size: 20px; color: #d4af37; margin: 4px 0;">₹{product_price:,.2f}</p>
                    <a href="{prod_url}" style="display: inline-block; background-color: #8b0000; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; margin-top: 14px; font-size: 14px;">Shop New Arrival Now</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">You received this because you are subscribed to Nari Pehnawa newsletter.</p>
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Nari Pehnawa • Luxury Indian Ethnic Wear</p>
            </div>
            """
            
            for sub_email in subscribers:
                try:
                    notif.send_raw_email(to_email=sub_email, subject=f"New Arrival: {product_name}", body_html=html_body)
                except Exception as ex:
                    print(f"Failed to send newsletter to {sub_email}: {ex}")
        except Exception as e:
            print(f"Failed to initialize NotificationService or send newsletter: {e}")


@router.post("/", response_model=Product, status_code=201)
def create_product(product: ProductCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(require_admin)):
    """Create a new product (Admin only)"""
    db = get_database()
    products_collection = db["products"]

    try:
        product_data = product.model_dump()
        if not product_data.get("department") and product_data.get("category"):
            matched_cat = db["categories"].find_one({"name": {"$regex": f"^{re.escape(product_data['category'])}$", "$options": "i"}})
            if matched_cat and matched_cat.get("department"):
                product_data["department"] = matched_cat["department"]
            else:
                product_data["department"] = "Clothing"

        result = products_collection.insert_one(product_data)
        new_id_str = str(result.inserted_id)
        product_data["_id"] = new_id_str
        
        # Ensure meta_catalog_id & sku are stored in DB
        catalog_id = str(product_data.get("meta_catalog_id") or product_data.get("sku") or new_id_str).strip()
        sku_val = str(product_data.get("sku") or catalog_id).strip()
        products_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"meta_catalog_id": catalog_id, "sku": sku_val}}
        )
        product_data["meta_catalog_id"] = catalog_id
        product_data["sku"] = sku_val
        product_data = _format_product(product_data)
        
        # Trigger background task to send newsletter
        background_tasks.add_task(
            send_new_product_newsletter,
            product_data["_id"],
            product_data.get("name", "New Product"),
            product_data.get("price", 0.0),
            product_data.get("image", "")
        )
        
        clear_api_cache()
        return product_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _format_product(product: dict) -> dict:
    if not product:
        return product
    p_id = str(product["_id"])
    product["_id"] = p_id
    catalog_id = str(product.get("meta_catalog_id") or product.get("sku") or p_id).strip()
    product["meta_catalog_id"] = catalog_id
    product["sku"] = str(product.get("sku") or catalog_id).strip()
    return product


@router.get("/", response_model=List[Product])
@cache_response(expire_seconds=300)
def get_products(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=5000),
    category: Optional[str] = None,
    department: Optional[str] = None,
    on_sale: Optional[bool] = None,
    is_new: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at"),
    sort_order: int = Query(-1)
):
    """Get all products with filters and pagination"""
    db = get_database()
    products_collection = db["products"]

    try:
        query = {}

        if category:
            cat_clean = category.strip()
            categories_col = db["categories"]
            matched_cat = categories_col.find_one({
                "$or": [
                    {"name": {"$regex": f"^{re.escape(cat_clean)}$", "$options": "i"}},
                    {"link": {"$regex": f"{re.escape(cat_clean)}", "$options": "i"}},
                    {"name": {"$regex": re.escape(cat_clean), "$options": "i"}}
                ]
            })

            terms = [re.escape(cat_clean)]
            if matched_cat and matched_cat.get("name"):
                terms.append(re.escape(matched_cat["name"]))

            words = [re.escape(w) for w in re.split(r'[\s\-_(),]+', cat_clean) if w]
            if words:
                terms.append(r".*?".join(words))

            combined_pattern = "|".join(f"(?:{t})" for t in set(terms))
            query["category"] = {"$regex": combined_pattern, "$options": "i"}

        if on_sale is not None:
            query["on_sale"] = on_sale
        if is_new is not None:
            if is_new:
                query["$or"] = [{"is_new": True}, {"is_new": {"$exists": False}}]
            else:
                query["is_new"] = False
        if min_price is not None or max_price is not None:
            query["price"] = {}
            if min_price is not None:
                query["price"]["$gte"] = min_price
            if max_price is not None:
                query["price"]["$lte"] = max_price
        if search:
            search_clean = search.strip()
            escaped_search = re.escape(search_clean)
            search_words = [re.escape(w) for w in re.split(r'[\s\-_(),]+', search_clean) if w]
            search_pattern = r".*?".join(search_words) if search_words else escaped_search
            query["$or"] = [
                {"name": {"$regex": search_pattern, "$options": "i"}},
                {"description": {"$regex": search_pattern, "$options": "i"}},
                {"category": {"$regex": search_pattern, "$options": "i"}},
                {"tags": {"$regex": search_pattern, "$options": "i"}}
            ]

        if department:
            dept_clean = department.strip()
            dept_cats = [c["name"] for c in db["categories"].find({"department": {"$regex": f"^{re.escape(dept_clean)}$", "$options": "i"}}, {"name": 1})]
            dept_clauses = [
                {"department": {"$regex": f"^{re.escape(dept_clean)}$", "$options": "i"}}
            ]
            if dept_cats:
                dept_clauses.append({"category": {"$in": dept_cats}})
            if "$or" in query:
                query = {"$and": [query, {"$or": dept_clauses}]}
            else:
                query["$or"] = dept_clauses

        cursor = products_collection.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
        products = list(cursor)

        products = [_format_product(p) for p in products]
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
@cache_response(expire_seconds=300)
def get_product_count(
    request: Request,
    category: Optional[str] = None,
    department: Optional[str] = None,
    on_sale: Optional[bool] = None,
    is_new: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None
):
    """Get total count of products matching filters"""
    db = get_database()
    products_collection = db["products"]

    try:
        query = {}

        if category:
            query["category"] = {"$regex": category, "$options": "i"}
        if on_sale is not None:
            query["on_sale"] = on_sale
        if is_new is not None:
            query["is_new"] = is_new
        if min_price is not None or max_price is not None:
            query["price"] = {}
            if min_price is not None:
                query["price"]["$gte"] = min_price
            if max_price is not None:
                query["price"]["$lte"] = max_price
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]

        if department:
            dept_clean = department.strip()
            dept_cats = [c["name"] for c in db["categories"].find({"department": {"$regex": f"^{re.escape(dept_clean)}$", "$options": "i"}}, {"name": 1})]
            dept_clauses = [
                {"department": {"$regex": f"^{re.escape(dept_clean)}$", "$options": "i"}}
            ]
            if dept_cats:
                dept_clauses.append({"category": {"$in": dept_cats}})
            if "$or" in query:
                query = {"$and": [query, {"$or": dept_clauses}]}
            else:
                query["$or"] = dept_clauses

        count = products_collection.count_documents(query)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_product_query(product_id: str) -> dict:
    conditions = [{"_id": product_id}, {"id": product_id}]
    if ObjectId.is_valid(product_id):
        conditions.insert(0, {"_id": ObjectId(product_id)})
    return {"$or": conditions}


@router.get("/{product_id}", response_model=Product)
@cache_response(expire_seconds=300)
def get_product(product_id: str, request: Request):
    """Get a single product by ID"""
    db = get_database()
    products_collection = db["products"]

    try:
        product = products_collection.find_one(_build_product_query(product_id))
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return _format_product(product)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{product_id}/view")
def increment_product_view(product_id: str):
    """Increment product view count (called when customer views product detail page)"""
    db = get_database()
    products_collection = db["products"]
    try:
        result = products_collection.find_one_and_update(
            _build_product_query(product_id),
            {"$inc": {"viewers_count": 1}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Product not found")
        clear_api_cache()
        return {"viewers_count": result.get("viewers_count", 1)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{product_id}/wishlist-count")
def update_product_wishlist_count(product_id: str, action: str = Query("add")):
    """Increment or decrement product wishlist_count (works for both guests and members)"""
    db = get_database()
    products_collection = db["products"]
    inc_val = 1 if action == "add" else -1
    try:
        result = products_collection.find_one_and_update(
            _build_product_query(product_id),
            {"$inc": {"wishlist_count": inc_val}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Product not found")
        new_count = result.get("wishlist_count", 0)
        if new_count < 0:
            products_collection.update_one(_build_product_query(product_id), {"$set": {"wishlist_count": 0}})
            new_count = 0
        clear_api_cache()
        return {"wishlist_count": new_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}", response_model=Product)
def update_product(product_id: str, product: ProductUpdate, current_user: dict = Depends(require_admin)):
    """Update a product (Admin only)"""
    db = get_database()
    products_collection = db["products"]

    try:
        update_data = {k: v for k, v in product.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        if "category" in update_data and not update_data.get("department"):
            matched_cat = db["categories"].find_one({"name": {"$regex": f"^{re.escape(update_data['category'])}$", "$options": "i"}})
            if matched_cat and matched_cat.get("department"):
                update_data["department"] = matched_cat["department"]

        result = products_collection.find_one_and_update(
            _build_product_query(product_id),
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Product not found")
        clear_api_cache()
        return _format_product(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: dict = Depends(require_admin)):
    """Delete a product (Admin only)"""
    db = get_database()
    products_collection = db["products"]

    try:
        result = products_collection.delete_one(_build_product_query(product_id))
        clear_api_cache()
        if result.deleted_count == 0:
            return {"message": "Product not found or already deleted", "deleted": False}
        return {"message": "Product deleted successfully", "deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class EmailSharePayload(BaseModel):
    email: str
    custom_message: Optional[str] = None


@router.post("/{product_id}/share-email")
def share_product_email(
    product_id: str,
    payload: EmailSharePayload,
    current_user: dict = Depends(require_admin)
):
    """Send product link email to customer (Admin only)."""
    db = get_database()
    try:
        prod = db["products"].find_one(_build_product_query(product_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    from app.services.notification_service import NotificationService
    notif = NotificationService(db)
    prod_name = prod.get("name", "Product")
    prod_price = prod.get("price", 0)
    prod_img = prod.get("image", "")
    prod_url = f"https://naripehnawa.com/product/{product_id}"
    msg = payload.custom_message or f"Check out this product from Nari Pehnawa: {prod_name}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #8b0000; text-align: center; margin-top: 0;">✨ NARI PEHNAWA</h2>
        <p style="font-size: 14px; color: #334155; text-align: center;">{msg}</p>
        <div style="text-align: center; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
            {f'<img src="{prod_img}" style="max-width: 220px; height: auto; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />' if prod_img else ''}
            <h3 style="margin: 8px 0 4px 0; color: #0f172a; font-size: 16px;">{prod_name}</h3>
            <p style="font-weight: bold; font-size: 20px; color: #d4af37; margin: 4px 0;">₹{prod_price:,.2f}</p>
            <a href="{prod_url}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; margin-top: 14px; font-size: 14px;">View & Order Now</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Nari Pehnawa • Luxury Indian Ethnic Wear</p>
    </div>
    """

    ok = notif.send_raw_email(to_email=payload.email, subject=f"Product Recommendation: {prod_name}", body_html=html_body)
    if not ok:
        raise HTTPException(status_code=500, detail="Could not send email (check SMTP settings in .env)")
    return {"success": True, "message": f"Email sent to {payload.email}"}
