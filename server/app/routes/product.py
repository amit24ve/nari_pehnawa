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
        # Synchronize customization_type and customization_scope
        c_type = product_data.get("customization_type")
        c_scope = product_data.get("customization_scope")
        if c_type == "Top":
            product_data["customization_scope"] = "top_only"
        elif c_type == "Bottom":
            product_data["customization_scope"] = "bottom_only"
        elif c_type == "Top & Bottom":
            product_data["customization_scope"] = "both"
        elif c_scope:
            if c_scope == "top_only":
                product_data["customization_type"] = "Top"
            elif c_scope == "bottom_only":
                product_data["customization_type"] = "Bottom"
            else:
                product_data["customization_type"] = "Top & Bottom"

        if not product_data.get("department") and product_data.get("category"):
            matched_cat = db["categories"].find_one({"name": {"$regex": f"^{re.escape(product_data['category'])}$", "$options": "i"}})
            if matched_cat and matched_cat.get("department"):
                product_data["department"] = matched_cat["department"]
            else:
                product_data["department"] = "Women"
        elif product_data.get("department") == "Clothing":
            product_data["department"] = "Women"

        # Synchronize sub_categories (list) and sub_category (comma-separated string)
        raw_subs = product_data.get("sub_categories")
        raw_sub = product_data.get("sub_category")
        clean_subs = []
        if isinstance(raw_subs, list) and len(raw_subs) > 0:
            clean_subs = [str(s).strip() for s in raw_subs if str(s).strip()]
        elif raw_sub:
            clean_subs = [str(s).strip() for s in str(raw_sub).split(",") if str(s).strip()]
        product_data["sub_categories"] = clean_subs
        product_data["sub_category"] = ", ".join(clean_subs) if clean_subs else (raw_sub or None)

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
    sub_category: Optional[str] = None,
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

        if sub_category:
            sub_clean = sub_category.strip()
            escaped = re.escape(sub_clean)
            sub_cond = {
                "$or": [
                    {"sub_categories": {"$regex": f"^{escaped}$", "$options": "i"}},
                    {"sub_category": {"$regex": f"(^|[,\\s]){escaped}([\\s,]|$)", "$options": "i"}},
                ]
            }
            if "$and" in query:
                query["$and"].append(sub_cond)
            elif "$or" in query:
                existing_or = query.pop("$or")
                query["$and"] = [{"$or": existing_or}, sub_cond]
            else:
                query["$and"] = [sub_cond]

        if on_sale is not None:
            if on_sale:
                sale_cond = [
                    {"on_sale": True},
                    {"mega_sale_price": {"$gt": 0}},
                    {"deal_text": {"$nin": [None, ""]}}
                ]
                if "$or" in query:
                    query["$and"] = [{"$or": query.pop("$or")}, {"$or": sale_cond}]
                else:
                    query["$or"] = sale_cond
            else:
                query["on_sale"] = False
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
            if dept_clean.lower() in ["women", "clothing"]:
                dept_matcher = {"$in": ["Women", "women", "Clothing", "clothing", "Women's Wear"]}
            else:
                dept_matcher = {"$regex": f"^{re.escape(dept_clean)}$", "$options": "i"}
            dept_cats = [c["name"] for c in db["categories"].find({"department": dept_matcher}, {"name": 1})]
            dept_clauses = [
                {"department": dept_matcher}
            ]
            if dept_cats:
                dept_clauses.append({"category": {"$in": dept_cats}})
            if "$or" in query:
                query = {"$and": [query, {"$or": dept_clauses}]}
            else:
                query["$or"] = dept_clauses

        # Multi-vendor guard: Products listed by sellers must be approved by Admin
        vendor_approval_clause = {
            "$or": [
                {"seller_id": {"$exists": False}},
                {"seller_id": None},
                {"seller_id": ""},
                {"is_approved": True},
                {"approval_status": "approved"},
            ]
        }
        active_clause = {
            "$or": [
                {"is_active": True},
                {"is_active": {"$exists": False}},
            ]
        }

        if "$and" in query:
            query["$and"].extend([vendor_approval_clause, active_clause])
        elif query:
            query = {"$and": [query, vendor_approval_clause, active_clause]}
        else:
            query = {"$and": [vendor_approval_clause, active_clause]}

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
            if on_sale:
                sale_cond = [
                    {"on_sale": True},
                    {"mega_sale_price": {"$gt": 0}},
                    {"deal_text": {"$nin": [None, ""]}}
                ]
                if "$or" in query:
                    query["$and"] = [{"$or": query.pop("$or")}, {"$or": sale_cond}]
                else:
                    query["$or"] = sale_cond
            else:
                query["on_sale"] = False
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
            if dept_clean.lower() in ["women", "clothing"]:
                dept_matcher = {"$in": ["Women", "women", "Clothing", "clothing", "Women's Wear"]}
            else:
                dept_matcher = {"$regex": f"^{re.escape(dept_clean)}$", "$options": "i"}
            dept_cats = [c["name"] for c in db["categories"].find({"department": dept_matcher}, {"name": 1})]
            dept_clauses = [
                {"department": dept_matcher}
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
    conditions = [
        {"_id": product_id},
        {"id": product_id},
        {"sku": product_id},
        {"meta_catalog_id": product_id},
        {"slug": product_id},
    ]
    if ObjectId.is_valid(product_id):
        conditions.insert(0, {"_id": ObjectId(product_id)})

    # Also support fuzzy slug or name matching if product_id contains words (e.g. "product_1_sky_bloom" or "sky-bloom")
    clean_str = product_id.replace("_", "-").replace(" ", "-")
    words = [re.escape(w) for w in clean_str.split("-") if len(w) > 2 and w.lower() not in ["product", "item", "null", "undefined"]]
    if words:
        pattern = ".*".join(words)
        conditions.append({"name": {"$regex": pattern, "$options": "i"}})
        conditions.append({"slug": {"$regex": pattern, "$options": "i"}})

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

        # Synchronize customization_type and customization_scope
        c_type = update_data.get("customization_type")
        c_scope = update_data.get("customization_scope")
        if c_type == "Top":
            update_data["customization_scope"] = "top_only"
        elif c_type == "Bottom":
            update_data["customization_scope"] = "bottom_only"
        elif c_type == "Top & Bottom":
            update_data["customization_scope"] = "both"
        elif c_scope:
            if c_scope == "top_only":
                update_data["customization_type"] = "Top"
            elif c_scope == "bottom_only":
                update_data["customization_type"] = "Bottom"
            else:
                update_data["customization_type"] = "Top & Bottom"

        if "category" in update_data and not update_data.get("department"):
            matched_cat = db["categories"].find_one({"name": {"$regex": f"^{re.escape(update_data['category'])}$", "$options": "i"}})
            if matched_cat and matched_cat.get("department"):
                update_data["department"] = matched_cat["department"]

        # Synchronize sub_categories (list) and sub_category (comma-separated string)
        if "sub_categories" in update_data or "sub_category" in update_data:
            raw_subs = update_data.get("sub_categories")
            raw_sub = update_data.get("sub_category")
            clean_subs = []
            if isinstance(raw_subs, list):
                clean_subs = [str(s).strip() for s in raw_subs if str(s).strip()]
            elif raw_sub:
                clean_subs = [str(s).strip() for s in str(raw_sub).split(",") if str(s).strip()]
            update_data["sub_categories"] = clean_subs
            update_data["sub_category"] = ", ".join(clean_subs) if clean_subs else (raw_sub if raw_sub is not None else None)

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


# ─────────────────────────────────────────────────────────────────────────────
# Product Customer Q&A System with Admin Reply
# ─────────────────────────────────────────────────────────────────────────────

class ProductQuestionCreate(BaseModel):
    question: str
    customer_name: Optional[str] = "Customer"
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None


class ProductQuestionReply(BaseModel):
    reply: str


@router.post("/{product_id}/questions")
def submit_product_question(product_id: str, payload: ProductQuestionCreate):
    """Customer asks a question on product detail page"""
    from datetime import datetime, timezone
    import uuid

    db = get_database()
    prod = db["products"].find_one(_build_product_query(product_id))
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    cleaned_q = payload.question.strip()
    if not cleaned_q:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    now_iso = datetime.now(timezone.utc).isoformat()
    q_id = f"Q-{uuid.uuid4().hex[:8].upper()}"
    canonical_id = str(prod["_id"])
    prod_name = prod.get("name", "Product")
    prod_image = prod.get("image", "")

    question_doc = {
        "id": q_id,
        "product_id": canonical_id,
        "product_name": prod_name,
        "product_image": prod_image,
        "question": cleaned_q,
        "customer_name": (payload.customer_name or "Customer").strip(),
        "customer_phone": (payload.customer_phone or "").strip() or None,
        "customer_email": (payload.customer_email or "").strip().lower() or None,
        "reply": None,
        "status": "pending",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    db["product_questions"].insert_one(question_doc)

    # Also log to customer_inquiries so Admin can manage and reply from the unified Inquiries dashboard
    inquiry_doc = {
        "id": f"INQ-{q_id}",
        "inquiry_type": "product_question",
        "question_id": q_id,
        "product_id": canonical_id,
        "product_name": prod_name,
        "product_image": prod_image,
        "name": (payload.customer_name or "Customer").strip(),
        "phone": (payload.customer_phone or "Not provided").strip(),
        "email": (payload.customer_email or "").strip().lower() or None,
        "subject": f"Q&A: {prod_name}",
        "message": cleaned_q,
        "status": "New",
        "created_at": now_iso,
        "updated_at": now_iso
    }
    try:
        db["customer_inquiries"].insert_one(inquiry_doc)
        db["admin_notifications"].insert_one({
            "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            "type": "product_question",
            "title": f"New Customer Question on {prod_name}",
            "message": f"{payload.customer_name or 'Customer'}: {cleaned_q[:80]}...",
            "link": f"/admin/inquiries?type=product_question",
            "is_read": False,
            "created_at": now_iso
        })
    except Exception as e:
        print(f"Error logging customer_inquiry for question: {e}")

    return {
        "success": True,
        "message": "Thank you! Your question has been submitted. Our team will answer shortly.",
        "question_id": q_id
    }


@router.get("/{product_id}/questions")
def get_product_questions(product_id: str):
    """Get all public answered questions for a product (merged with default product Q&A)"""
    db = get_database()
    prod = db["products"].find_one(_build_product_query(product_id))
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    canonical_id = str(prod["_id"])
    
    # 1. Answered questions from dynamic product_questions collection
    db_questions = list(db["product_questions"].find(
        {"product_id": canonical_id, "status": "answered"},
        {"_id": 0}
    ).sort("created_at", -1))

    # Format into unified list
    results = []
    seen_q = set()
    for q_item in db_questions:
        q_text = q_item.get("question") or q_item.get("q")
        a_text = q_item.get("reply") or q_item.get("a")
        if q_text and a_text:
            results.append({
                "id": q_item.get("id"),
                "q": q_text,
                "a": a_text,
                "customer_name": q_item.get("customer_name") or "Verified Customer",
                "replied_at": q_item.get("replied_at"),
                "is_official": True
            })
            seen_q.add(q_text.strip().lower())

    # 2. Merge static Q&A stored on product if not already present
    prod_qa = prod.get("q_and_a") or []
    for item in prod_qa:
        if isinstance(item, dict):
            q = item.get("q") or item.get("question")
            a = item.get("a") or item.get("answer") or item.get("reply")
            if q and a and q.strip().lower() not in seen_q:
                results.append({
                    "id": f"static-{len(results)}",
                    "q": q,
                    "a": a,
                    "customer_name": "Verified Customer",
                    "replied_at": None,
                    "is_official": True
                })
                seen_q.add(q.strip().lower())

    return results


@router.post("/{product_id}/questions/{question_id}/reply")
def reply_product_question(
    product_id: str,
    question_id: str,
    payload: ProductQuestionReply,
    current_user: dict = Depends(require_admin)
):
    """Admin replies to a customer question and publishes answer to live product page"""
    from datetime import datetime, timezone
    db = get_database()
    reply_text = payload.reply.strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Reply message cannot be empty")

    now_iso = datetime.now(timezone.utc).isoformat()
    q_doc = db["product_questions"].find_one({"id": question_id})
    if not q_doc:
        raise HTTPException(status_code=404, detail="Question not found")

    # Update question in product_questions
    db["product_questions"].update_one(
        {"id": question_id},
        {"$set": {
            "reply": reply_text,
            "status": "answered",
            "replied_by": current_user.get("email") or "Admin",
            "replied_at": now_iso,
            "updated_at": now_iso
        }}
    )

    # Sync into product.q_and_a array so it's permanently part of product
    prod_q = q_doc.get("question")
    if prod_q:
        db["products"].update_one(
            _build_product_query(product_id),
            {"$push": {"q_and_a": {"q": prod_q, "a": reply_text}}}
        )

    # Sync inquiry status
    db["customer_inquiries"].update_one(
        {"$or": [{"question_id": question_id}, {"id": f"INQ-{question_id}"}]},
        {"$set": {
            "reply_message": reply_text,
            "status": "Solved",
            "replied_at": now_iso,
            "updated_at": now_iso
        }}
    )

    clear_api_cache()
    return {"success": True, "message": "Reply published successfully to product page!"}
