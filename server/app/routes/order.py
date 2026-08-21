from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.database import get_database
from app.database.schemas.order import Order, OrderCreate, OrderUpdate, CANCELLABLE_STATUSES
from app.database.schemas.notification import NotificationEvent
from app.database.schemas.return_refund import CancellationCreate, CancellationStatus
from app.security import get_current_user, require_admin
from app.services.inventory_service import InventoryService, StockLineItem
from app.services.notification_service import NotificationService
from bson import ObjectId
from datetime import datetime
import random
import string

router = APIRouter(prefix="/orders", tags=["Orders"])

# Status transitions that should fire a customer notification, mapped to
# the corresponding NotificationEvent. Any status not in this map simply
# doesn't trigger a notification (e.g. internal-only statuses).
_STATUS_NOTIFICATION_MAP = {
    "packed": NotificationEvent.ORDER_PACKED,
    "shipped": NotificationEvent.ORDER_SHIPPED,
    "out_for_delivery": NotificationEvent.OUT_FOR_DELIVERY,
    "delivered": NotificationEvent.ORDER_DELIVERED,
    "completed": NotificationEvent.ORDER_DELIVERED,
    "cancelled": NotificationEvent.ORDER_CANCELLED,
}


def generate_order_number():
    """Generate a unique order number"""
    return "ORD-" + ''.join(random.choices(string.digits, k=4))


def _stock_items_from_order(order: dict) -> list[StockLineItem]:
    items = order.get("items", []) or []
    result = []
    for item in items:
        pid = item.get("product_id")
        qty = int(item.get("quantity") or 1)
        sz = item.get("size")
        if pid:
            result.append(StockLineItem(product_id=str(pid), quantity=qty, size=sz))
    return result


def _log_order_status_change(
    db, order_id: str, from_status: Optional[str], to_status: str,
    changed_by: str, changed_by_role: str, reason: Optional[str] = None,
) -> None:
    db["order_logs"].insert_one(
        {
            "order_id": order_id,
            "from_status": from_status,
            "to_status": to_status,
            "changed_by": changed_by,
            "changed_by_role": changed_by_role,
            "reason": reason,
            "created_at": datetime.now(),
        }
    )


def _notify_status_change(db, order: dict, new_status: str) -> None:
    """Fires the matching customer notification for a status transition, in
    a background thread so it never adds latency to the admin's request."""
    event = _STATUS_NOTIFICATION_MAP.get(new_status)
    if not event:
        return

    import threading

    def _run():
        try:
            notif = NotificationService(db)
            addr = order.get("shipping_address", {}) or {}
            shipping = order.get("shipping", {}) or {}
            notif.notify(
                event,
                {
                    "customer_name": addr.get("full_name") or "Customer",
                    "order_number": order.get("order_number", ""),
                    "amount": f"{float(order.get('total_amount', 0)):,.2f}",
                    "courier_name": shipping.get("courier_name") or "our courier partner",
                    "awb": shipping.get("awb") or "",
                    "tracking_url": shipping.get("tracking_url") or "",
                },
                to_email=order.get("customer_email") or addr.get("email"),
                to_phone=addr.get("phone"),
                user_id=order.get("user_id"),
                order_id=str(order.get("_id")),
            )
        except Exception as exc:
            print(f"[Notification] status-change notify failed for order {order.get('_id')}: {exc}")

    threading.Thread(target=_run, daemon=True).start()


