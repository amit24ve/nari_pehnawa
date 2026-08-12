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
