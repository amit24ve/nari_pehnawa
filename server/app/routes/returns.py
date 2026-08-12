"""
Returns route — implements the full lifecycle from the spec:

    Delivered -> Return Request -> Admin Review -> Approved -> Pickup
        -> Warehouse Received -> QC -> Approved -> Refund -> Completed
    If rejected -> Reason -> Close Request

Customers can only request a return once an order is DELIVERED (mirrors
real marketplaces — you can't return something that hasn't arrived), and
only within the implicit trust of "the order belongs to them" (ownership
checked on every customer-facing endpoint).

Admins move the request through the review/pickup/QC pipeline via a single
POST /returns/{return_id}/action endpoint with an `action` field, rather
than one endpoint per transition — keeps the API surface small while still
being fully explicit about what's allowed from each state.
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.database.schemas.notification import NotificationEvent
from app.database.schemas.return_refund import ReturnAdminAction, ReturnCreate
from app.security import get_current_user, require_admin
from app.services.inventory_service import InventoryService, StockLineItem
from app.services.notification_service import NotificationService
from app.services.refund_service import RefundService

router = APIRouter(prefix="/returns", tags=["Returns"])

# Valid admin-driven transitions: {action: (required_current_status, new_status)}
_ACTION_TRANSITIONS = {
    "approve": ({"requested", "under_review"}, "approved"),
    "reject": ({"requested", "under_review"}, "rejected"),
    "schedule_pickup": ({"approved"}, "pickup_scheduled"),
    "mark_picked_up": ({"pickup_scheduled"}, "picked_up"),
    "mark_received": ({"picked_up"}, "warehouse_received"),
    "start_qc": ({"warehouse_received"}, "qc_in_progress"),
    "qc_pass": ({"warehouse_received", "qc_in_progress"}, "qc_passed"),
    "qc_fail": ({"warehouse_received", "qc_in_progress"}, "qc_failed"),
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
                "amount": f"{float(order.get('total_amount', 0)):,.2f}",
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
            print(f"[Notification] returns notify failed: {exc}")

    threading.Thread(target=_run, daemon=True).start()


# ── Customer: request a return ────────────────────────────────────────────


@router.post("/", status_code=201)
def create_return_request(payload: ReturnCreate, current_user: dict = Depends(get_current_user)):
    """Customer requests a return for a delivered order (full or partial —
    `items` can be a subset of the order's items)."""
    db = get_database()
    order = _load_order_or_404(db, payload.order_id)

    if str(order.get("user_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorised for this order")

    if order.get("status") not in ("delivered", "completed"):
        raise HTTPException(
            status_code=400,
            detail="Returns can only be requested for delivered orders.",
        )

    existing = db["returns"].find_one(
        {"order_id": payload.order_id, "status": {"$nin": ["rejected", "closed", "completed"]}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="An active return request already exists for this order")

    doc = {
        "order_id": payload.order_id,
        "user_id": current_user.get("id"),
        "items": [i.model_dump() for i in payload.items],
        "reason": payload.reason,
        "comments": payload.comments,
        "status": "requested",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    result = db["returns"].insert_one(doc)
    return {"return_id": str(result.inserted_id), "status": "requested"}


# ── Customer + Admin: view ────────────────────────────────────────────────


@router.get("/my-returns")
def list_my_returns(current_user: dict = Depends(get_current_user)):
    """Customer's own return requests."""
    db = get_database()
    docs = list(
        db["returns"].find({"user_id": current_user.get("id")}).sort("created_at", -1)
    )
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@router.get("/")
def list_all_returns(status: Optional[str] = None, current_user: dict = Depends(require_admin)):
    """Admin: list all return requests, optionally filtered by status."""
    db = get_database()
    query: dict = {}
    if status:
        query["status"] = status
    docs = list(db["returns"].find(query).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@router.get("/{return_id}")
def get_return(return_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        doc = db["returns"].find_one({"_id": ObjectId(return_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid return_id")
    if not doc:
        raise HTTPException(status_code=404, detail="Return request not found")
    if current_user.get("role") != "admin" and str(doc.get("user_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorised")
    doc["_id"] = str(doc["_id"])
    return doc


# ── Admin: drive the return through its lifecycle ────────────────────────


@router.post("/{return_id}/action")
def perform_return_action(
    return_id: str, action: ReturnAdminAction, current_user: dict = Depends(require_admin)
):
    """
    Single endpoint for every admin-driven transition:
        approve | reject | schedule_pickup | mark_picked_up | mark_received
        | start_qc | qc_pass | qc_fail

    qc_pass automatically initiates the refund and restores inventory for
    the returned items (Return Approved -> Refund Initiated -> Restore
    Inventory, matching the spec). qc_fail closes the request without a
    refund (item failed quality check — e.g. used/damaged beyond what's
    eligible), with the reason recorded for the customer to see.
    """
    db = get_database()
    try:
        rid = ObjectId(return_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid return_id")

    ret = db["returns"].find_one({"_id": rid})
    if not ret:
        raise HTTPException(status_code=404, detail="Return request not found")

    transition = _ACTION_TRANSITIONS.get(action.action)
    if not transition:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action.action}")

    allowed_from, new_status = transition
    if ret.get("status") not in allowed_from:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot '{action.action}' a return currently in status '{ret.get('status')}'. "
            f"Expected one of: {sorted(allowed_from)}",
        )

    update: dict = {"status": new_status, "updated_at": datetime.now()}
    if action.action == "reject":
        update["rejection_reason"] = action.reason or "Not specified"
    if action.reason:
        update["admin_notes"] = action.reason

    db["returns"].update_one({"_id": rid}, {"$set": update})

    order = _load_order_or_404(db, ret["order_id"])

    if action.action == "reject":
        db["returns"].update_one({"_id": rid}, {"$set": {"status": "closed"}})
        _notify(db, order, NotificationEvent.RETURN_REJECTED, {"reason": update["rejection_reason"]})
        return {"return_id": return_id, "status": "closed", "rejection_reason": update["rejection_reason"]}

    if action.action == "approve":
        _notify(db, order, NotificationEvent.RETURN_APPROVED)

    if action.action == "qc_pass":
        # Restore inventory for the returned items.
        stock_items = [
            StockLineItem(product_id=i["product_id"], quantity=i["quantity"])
            for i in ret.get("items", [])
        ]
        if stock_items:
            InventoryService(db).restore_stock_for_order(
                stock_items, ret["order_id"], reason="Return QC passed"
            )

        # Refund only the returned items' proportional value, not the
        # whole order (partial returns are supported).
        returned_qty_map = {i["product_id"]: i["quantity"] for i in ret.get("items", [])}
        order_items = order.get("items", []) or []
        refund_amount = 0.0
        for oi in order_items:
            pid = oi.get("product_id")
            if pid in returned_qty_map:
                unit_price = float(oi.get("price", 0))
                refund_amount += unit_price * returned_qty_map[pid]

        if refund_amount <= 0:
            refund_amount = float(order.get("total_amount", 0))

        refund = RefundService(db).create_refund(
            order_id=ret["order_id"],
            amount=refund_amount,
            reason="Return approved and passed QC",
            return_id=return_id,
        )
        db["returns"].update_one(
            {"_id": rid},
            {"$set": {"status": "refund_initiated", "refund_id": refund["_id"], "updated_at": datetime.now()}},
        )
        _notify(db, order, NotificationEvent.REFUND_INITIATED, {"amount": f"{refund_amount:,.2f}"})

        if refund.get("status") == "success":
            db["returns"].update_one({"_id": rid}, {"$set": {"status": "completed"}})
            _notify(db, order, NotificationEvent.REFUND_COMPLETED, {"amount": f"{refund_amount:,.2f}"})

        return {
            "return_id": return_id,
            "status": db["returns"].find_one({"_id": rid})["status"],
            "refund_id": refund["_id"],
        }

    if action.action == "qc_fail":
        db["returns"].update_one({"_id": rid}, {"$set": {"status": "closed"}})
        return {"return_id": return_id, "status": "closed", "reason": "QC failed"}

    return {"return_id": return_id, "status": new_status}
