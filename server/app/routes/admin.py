from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from app.database import get_database
from app.security import require_admin
from bson import ObjectId

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(require_admin)):
    """Get dashboard statistics for admin panel (Admin only)"""
    db = get_database()
    
    try:
        # Get total users count (excluding admin)
        total_users = db["users"].count_documents({"role": {"$ne": "admin"}})
        
        # Get total orders count and revenue
        orders = list(db["orders"].find())
        total_orders = len(orders)
        total_revenue = sum(float(order.get("total", 0) or 0) for order in orders if order.get("status") not in ["cancelled", "refunded"])
        
        # Get total products count
        total_products = db["products"].count_documents({})
        
        # Get total categories count
        total_categories = db["categories"].count_documents({})
        
        # Get recent orders (last 10)
        recent_orders = list(db["orders"].find().sort("_id", -1).limit(10))
        for order in recent_orders:
            order["id"] = str(order.pop("_id"))
            if "user_id" in order and order["user_id"]:
                try:
                    user = db["users"].find_one({"_id": ObjectId(order["user_id"])})
                    if user:
                        order["customer_name"] = user.get("full_name") or user.get("name") or "Customer"
                        order["customer_email"] = user.get("email", "")
                except Exception:
                    pass
            if not order.get("customer_name"):
                order["customer_name"] = order.get("shipping_address", {}).get("name") or "Customer"
        
        # Compute real Top Selling Products from order items
        sales_by_product = {}
        for order in orders:
            if order.get("status") in ["cancelled", "refunded"]:
                continue
            items = order.get("items", []) or []
            for item in items:
                pid = str(item.get("product_id") or item.get("id") or "")
                qty = int(item.get("quantity") or 1)
                if pid:
                    sales_by_product[pid] = sales_by_product.get(pid, 0) + qty
        
        top_selling_products = []
        if sales_by_product:
            sorted_sales = sorted(sales_by_product.items(), key=lambda x: x[1], reverse=True)[:6]
            for pid, sold_count in sorted_sales:
                p_doc = None
                if ObjectId.is_valid(pid):
                    p_doc = db["products"].find_one({"_id": ObjectId(pid)})
                if not p_doc:
                    p_doc = db["products"].find_one({"id": pid})
                if p_doc:
                    img = ""
                    if p_doc.get("images") and len(p_doc["images"]) > 0:
                        img = p_doc["images"][0]
                    elif p_doc.get("image"):
                        img = p_doc.get("image")
                    top_selling_products.append({
                        "id": str(p_doc.get("_id") or pid),
                        "name": p_doc.get("name") or p_doc.get("title") or "Kurti",
                        "sales": f"{sold_count}+ sold" if sold_count > 1 else f"{sold_count} sold",
                        "sold_count": sold_count,
                        "image": img or "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&h=100&fit=crop",
                        "price": float(p_doc.get("price", 0) or 0)
                    })
        
        # Dynamic visitors count
        total_visitors = db["visitors"].count_documents({}) or db["visits"].count_documents({})
        
        # Dynamic carts total item quantity
        total_carts = 0
        for cart in db["carts"].find():
            items = cart.get("items", []) or []
            total_carts += sum(int(it.get("quantity", 1) or 1) for it in items)
            
        # Dynamic wishlist count
        total_wishlist = 0
        for w in db["wishlist"].find():
            prods = w.get("products", []) or w.get("items", []) or []
            total_wishlist += len(prods) if prods else 1
            
        # Dynamic traffic sources
        traffic_sources = []
        if total_visitors > 0:
            sources_agg = list(db["visitors"].aggregate([
                {"$group": {"_id": "$source", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]))
            if sources_agg:
                for s in sources_agg:
                    label = str(s.get("_id") or "Direct").replace("_", " ").title()
                    traffic_sources.append({"label": label, "value": s.get("count", 0)})
        if not traffic_sources:
            traffic_sources = [
                {"label": "Direct", "value": total_visitors},
                {"label": "Organic Search", "value": 0},
                {"label": "Social Media", "value": 0},
                {"label": "Referral", "value": 0}
            ]
        
        return {
            "total_users": total_users,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_products": total_products,
            "total_categories": total_categories,
            "total_visitors": total_visitors,
            "total_carts": total_carts,
            "total_wishlist": total_wishlist,
            "recent_orders": recent_orders,
            "top_selling_products": top_selling_products,
            "top_products": top_selling_products,
            "traffic_sources": traffic_sources
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
# FLASH SALE & FESTIVE PROMOTIONS (MULTI-CAMPAIGN IST SUPPORT)
# ══════════════════════════════════════════════════════════════════════════

def get_now_ist() -> datetime:
    return datetime.now(IST)

def parse_iso_ist(dt_str) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=IST)
        else:
            dt = dt.astimezone(IST)
        return dt
    except Exception:
        return None

def evaluate_sale_live(sale: dict, now_ist: datetime):
    is_active = bool(sale.get("is_active", True))
    start_dt = parse_iso_ist(sale.get("start_time"))
    end_dt = parse_iso_ist(sale.get("end_time"))
    
    if not is_active:
        return False, 0, "inactive"
    
    if start_dt and now_ist < start_dt:
        return False, 0, "upcoming"
        
    if end_dt:
        if now_ist > end_dt:
            return False, 0, "expired"
        else:
            seconds_remaining = max(0, int((end_dt - now_ist).total_seconds()))
            return True, seconds_remaining, "live"
            
    return True, 0, "live"

def format_sale_dict(sale: dict, now_ist: datetime) -> dict:
    is_live, remaining, status = evaluate_sale_live(sale, now_ist)
    sale_id = str(sale.get("_id") or sale.get("id") or "active_sale")
    return {
        "id": sale_id,
        "_id": sale_id,
        "key": sale.get("key", sale_id),
        "title": sale.get("title", "Grand Festive Flash Sale"),
        "subtitle": sale.get("subtitle", "Exclusive Handcrafted Luxury Ethnic Wear"),
        "deal_type": sale.get("deal_type", "percentage"),
        "deal_text": sale.get("deal_text", ""),
        "buy_qty": int(sale.get("buy_qty", 1) or 1),
        "get_free_qty": int(sale.get("get_free_qty", 1) or 1),
        "discount_percentage": int(sale.get("discount_percentage", 30) or 30),
        "target_type": sale.get("target_type", "all"),
        "target_category": sale.get("target_category", "") or "",
        "target_product_ids": sale.get("target_product_ids", []) or [],
        "start_time": sale.get("start_time"),
        "end_time": sale.get("end_time"),
        "banner_image": str(sale.get("banner_image") or sale.get("image") or "").strip(),
        "is_active": bool(sale.get("is_active", True)),
        "is_currently_live": is_live,
        "seconds_remaining": remaining,
        "status": status,
        "created_at": str(sale.get("created_at") or ""),
        "updated_at": str(sale.get("updated_at") or "")
    }

def sync_flash_sales_to_products(db):
    """Synchronize live sale badges, titles, and on_sale flags onto products collection in MongoDB."""
    now_ist = get_now_ist()
    sales_col = db["flash_sales"]
    products_col = db["products"]
    
    all_sales = list(sales_col.find({}))
    if not all_sales:
        legacy = db["flash_sale"].find_one({"key": "active_sale"})
        if legacy:
            all_sales = [legacy]
            
    live_sales = []
    for s in all_sales:
        is_live, _, _ = evaluate_sale_live(s, now_ist)
        if is_live:
            live_sales.append(s)
            
    # Reset sale fields on all products first
    products_col.update_many({}, {
        "$set": {
            "on_sale": False,
            "sale_title": None,
            "deal_text": None,
            "deal_type": None,
            "buy_qty": None,
            "get_free_qty": None
        }
    })
    
    if not live_sales:
        return 0
        
    total_affected = 0
    # Process sales from general to specific ("all" first, then "category", then "custom_products")
    order_map = {"all": 1, "category": 2, "custom_products": 3}
    sorted_sales = sorted(live_sales, key=lambda x: order_map.get(x.get("target_type", "all"), 1))
    
    for sale in sorted_sales:
        s_title = sale.get("title", "Flash Sale")
        s_deal_text = sale.get("deal_text", "")
        s_deal_type = sale.get("deal_type", "percentage")
        s_buy_qty = int(sale.get("buy_qty", 1) or 1)
        s_free_qty = int(sale.get("get_free_qty", 1) or 1)
        ttype = sale.get("target_type", "all")
        tcat = sale.get("target_category", "")
        tpids = sale.get("target_product_ids", []) or []
        
        sale_update = {
            "$set": {
                "on_sale": True,
                "sale_title": s_title,
                "deal_text": s_deal_text,
                "deal_type": s_deal_type,
                "buy_qty": s_buy_qty,
                "get_free_qty": s_free_qty
            }
        }
        
        if ttype == "all":
            res = products_col.update_many({}, sale_update)
            total_affected += res.modified_count
        elif ttype == "category" and tcat:
            if tpids and len(tpids) > 0:
                obj_ids = []
                for pid in tpids:
                    try:
                        obj_ids.append(ObjectId(pid))
                    except Exception:
                        pass
                res = products_col.update_many({"_id": {"$in": obj_ids}}, sale_update)
                total_affected += res.modified_count
            else:
                res = products_col.update_many({"category": {"$regex": f"^{tcat}$", "$options": "i"}}, sale_update)
                total_affected += res.modified_count
        elif ttype == "custom_products" and tpids:
            obj_ids = []
            for pid in tpids:
                try:
                    obj_ids.append(ObjectId(pid))
                except Exception:
                    pass
            res = products_col.update_many({"_id": {"$in": obj_ids}}, sale_update)
            total_affected += res.modified_count
            
    return total_affected


@router.get("/flash-sales")
def get_all_flash_sales(current_user: dict = Depends(require_admin)):
    """Get all configured flash sale campaigns with IST live status (Admin only)"""
    db = get_database()
    sales_col = db["flash_sales"]
    now_ist = get_now_ist()
    
    sales = list(sales_col.find({}).sort("updated_at", -1))
    
    # If no multi-campaigns exist yet, migrate from legacy flash_sale collection
    if not sales:
        legacy = db["flash_sale"].find_one({"key": "active_sale"})
        if legacy:
            legacy.pop("_id", None)
            legacy["created_at"] = now_ist.isoformat()
            legacy["updated_at"] = now_ist.isoformat()
            ins = sales_col.insert_one(legacy)
            legacy["_id"] = str(ins.inserted_id)
            sales = [legacy]
            
    formatted = [format_sale_dict(s, now_ist) for s in sales]
    return {
        "sales": formatted,
        "current_ist_time": now_ist.isoformat(),
        "total_campaigns": len(formatted),
        "live_campaigns_count": sum(1 for s in formatted if s["is_currently_live"])
    }


@router.post("/flash-sales")
def create_flash_sale(data: dict, current_user: dict = Depends(require_admin)):
    """Create a new promotional offer / flash sale campaign (Admin only)"""
    from app.utils.cache import clear_api_cache
    db = get_database()
    sales_col = db["flash_sales"]
    now_ist = get_now_ist()
    
    title = str(data.get("title", "New Promotional Flash Sale")).strip()
    subtitle = str(data.get("subtitle", "")).strip()
    deal_type = str(data.get("deal_type", "bogo")).strip()
    deal_text = str(data.get("deal_text", "")).strip()
    buy_qty = int(data.get("buy_qty", 1) or 1)
    get_free_qty = int(data.get("get_free_qty", 1) or 1)
    discount_percentage = int(data.get("discount_percentage", 30) or 30)
    target_type = str(data.get("target_type", "all")).strip()
    target_category = str(data.get("target_category", "")).strip()
    target_product_ids = data.get("target_product_ids", []) or []
    start_time = data.get("start_time") or now_ist.isoformat()
    end_time = data.get("end_time")
    banner_image = str(data.get("banner_image") or data.get("image") or "").strip()
    is_active = bool(data.get("is_active", True))
    
    doc = {
        "title": title,
        "subtitle": subtitle,
        "deal_type": deal_type,
        "deal_text": deal_text,
        "buy_qty": buy_qty,
        "get_free_qty": get_free_qty,
        "discount_percentage": discount_percentage,
        "target_type": target_type,
        "target_category": target_category,
        "target_product_ids": target_product_ids,
        "start_time": start_time,
        "end_time": end_time,
        "banner_image": banner_image,
        "is_active": is_active,
        "created_at": now_ist.isoformat(),
        "updated_at": now_ist.isoformat(),
        "created_by": current_user.get("email", "admin")
    }
    res = sales_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    doc["id"] = str(res.inserted_id)
    
    # Also sync legacy active_sale for existing listeners
    db["flash_sale"].update_one({"key": "active_sale"}, {"$set": doc}, upsert=True)
    
    affected = sync_flash_sales_to_products(db)
    clear_api_cache()
    
    return {
        "success": True,
        "message": f"Offer '{title}' created successfully!",
        "sale": format_sale_dict(doc, now_ist),
        "affected_products": affected
    }


@router.put("/flash-sales/{sale_id}")
def update_flash_sale_by_id(sale_id: str, data: dict, current_user: dict = Depends(require_admin)):
    """Update an existing campaign by ID (Admin only)"""
    from app.utils.cache import clear_api_cache
    db = get_database()
    sales_col = db["flash_sales"]
    now_ist = get_now_ist()
    
    query = {"_id": ObjectId(sale_id)} if ObjectId.is_valid(sale_id) else {"_id": sale_id}
    sale = sales_col.find_one(query)
    if not sale:
        sale = sales_col.find_one({"key": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    title = str(data.get("title", sale.get("title", ""))).strip()
    subtitle = str(data.get("subtitle", sale.get("subtitle", ""))).strip()
    deal_type = str(data.get("deal_type", sale.get("deal_type", "bogo"))).strip()
    deal_text = str(data.get("deal_text", sale.get("deal_text", ""))).strip()
    buy_qty = int(data.get("buy_qty", sale.get("buy_qty", 1)) or 1)
    get_free_qty = int(data.get("get_free_qty", sale.get("get_free_qty", 1)) or 1)
    discount_percentage = int(data.get("discount_percentage", sale.get("discount_percentage", 30)) or 30)
    target_type = str(data.get("target_type", sale.get("target_type", "all"))).strip()
    target_category = str(data.get("target_category", sale.get("target_category", ""))).strip()
    target_product_ids = data.get("target_product_ids", sale.get("target_product_ids", [])) or []
    start_time = data.get("start_time", sale.get("start_time"))
    end_time = data.get("end_time", sale.get("end_time"))
    banner_image = str(data.get("banner_image") if "banner_image" in data else data.get("image", sale.get("banner_image", "")) or "").strip()
    is_active = bool(data.get("is_active", sale.get("is_active", True)))
    
    update_data = {
        "title": title,
        "subtitle": subtitle,
        "deal_type": deal_type,
        "deal_text": deal_text,
        "buy_qty": buy_qty,
        "get_free_qty": get_free_qty,
        "discount_percentage": discount_percentage,
        "target_type": target_type,
        "target_category": target_category,
        "target_product_ids": target_product_ids,
        "start_time": start_time,
        "end_time": end_time,
        "banner_image": banner_image,
        "is_active": is_active,
        "updated_at": now_ist.isoformat(),
        "updated_by": current_user.get("email", "admin")
    }
    
    sales_col.update_one({"_id": sale["_id"]}, {"$set": update_data})
    sale.update(update_data)
    
    # Sync legacy active_sale
    db["flash_sale"].update_one({"key": "active_sale"}, {"$set": update_data}, upsert=True)
    
    affected = sync_flash_sales_to_products(db)
    clear_api_cache()
    
    return {
        "success": True,
        "message": f"Campaign '{title}' updated successfully!",
        "sale": format_sale_dict(sale, now_ist),
        "affected_products": affected
    }


@router.delete("/flash-sales/{sale_id}")
def delete_flash_sale_by_id(sale_id: str, current_user: dict = Depends(require_admin)):
    """Delete a promotional flash sale campaign (Admin only)"""
    from app.utils.cache import clear_api_cache
    db = get_database()
    sales_col = db["flash_sales"]
    
    query = {"_id": ObjectId(sale_id)} if ObjectId.is_valid(sale_id) else {"_id": sale_id}
    res = sales_col.delete_one(query)
    if res.deleted_count == 0:
        sales_col.delete_one({"key": sale_id})
        
    affected = sync_flash_sales_to_products(db)
    clear_api_cache()
    
    return {"success": True, "message": "Campaign deleted successfully!", "affected_products": affected}


@router.get("/flash-sale")
def get_flash_sale_settings():
    """Get active Flash Sale & Festive Event configuration (Public & Storefront in IST)"""
    db = get_database()
    sales_col = db["flash_sales"]
    now_ist = get_now_ist()
    
    # Fetch all campaigns
    campaigns = list(sales_col.find({}))
    if not campaigns:
        legacy = db["flash_sale"].find_one({"key": "active_sale"})
        if legacy:
            campaigns = [legacy]
            
    formatted_all = [format_sale_dict(c, now_ist) for c in campaigns]
    live_sales = [c for c in formatted_all if c["is_currently_live"]]
    
    # Select primary active sale for root-level backwards compatibility
    primary_sale = None
    if live_sales:
        order_map = {"custom_products": 3, "category": 2, "all": 1}
        primary_sale = sorted(live_sales, key=lambda x: order_map.get(x.get("target_type", "all"), 1), reverse=True)[0]
    elif formatted_all:
        primary_sale = formatted_all[0]
    else:
        primary_sale = {
            "id": "active_sale",
            "key": "active_sale",
            "is_active": False,
            "title": "Grand Festive Flash Sale",
            "subtitle": "Exclusive Handcrafted Luxury Ethnic Wear",
            "deal_type": "percentage",
            "deal_text": "FLAT 30% OFF",
            "buy_qty": 1,
            "get_free_qty": 1,
            "discount_percentage": 30,
            "target_type": "all",
            "target_category": "",
            "target_product_ids": [],
            "start_time": now_ist.isoformat(),
            "end_time": None,
            "banner_image": "",
            "is_currently_live": False,
            "seconds_remaining": 0,
            "status": "inactive"
        }
        
    response = dict(primary_sale)
    response["active_sales"] = live_sales
    response["all_sales"] = formatted_all
    response["current_ist_time"] = now_ist.isoformat()
    return response


@router.put("/flash-sale")
def update_flash_sale_settings(data: dict, current_user: dict = Depends(require_admin)):
    """Configure & Activate Flash Sale / Event on Products or Categories (Admin only)"""
    from app.utils.cache import clear_api_cache
    db = get_database()
    sales_col = db["flash_sales"]
    now_ist = get_now_ist()
    
    title = str(data.get("title", "Grand Festive Flash Sale")).strip()
    subtitle = str(data.get("subtitle", "Exclusive Handcrafted Luxury Ethnic Wear")).strip()
    deal_type = str(data.get("deal_type", "percentage")).strip()
    deal_text = str(data.get("deal_text", "")).strip()
    buy_qty = int(data.get("buy_qty", 1) or 1)
    get_free_qty = int(data.get("get_free_qty", 1) or 1)
    discount_percentage = int(data.get("discount_percentage", 30) or 30)
    target_type = str(data.get("target_type", "all")).strip()
    target_category = str(data.get("target_category", "")).strip()
    target_product_ids = data.get("target_product_ids", []) or []
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    banner_image = str(data.get("banner_image") or data.get("image") or "").strip()
    is_active = bool(data.get("is_active", True))
    sale_id = data.get("id") or data.get("_id")
    
    sale_doc = {
        "key": "active_sale",
        "is_active": is_active,
        "title": title,
        "subtitle": subtitle,
        "deal_type": deal_type,
        "deal_text": deal_text,
        "buy_qty": buy_qty,
        "get_free_qty": get_free_qty,
        "discount_percentage": discount_percentage,
        "target_type": target_type,
        "target_category": target_category,
        "target_product_ids": target_product_ids,
        "start_time": start_time,
        "end_time": end_time,
        "banner_image": banner_image,
        "updated_at": now_ist.isoformat(),
        "updated_by": current_user.get("email", "admin")
    }
    
    if sale_id and ObjectId.is_valid(sale_id):
        sales_col.update_one({"_id": ObjectId(sale_id)}, {"$set": sale_doc}, upsert=True)
    else:
        sales_col.update_one({"key": "active_sale"}, {"$set": sale_doc}, upsert=True)
        
    db["flash_sale"].update_one({"key": "active_sale"}, {"$set": sale_doc}, upsert=True)
    
    affected_count = sync_flash_sales_to_products(db)
    clear_api_cache()
    
    return {
        "success": True,
        "message": f"Flash Sale '{title}' successfully updated! {affected_count} products synchronized.",
        "sale": format_sale_dict(sale_doc, now_ist),
        "affected_products": affected_count
    }


