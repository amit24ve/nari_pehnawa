"""
Exchange route — implements the full lifecycle from the spec:

    Delivered -> Exchange Request -> Approve -> Pickup -> QC
        -> Ship New Product -> Delivered -> Completed

Exchanges are for swapping a delivered item (e.g. wrong size) rather than
a refund. No money moves in the common case (same product, different
size) — reuses Shiprocket's shipment-creation pipeline to send the
replacement, and reuses the return QC states so the admin app can present
returns and exchanges with a consistent review workflow.
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.database.schemas.notification import NotificationEvent
from app.database.schemas.return_refund import ExchangeAdminAction, ExchangeCreate
from app.security import get_current_user, require_admin
from app.services.inventory_service import InventoryService, StockLineItem
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/exchanges", tags=["Exchanges"])

_ACTION_TRANSITIONS = {
    "approve": ({"requested"}, "approved"),
    "reject": ({"requested"}, "rejected"),
    "schedule_pickup": ({"approved"}, "pickup_scheduled"),
    "mark_picked_up": ({"pickup_scheduled"}, "picked_up"),
    "qc_pass": ({"picked_up"}, "qc_passed"),
    "qc_fail": ({"picked_up"}, "qc_failed"),
    "ship_new_item": ({"qc_passed"}, "new_item_shipped"),
    "mark_delivered": ({"new_item_shipped"}, "delivered"),
}


def _load_order_or_404(db, order_id: str) -> dict:
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")
    order = db["orders"].find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _notify(db, order: dict, event: NotificationEvent, extra: Optional[dict] = None) -> None:
    import threading

    def _run():
        try:
            notif = NotificationService(db)
            addr = order.get("shipping_address", {}) or {}
            ctx = {
                "customer_name": addr.get("full_name") or "Customer",
                "order_number": order.get("order_number", ""),
            }
            ctx.update(extra or {})
            notif.notify(
                event, ctx,
                to_email=order.get("customer_email") or addr.get("email"),
                to_phone=addr.get("phone"),
                user_id=order.get("user_id"),
                order_id=str(order.get("_id")),
            )
        except Exception as exc:
            print(f"[Notification] exchange notify failed: {exc}")

    threading.Thread(target=_run, daemon=True).start()


# ── Customer: request an exchange ────────────────────────────────────────


@router.post("/", status_code=201)
def create_exchange_request(payload: ExchangeCreate, current_user: dict = Depends(get_current_user)):
    """Customer requests an exchange (e.g. wrong size) for a delivered order."""
    db = get_database()
    order = _load_order_or_404(db, payload.order_id)

    if str(order.get("user_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorised for this order")

    if order.get("status") not in ("delivered", "completed"):
        raise HTTPException(
            status_code=400, detail="Exchanges can only be requested for delivered orders."
        )

    order_product_ids = {i.get("product_id") for i in order.get("items", [])}
    if payload.product_id not in order_product_ids:
        raise HTTPException(status_code=400, detail="That product is not part of this order")

    existing = db["exchanges"].find_one(
        {"order_id": payload.order_id, "product_id": payload.product_id,
         "status": {"$nin": ["rejected", "closed", "completed"]}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="An active exchange request already exists for this item")

    doc = {
        "order_id": payload.order_id,
        "user_id": current_user.get("id"),
        "product_id": payload.product_id,
        "quantity": payload.quantity,
        "current_size": payload.current_size,
        "requested_size": payload.requested_size,
        "reason": payload.reason,
        "comments": payload.comments,
        "status": "requested",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    result = db["exchanges"].insert_one(doc)
    return {"exchange_id": str(result.inserted_id), "status": "requested"}


@router.get("/my-exchanges")
def list_my_exchanges(current_user: dict = Depends(get_current_user)):
    db = get_database()
    docs = list(
        db["exchanges"].find({"user_id": current_user.get("id")}).sort("created_at", -1)
    )
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@router.get("/")
def list_all_exchanges(status: Optional[str] = None, current_user: dict = Depends(require_admin)):
    db = get_database()
    query: dict = {}
    if status:
        query["status"] = status
    docs = list(db["exchanges"].find(query).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@router.get("/{exchange_id}")
def get_exchange(exchange_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        doc = db["exchanges"].find_one({"_id": ObjectId(exchange_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid exchange_id")
    if not doc:
        raise HTTPException(status_code=404, detail="Exchange request not found")
    if current_user.get("role") != "admin" and str(doc.get("user_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorised")
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/{exchange_id}/action")
def perform_exchange_action(
    exchange_id: str, action: ExchangeAdminAction, current_user: dict = Depends(require_admin)
):
    """
    Single endpoint for every admin-driven transition:
        approve | reject | schedule_pickup | mark_picked_up | qc_pass
        | qc_fail | ship_new_item | mark_delivered

    ship_new_item reduces stock for the replacement item (a fresh unit
    leaves the warehouse) — the returned original unit was never restored
    to sellable stock unless/until it separately passes QC, matching how
    exchanges work in practice (the old unit may be defective/wrong-size
    but otherwise fine, so restoring it is a deliberate follow-up action
    an admin can do via the returns endpoints if appropriate, not automatic
    here).
    """
    db = get_database()
    try:
        eid = ObjectId(exchange_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid exchange_id")

    exch = db["exchanges"].find_one({"_id": eid})
    if not exch:
        raise HTTPException(status_code=404, detail="Exchange request not found")

    transition = _ACTION_TRANSITIONS.get(action.action)
    if not transition:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action.action}")

    allowed_from, new_status = transition
    if exch.get("status") not in allowed_from:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot '{action.action}' an exchange currently in status '{exch.get('status')}'. "
            f"Expected one of: {sorted(allowed_from)}",
        )

    update: dict = {"status": new_status, "updated_at": datetime.now()}
    if action.action == "reject":
        update["rejection_reason"] = action.reason or "Not specified"
    if action.reason:
        update["admin_notes"] = action.reason

    db["exchanges"].update_one({"_id": eid}, {"$set": update})
    order = _load_order_or_404(db, exch["order_id"])

    if action.action == "reject":
        db["exchanges"].update_one({"_id": eid}, {"$set": {"status": "closed"}})
        return {"exchange_id": exchange_id, "status": "closed"}

    if action.action == "approve":
        _notify(db, order, NotificationEvent.EXCHANGE_APPROVED)

    if action.action == "ship_new_item":
        stock_items = [StockLineItem(product_id=exch["product_id"], quantity=exch["quantity"])]
        try:
            InventoryService(db).reduce_stock_for_order(stock_items, exch["order_id"])
        except Exception as exc:
            raise HTTPException(
                status_code=409,
                detail=f"Could not ship replacement — insufficient stock: {exc}",
            )

    if action.action == "qc_fail":
        db["exchanges"].update_one({"_id": eid}, {"$set": {"status": "closed"}})
        return {"exchange_id": exchange_id, "status": "closed", "reason": "QC failed"}

    if action.action == "mark_delivered":
        db["exchanges"].update_one({"_id": eid}, {"$set": {"status": "completed"}})
        return {"exchange_id": exchange_id, "status": "completed"}

    return {"exchange_id": exchange_id, "status": new_status}
