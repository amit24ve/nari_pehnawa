from fastapi import APIRouter, HTTPException, Depends
from app.database import get_database
from app.security import require_admin
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(require_admin)):
    """Get dashboard statistics for admin panel (Admin only)"""
    db = get_database()
    
    try:
        # Get total users count
        total_users = db["users"].count_documents({})
        
        # Get total orders count
        total_orders = db["orders"].count_documents({})
        
        # Calculate total revenue from orders
        orders = list(db["orders"].find())
        total_revenue = sum(order.get("total", 0) for order in orders)
        
        # Get total products count
        total_products = db["products"].count_documents({})
        
        # Get total categories count
        total_categories = db["categories"].count_documents({})
        
        # Get recent orders (last 10)
        recent_orders = list(db["orders"].find().sort("_id", -1).limit(10))
        for order in recent_orders:
            order["id"] = str(order.pop("_id"))
            # Get user info for each order
            if "user_id" in order:
                user = db["users"].find_one({"_id": ObjectId(order["user_id"])})
                if user:
                    order["customer_name"] = user.get("name", "Unknown")
                    order["customer_email"] = user.get("email", "")
        
        # Get top selling products (placeholder - would need order items data)
        top_products = list(db["products"].find().sort("_id", -1).limit(5))
        for product in top_products:
            product["id"] = str(product.pop("_id"))
        
        return {
            "total_users": total_users,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_products": total_products,
            "total_categories": total_categories,
            "recent_orders": recent_orders,
            "top_products": top_products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/summary")
def get_users_summary(current_user: dict = Depends(require_admin)):
    """Get summary of users for admin (Admin only)"""
    db = get_database()
    
    try:
        users = list(db["users"].find())
        
        total = len(users)
        admins = len([u for u in users if u.get("role") == "admin"])
        customers = len([u for u in users if u.get("role") == "customer"])
        
        return {
            "total": total,
            "admins": admins,
            "customers": customers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/summary")
def get_orders_summary(current_user: dict = Depends(require_admin)):
    """Get summary of orders for admin (Admin only)"""
    db = get_database()
    
    try:
        orders = list(db["orders"].find())
        
        total = len(orders)
        pending = len([o for o in orders if o.get("status") == "pending"])
        processing = len([o for o in orders if o.get("status") == "processing"])
        completed = len([o for o in orders if o.get("status") == "completed"])
        cancelled = len([o for o in orders if o.get("status") == "cancelled"])
        
        return {
            "total": total,
            "pending": pending,
            "processing": processing,
            "completed": completed,
            "cancelled": cancelled
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings/delivery")
def get_delivery_settings():
    """Get delivery charge settings and free delivery order rules"""
    db = get_database()
    settings_col = db["settings"]
    setting = settings_col.find_one({"key": "delivery_settings"})
    if not setting:
        return {
            "free_delivery_order_count": 1,
            "default_delivery_charge": 50.0
        }
    return {
        "free_delivery_order_count": setting.get("free_delivery_order_count", 1),
        "default_delivery_charge": setting.get("default_delivery_charge", 50.0)
    }


@router.put("/settings/delivery")
def update_delivery_settings(data: dict, current_user: dict = Depends(require_admin)):
    """Update delivery charge rules (Admin only)"""
    from datetime import datetime
    db = get_database()
    settings_col = db["settings"]

    free_count = int(data.get("free_delivery_order_count", 1))
    default_charge = float(data.get("default_delivery_charge", 50.0))

    settings_col.update_one(
        {"key": "delivery_settings"},
        {
            "$set": {
                "key": "delivery_settings",
                "free_delivery_order_count": free_count,
                "default_delivery_charge": default_charge,
                "updated_at": datetime.now()
            }
        },
        upsert=True
    )
    return {
        "success": True,
        "message": "Delivery settings updated successfully",
        "free_delivery_order_count": free_count,
        "default_delivery_charge": default_charge
    }


# ══════════════════════════════════════════════════════════════════════════
#  FLASH SALE & FESTIVE EVENT MANAGER
# ══════════════════════════════════════════════════════════════════════════

@router.get("/flash-sale")
def get_flash_sale_settings():
    """Get active Flash Sale & Festive Event configuration (Public & Admin)"""
    from datetime import datetime
    db = get_database()
    col = db["flash_sale"]
    sale = col.find_one({"key": "active_sale"})
    
    now = datetime.now()
    if not sale:
        return {
            "key": "active_sale",
            "is_active": True,
            "title": "Grand Festive Flash Sale",
            "subtitle": "Exclusive Handcrafted Luxury Ethnic Wear",
            "discount_percentage": 30,
            "target_type": "all",  # "all" | "category" | "custom_products"
            "target_category": "",
            "target_product_ids": [],
            "start_time": now.isoformat(),
            "end_time": None,
            "is_currently_live": True,
            "seconds_remaining": 0
        }
    
    # Calculate if currently live based on time window
    is_active = bool(sale.get("is_active", False))
    start_time_str = sale.get("start_time")
    end_time_str = sale.get("end_time")
    
    is_currently_live = is_active
    seconds_remaining = 0
    
    if end_time_str:
        try:
            end_dt = datetime.fromisoformat(end_time_str)
            if now > end_dt:
                is_currently_live = False
            else:
                seconds_remaining = max(0, int((end_dt - now).total_seconds()))
        except Exception:
            pass

    if start_time_str:
        try:
            start_dt = datetime.fromisoformat(start_time_str)
            if now < start_dt:
                is_currently_live = False
        except Exception:
            pass

    return {
        "key": "active_sale",
        "is_active": is_active,
        "title": sale.get("title", "Grand Festive Flash Sale"),
        "subtitle": sale.get("subtitle", "Exclusive Handcrafted Luxury Ethnic Wear"),
        "discount_percentage": sale.get("discount_percentage", 30),
        "target_type": sale.get("target_type", "all"),
        "target_category": sale.get("target_category", ""),
        "target_product_ids": sale.get("target_product_ids", []),
        "start_time": start_time_str,
        "end_time": end_time_str,
        "is_currently_live": is_currently_live,
        "seconds_remaining": seconds_remaining
    }


@router.put("/flash-sale")
def update_flash_sale_settings(data: dict, current_user: dict = Depends(require_admin)):
    """Configure & Activate Flash Sale / Event on Products or Categories (Admin only)"""
    from datetime import datetime
    from app.utils.cache import clear_api_cache
    
    db = get_database()
    col = db["flash_sale"]
    products_col = db["products"]
    
    is_active = bool(data.get("is_active", True))
    title = str(data.get("title", "Grand Festive Flash Sale")).strip()
    subtitle = str(data.get("subtitle", "Exclusive Handcrafted Luxury Ethnic Wear")).strip()
    discount_percentage = int(data.get("discount_percentage", 30))
    target_type = str(data.get("target_type", "all")) # "all" | "category" | "custom_products"
    target_category = str(data.get("target_category", "")).strip()
    target_product_ids = data.get("target_product_ids", [])
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    
    sale_doc = {
        "key": "active_sale",
        "is_active": is_active,
        "title": title,
        "subtitle": subtitle,
        "discount_percentage": discount_percentage,
        "target_type": target_type,
        "target_category": target_category,
        "target_product_ids": target_product_ids,
        "start_time": start_time,
        "end_time": end_time,
        "updated_at": datetime.now(),
        "updated_by": current_user.get("email", "admin")
    }
    
    col.update_one({"key": "active_sale"}, {"$set": sale_doc}, upsert=True)
    
    # Synchronize on_sale flag in products collection
    affected_count = 0
    if is_active:
        if target_type == "all":
            res = products_col.update_many({}, {"$set": {"on_sale": True}})
            affected_count = res.modified_count
        elif target_type == "category" and target_category:
            # Reset non-matching first or mark matching
            products_col.update_many({"category": {"$not": {"$regex": f"^{target_category}$", "$options": "i"}}}, {"$set": {"on_sale": False}})
            res = products_col.update_many({"category": {"$regex": f"^{target_category}$", "$options": "i"}}, {"$set": {"on_sale": True}})
            affected_count = res.modified_count
        elif target_type == "custom_products" and target_product_ids:
            obj_ids = []
            for pid in target_product_ids:
                try:
                    obj_ids.append(ObjectId(pid))
                except Exception:
                    pass
            products_col.update_many({"_id": {"$nin": obj_ids}}, {"$set": {"on_sale": False}})
            res = products_col.update_many({"_id": {"$in": obj_ids}}, {"$set": {"on_sale": True}})
            affected_count = res.modified_count
    else:
        # Sale deactivated - reset on_sale on products if desired, or keep as is
        res = products_col.update_many({}, {"$set": {"on_sale": False}})
        affected_count = res.modified_count
        
    clear_api_cache()
    
    return {
        "success": True,
        "message": f"Flash Sale '{title}' successfully updated! {affected_count} products updated.",
        "sale": sale_doc,
        "affected_products": affected_count
    }