@router.post("/", response_model=Order, status_code=201)
def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Create a new order"""
    db = get_database()
    orders_collection = db["orders"]
    try:
        order_data = order.model_dump()
        order_data["order_number"] = generate_order_number()
        order_data["status"] = "pending"
        order_data["payment_status"] = "pending"
        order_data["created_at"] = datetime.now()
        
        result = orders_collection.insert_one(order_data)
        order_data["_id"] = str(result.inserted_id)

        # Atomically reduce inventory & size stock in MongoDB
        try:
            stock_items = _stock_items_from_order(order_data)
            if stock_items:
                InventoryService(db).reduce_stock_for_order(stock_items, order_data["_id"])
        except Exception as stock_err:
            print(f"[Order] Stock reduction note: {stock_err}")

        _log_order_status_change(
            db, order_data["_id"], None, "pending",
            changed_by=current_user.get("id", "unknown"), changed_by_role="customer",
            reason="Order created",
        )
        return order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_orders(
    skip: int = 0, 
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """Get all orders with filters (Admin only)"""
    db = get_database()
    orders_collection = db["orders"]
    users_collection = db["users"]
    products_collection = db["products"]
    
    try:
        query = {}
        if status:
            query["status"] = status
        
        orders = list(orders_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
        result = []
        
        for order in orders:
            order_dict = {
                "id": str(order["_id"]),
                "order_number": order.get("order_number") or order.get("order_id") or f"ORD-{str(order['_id'])[-6:]}",
                "user_id": order.get("user_id"),
                "total_amount": order.get("total_amount", 0),
                "status": order.get("status", "pending"),
                "payment_status": order.get("payment_status", "pending"),
                "payment_method": order.get("payment_method", "N/A"),
                "shipping_address": order.get("shipping_address", "N/A"),
                "created_at": order.get("created_at"),
                "user": None,
                "items": []
            }
            
            # Get user info
            user_name = "Unknown"
            user_email = ""
            user_phone = "N/A"
            if "user_id" in order and order["user_id"]:
                try:
                    user_obj_id = ObjectId(order["user_id"]) if isinstance(order["user_id"], str) else order["user_id"]
                    user = users_collection.find_one({"_id": user_obj_id})
                    if user:
                        user_name = user.get("name") or user.get("username") or "Unknown"
                        user_email = user.get("email") or ""
                        user_phone = user.get("phone") or "N/A"
                except Exception as e:
                    print(f"Error fetching user: {e}")
            
            # Fallback to direct top-level keys (common in dummy seeded orders)
            if user_name == "Unknown" or not user_name:
                user_name = order.get("customer_name") or "Unknown"
            if user_phone == "N/A" or not user_phone:
                user_phone = order.get("phone") or "N/A"
            if not user_email:
                user_email = order.get("email") or order.get("customer_email") or ""

            # Fallback to shipping address sub-document (common in checkout orders)
            shipping_addr = order.get("shipping_address")
            if isinstance(shipping_addr, dict):
                if user_name == "Unknown" or not user_name:
                    user_name = shipping_addr.get("full_name") or "Unknown"
                if user_phone == "N/A" or not user_phone:
                    user_phone = shipping_addr.get("phone") or "N/A"
                if not user_email:
                    user_email = shipping_addr.get("email") or ""
                    
            order_dict["user"] = {
                "name": user_name,
                "email": user_email,
                "phone": user_phone
            }
            
            # Get order items
            if "items" in order and order["items"]:
                for item in order["items"]:
                    item_dict = {
                        "product_id": item.get("product_id"),
                        "product_name": item.get("product_name") or item.get("name") or "Unknown Product",
                        "quantity": item.get("quantity", 1),
                        "price": item.get("price", 0),
                        "product": None
                    }
                    
                    # Try to get product details
                    if "product_id" in item and item["product_id"]:
                        try:
                            product_obj_id = ObjectId(item["product_id"]) if isinstance(item["product_id"], str) else item["product_id"]
                            product = products_collection.find_one({"_id": product_obj_id})
                            if product:
                                item_dict["product"] = {
                                    "name": product.get("name", item.get("product_name")),
                                    "image_url": product.get("image_url", "/placeholder.jpg")
                                }
                        except Exception as e:
                            print(f"Error fetching product: {e}")
                    
                    order_dict["items"].append(item_dict)
            
            # Apply search filter
            if search:
                search_lower = search.lower()
                user_match = False
                if order_dict.get("user"):
                    user_match = (search_lower in order_dict["user"].get("name", "").lower() or 
                                 search_lower in order_dict["user"].get("email", "").lower())
                order_match = search_lower in order_dict.get("order_number", "").lower()
                
                if user_match or order_match:
                    result.append(order_dict)
            else:
                result.append(order_dict)
        
        return result
    except Exception as e:
        print(f"Error in get_orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-orders")
def get_my_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's orders with filters"""
    db = get_database()
    orders_collection = db["orders"]
    products_collection = db["products"]
    
    try:
        user_id = current_user.get("id")
        
        # Build query
        query = {"user_id": user_id}
        if status and status != "all":
            query["status"] = status
        
        # Get orders
        orders = list(orders_collection.find(query).sort("created_at", -1).limit(20))
        
        result = []
        for order in orders:
            order_dict = {
                "id": str(order["_id"]),
                "order_number": order.get("order_number", "N/A"),
                "user_id": order.get("user_id"),
                "total_amount": order.get("total_amount", 0),
                "status": order.get("status", "pending"),
                "payment_status": order.get("payment_status", "pending"),
                "payment_method": order.get("payment_method", "N/A"),
                "shipping_address": order.get("shipping_address", "N/A"),
                "created_at": order.get("created_at").isoformat() if hasattr(order.get("created_at"), "isoformat") else str(order.get("created_at") or ""),
                "items": []
            }
            
            # Get order items
            if "items" in order and order["items"]:
                for item in order["items"]:
                    item_dict = {
                        "product_id": item.get("product_id"),
                        "product_name": item.get("product_name", "Unknown Product"),
                        "quantity": item.get("quantity", 1),
                        "price": item.get("price", 0),
                        "product": None
                    }
                    
                    # Get product details
                    if "product_id" in item and item["product_id"]:
                        try:
                            product_obj_id = ObjectId(item["product_id"]) if isinstance(item["product_id"], str) else item["product_id"]
                            product = products_collection.find_one({"_id": product_obj_id})
                            if product:
                                item_dict["product"] = {
                                    "name": product.get("name", item.get("product_name")),
                                    "image_url": product.get("image_url", "/placeholder.jpg")
                                }
                        except Exception:
                            pass
                    
                    order_dict["items"].append(item_dict)
            
            # Apply search filter
            if search:
                search_lower = search.lower()
                if (search_lower in order_dict.get("order_number", "").lower() or
                    search_lower in order_dict.get("status", "").lower()):
                    result.append(order_dict)
            else:
                result.append(order_dict)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}", response_model=List[Order])
