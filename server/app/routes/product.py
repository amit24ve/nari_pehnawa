from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from app.database.schemas.product import Product, ProductCreate, ProductUpdate
from app.database import get_database
from app.security import require_admin
from bson import ObjectId

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
        result = products_collection.insert_one(product_data)
        product_data["_id"] = str(result.inserted_id)
        
        # Trigger background task to send newsletter
        background_tasks.add_task(
            send_new_product_newsletter,
            product_data["_id"],
            product_data.get("name", "New Product"),
            product_data.get("price", 0.0),
            product_data.get("image", "")
        )
        
        return product_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Product])
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=5000),
    category: Optional[str] = None,
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

        cursor = products_collection.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
        products = list(cursor)

        for product in products:
            product["_id"] = str(product["_id"])

        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
def get_product_count(
    category: Optional[str] = None,
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

        count = products_collection.count_documents(query)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str):
    """Get a single product by ID"""
    db = get_database()
    products_collection = db["products"]

    try:
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product["_id"] = str(product["_id"])
        return product
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

        result = products_collection.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Product not found")
        result["_id"] = str(result["_id"])
        return result
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
        result = products_collection.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
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
        prod = db["products"].find_one({"_id": ObjectId(product_id)})
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