def get_user_orders(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user's orders (Authenticated users only)"""
    db = get_database()
    orders_collection = db["orders"]
    try:
        orders = list(orders_collection.find({"user_id": user_id}).sort("created_at", -1))
        for order in orders:
            order["_id"] = str(order["_id"])
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_id}")
def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get order by ID (Authenticated users only)"""
    db = get_database()
    orders_collection = db["orders"]
    users_collection = db["users"]
    products_collection = db["products"]
    
    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_dict = {
            "id": str(order["_id"]),
            "order_number": order.get("order_number") or order.get("order_id") or f"ORD-{str(order['_id'])[-6:]}",
            "user_id": order.get("user_id"),
            "total_amount": order.get("total_amount", 0),
            "status": order.get("status", "pending"),
            "payment_status": order.get("payment_status", "pending"),
            "payment_method": order.get("payment_method", "N/A"),
            "shipping_address": order.get("shipping_address", "N/A"),
            "created_at": order.get("created_at"),
            "user": None,
            "items": [],
            "shipping": order.get("shipping"),
        }
        
        # Get user info
        user_name = "Unknown"
        user_email = ""
        user_phone = "N/A"
        if "user_id" in order and order["user_id"]:
            try:
                user_obj_id = ObjectId(order["user_id"]) if isinstance(order["user_id"], str) else order["user_id"]
                user = users_collection.find_one({"_id": user_obj_id})
                if user:
                    user_name = user.get("name") or user.get("username") or "Unknown"
                    user_email = user.get("email") or ""
                    user_phone = user.get("phone") or "N/A"
            except Exception as e:
                print(f"Error fetching user: {e}")
        
        # Fallback to direct top-level keys (common in dummy seeded orders)
        if user_name == "Unknown" or not user_name:
            user_name = order.get("customer_name") or "Unknown"
        if user_phone == "N/A" or not user_phone:
            user_phone = order.get("phone") or "N/A"
        if not user_email:
            user_email = order.get("email") or order.get("customer_email") or ""

        # Fallback to shipping address if user details are empty/Unknown
        shipping_addr = order.get("shipping_address")
        if isinstance(shipping_addr, dict):
            if user_name == "Unknown" or not user_name:
                user_name = shipping_addr.get("full_name") or "Unknown"
            if user_phone == "N/A" or not user_phone:
                user_phone = shipping_addr.get("phone") or "N/A"
            if not user_email:
                user_email = shipping_addr.get("email") or ""
                
        order_dict["user"] = {
            "name": user_name,
            "email": user_email,
            "phone": user_phone
        }
        
        # Get order items with product details
        if "items" in order and order["items"]:
            for item in order["items"]:
                item_dict = {
                    "product_id": item.get("product_id"),
                    "product_name": item.get("product_name") or item.get("name") or "Unknown Product",
                    "quantity": item.get("quantity", 1),
                    "price": item.get("price", 0),
                    "product": None
                }
                
                # Try to get product details
                if "product_id" in item and item["product_id"]:
                    try:
                        product_obj_id = ObjectId(item["product_id"]) if isinstance(item["product_id"], str) else item["product_id"]
                        product = products_collection.find_one({"_id": product_obj_id})
                        if product:
                            item_dict["product"] = {
                                "name": product.get("name", item.get("product_name")),
                                "image_url": product.get("image_url", "/placeholder.jpg"),
                                "pickup_location": product.get("pickup_location")
                            }
                    except Exception as e:
                        print(f"Error fetching product: {e}")
                
                order_dict["items"].append(item_dict)
        
        return order_dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_id}/history")
def get_order_history(order_id: str, current_user: dict = Depends(get_current_user)):
    """
    Full status-change audit trail for an order — powers a "track order"
    timeline on the frontend (e.g. Confirmed -> Packed -> Shipped ->
    Delivered with timestamps). Customers may only view their own order's
    history; admins may view any.
    """
    db = get_database()
    try:
        order = db["orders"].find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.get("role") != "admin" and str(order.get("user_id")) != str(
        current_user.get("id")
    ):
        raise HTTPException(status_code=403, detail="Not authorised to view this order")

    logs = list(db["order_logs"].find({"order_id": order_id}).sort("created_at", 1))
    for log in logs:
        log["_id"] = str(log["_id"])
    return {"order_id": order_id, "history": logs}


@router.post("/{order_id}/resend-notification")
def resend_order_notification(order_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    """Re-send customer notification (email/sms/whatsapp) manually from admin dashboard."""
    db = get_database()
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")
        
    order = db["orders"].find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    event_str = payload.get("event")
    channel = payload.get("channel", "all")
    
    if not event_str:
        status = order.get("status", "pending")
        event = _STATUS_NOTIFICATION_MAP.get(status, NotificationEvent.ORDER_CONFIRMED)
    else:
        try:
            event = NotificationEvent(event_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid notification event")
            
    notif = NotificationService(db)
    addr = order.get("shipping_address", {}) or {}
    shipping = order.get("shipping", {}) or {}
    
    to_email = order.get("customer_email") or addr.get("email") if channel in ("all", "email") else None
    to_phone = addr.get("phone") if channel in ("all", "phone") else None
    
    try:
        notif.notify(
            event,
            {
                "customer_name": addr.get("full_name") or "Customer",
                "order_number": order.get("order_number", ""),
                "amount": f"{float(order.get('total_amount', 0)):,.2f}",
                "courier_name": shipping.get("courier_name") or "our courier partner",
                "awb": shipping.get("awb") or "",
                "tracking_url": shipping.get("tracking_url") or "",
            },
            to_email=to_email,
            to_phone=to_phone,
            user_id=order.get("user_id"),
            order_id=str(order["_id"]),
        )
        _log_order_status_change(
            db, order_id, order.get("status"), order.get("status"),
            changed_by=current_user.get("id", "admin"), changed_by_role="admin",
            reason=f"Manually re-sent notification ({event.value} via {channel})"
        )
        return {"success": True, "message": "Notification queued successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{order_id}", response_model=Order)
def update_order(order_id: str, order_update: OrderUpdate, current_user: dict = Depends(require_admin)):
    """Update an order (Admin only)"""
    db = get_database()
    orders_collection = db["orders"]
    try:
        update_data = {k: v for k, v in order_update.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = orders_collection.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        result["_id"] = str(result["_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{order_id}/status")
def update_order_status(order_id: str, status_data: dict, current_user: dict = Depends(require_admin)):
    """Update order status (Admin only). Automatically:
      - Logs the transition to `order_logs` (full audit trail).
      - Triggers Shiprocket shipment creation the first time an order
        becomes 'confirmed' or 'paid' and doesn't already have a shipment.
      - Restores inventory if the new status is 'cancelled' (covers admin
        manually cancelling an order outside the customer cancel-request flow).
      - Sends the matching customer notification (packed/shipped/
        out_for_delivery/delivered/cancelled) via email + WhatsApp.
    """
    db = get_database()
    orders_collection = db["orders"]
    try:
        status = status_data.get("status")
        if not status:
            raise HTTPException(status_code=400, detail="Status is required")

        previous = orders_collection.find_one({"_id": ObjectId(order_id)})
        if not previous:
            raise HTTPException(status_code=404, detail="Order not found")
        previous_status = previous.get("status")

        result = orders_collection.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status, "updated_at": datetime.now()}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")

        _log_order_status_change(
            db, order_id, previous_status, status,
            changed_by=current_user.get("id", "admin"), changed_by_role="admin",
            reason=status_data.get("reason"),
        )

        already_shipped = bool((result.get("shipping") or {}).get("shipment_id"))
        if status in ("confirmed", "paid") and not already_shipped:
            try:
                from app.routes.payment import _trigger_shiprocket
                order_data = {k: v for k, v in result.items() if k != "_id"}
                _trigger_shiprocket(order_id, order_data, db)
            except Exception as e:
                print(f"[Shiprocket] auto-trigger on status change failed: {e}")

        # Restore inventory if this transition cancels the order (and it
        # wasn't already cancelled before — avoid double-restoring stock).
        if status == "cancelled" and previous_status != "cancelled":
            stock_items = _stock_items_from_order(result)
            if stock_items:
                InventoryService(db).restore_stock_for_order(
                    stock_items, order_id, reason="Order cancelled by admin"
                )

        _notify_status_change(db, result, status)

        result["_id"] = str(result["_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Customer cancellation flow ────────────────────────────────────────────
#
#   Pending -> Customer Cancel Request -> Admin Approval -> Cancel
#     -> Restore Stock -> Refund -> Completed
#
# COD orders that haven't shipped yet are auto-approved (nothing to refund,
# no financial risk) so customers get instant cancellation for the common
# case. Prepaid (Razorpay) orders always require admin approval since
# approving triggers an actual refund.


@router.post("/{order_id}/cancel-request", status_code=201)
def request_order_cancellation(
    order_id: str, payload: CancellationCreate, current_user: dict = Depends(get_current_user)
):
    """Customer requests cancellation of their own order."""
    db = get_database()
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")

    order = db["orders"].find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.get("user_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorised for this order")

    if order.get("status") not in {s.value for s in CANCELLABLE_STATUSES}:
        raise HTTPException(
            status_code=400,
            detail=f"Order in status '{order.get('status')}' can no longer be cancelled. "
            "Please use the Return flow instead if it has already shipped.",
        )

    existing = db["cancellations"].find_one(
        {"order_id": order_id, "status": {"$in": ["requested", "approved"]}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="A cancellation request already exists for this order")

    cancellation_doc = {
        "order_id": order_id,
        "user_id": current_user.get("id"),
        "reason": payload.reason,
        "status": "requested",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    # Auto-approve: COD + not yet shipped -> nothing to refund, low risk.
    is_cod = (order.get("payment_method") or "").upper() == "COD"
    not_shipped = not bool((order.get("shipping") or {}).get("awb"))

    if is_cod and not_shipped:
        cancellation_doc["status"] = "completed"
        cancellation_doc["admin_notes"] = "Auto-approved: COD order, not yet shipped"
        result = db["cancellations"].insert_one(cancellation_doc)
        _finalise_cancellation(db, order, order_id, str(result.inserted_id), auto=True)
        return {
            "cancellation_id": str(result.inserted_id),
            "status": "completed",
            "message": "Order cancelled successfully. Since this was a Cash on Delivery "
            "order that hadn't shipped yet, it's been cancelled immediately.",
        }

    result = db["cancellations"].insert_one(cancellation_doc)
    return {
        "cancellation_id": str(result.inserted_id),
        "status": "requested",
        "message": "Your cancellation request has been submitted and is awaiting admin review.",
    }


def _finalise_cancellation(db, order: dict, order_id: str, cancellation_id: str, auto: bool = False) -> None:
    """Shared logic for both auto-approved and admin-approved cancellations:
    restore stock, mark the order cancelled, initiate a refund if the
    order was already paid online, log everything, notify the customer."""
    previous_status = order.get("status")

    db["orders"].update_one(
        {"_id": order["_id"]},
        {"$set": {"status": "cancelled", "updated_at": datetime.now()}},
    )
    _log_order_status_change(
        db, order_id, previous_status, "cancelled",
        changed_by="system" if auto else "admin", changed_by_role="system" if auto else "admin",
        reason="Cancellation approved",
    )

    stock_items = _stock_items_from_order(order)
    if stock_items:
        InventoryService(db).restore_stock_for_order(
            stock_items, order_id, reason="Order cancelled"
        )

    refund_id = None
    if order.get("payment_status") == "captured":
        refund_doc = {
            "order_id": order_id,
            "cancellation_id": cancellation_id,
            "amount": order.get("total_amount", 0),
            "reason": "Order cancelled",
            "status": "initiated",
            "attempts": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        refund_result = db["refunds"].insert_one(refund_doc)
        refund_id = str(refund_result.inserted_id)
        db["cancellations"].update_one(
            {"_id": ObjectId(cancellation_id)}, {"$set": {"refund_id": refund_id}}
        )

    fresh_order = db["orders"].find_one({"_id": order["_id"]})
    _notify_status_change(db, fresh_order, "cancelled")

    if refund_id:
        import threading

        def _run():
            try:
                notif = NotificationService(db)
                addr = order.get("shipping_address", {}) or {}
                notif.notify(
                    NotificationEvent.REFUND_INITIATED,
                    {
                        "customer_name": addr.get("full_name") or "Customer",
                        "order_number": order.get("order_number", ""),
                        "amount": f"{float(order.get('total_amount', 0)):,.2f}",
                    },
                    to_email=order.get("customer_email") or addr.get("email"),
                    to_phone=addr.get("phone"),
                    user_id=order.get("user_id"),
                    order_id=order_id,
                )
            except Exception as exc:
                print(f"[Notification] refund_initiated notify failed: {exc}")

        threading.Thread(target=_run, daemon=True).start()


@router.get("/cancellations/list")
def list_cancellation_requests(
    status: Optional[str] = None, current_user: dict = Depends(require_admin)
):
    """Admin: list all cancellation requests, optionally filtered by status."""
    db = get_database()
    query: dict = {}
    if status:
        query["status"] = status
    docs = list(db["cancellations"].find(query).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@router.put("/cancellations/{cancellation_id}/review")
def review_cancellation_request(
    cancellation_id: str, action: dict, current_user: dict = Depends(require_admin)
):
    """
    Admin approves or rejects a pending cancellation request.
    Body: { "action": "approve" | "reject", "admin_notes": "..." (optional) }
    """
    db = get_database()
    try:
        coid = ObjectId(cancellation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid cancellation_id")

    cancellation = db["cancellations"].find_one({"_id": coid})
    if not cancellation:
        raise HTTPException(status_code=404, detail="Cancellation request not found")
    if cancellation.get("status") != "requested":
        raise HTTPException(
            status_code=400,
            detail=f"Cancellation is already '{cancellation.get('status')}' — cannot review again",
        )

    decision = action.get("action")
    if decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    order_id = cancellation["order_id"]
    order = db["orders"].find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Associated order not found")

    if decision == "reject":
        db["cancellations"].update_one(
            {"_id": coid},
            {
                "$set": {
                    "status": "rejected",
                    "admin_notes": action.get("admin_notes", ""),
                    "updated_at": datetime.now(),
                }
            },
        )
        return {"cancellation_id": cancellation_id, "status": "rejected"}

    db["cancellations"].update_one(
        {"_id": coid},
        {"$set": {"status": "approved", "updated_at": datetime.now()}},
    )
    _finalise_cancellation(db, order, order_id, cancellation_id, auto=False)
    db["cancellations"].update_one(
        {"_id": coid}, {"$set": {"status": "completed", "updated_at": datetime.now()}}
    )

    return {"cancellation_id": cancellation_id, "status": "completed"}


@router.delete("/{order_id}")
def delete_order(order_id: str, current_user: dict = Depends(require_admin)):
    """Delete an order (Admin only)"""
    db = get_database()
    orders_collection = db["orders"]
    try:
        result = orders_collection.delete_one({"_id": ObjectId(order_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"message": "Order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
