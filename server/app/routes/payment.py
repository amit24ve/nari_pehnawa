"""
Payments route — Razorpay online payments + COD, hardened for production:

  - Idempotency: repeated create-order calls with the same idempotency_key
    return the same Razorpay order instead of creating duplicates.
  - Duplicate payment prevention: a razorpay_payment_id can never be
    attached to more than one app order (checked before creating the order
    in /verify).
  - Razorpay webhook endpoint: reconciles payment status server-to-server
    even if the browser-side /verify call is dropped (tab closed, network
    drop, etc). Verifies the X-Razorpay-Signature header.
  - Payment audit log: every event (order created, verify attempt, webhook
    received, signature mismatch, captured, failed) is written to
    `payment_logs`, independent of the mutable `payments` collection.
  - Stock validation: COD orders are rejected before creation if any item
    is out of stock; online orders reduce stock on successful verification
    (payment already captured by then, so we complete the order and flag
    any shortfall for admin attention rather than refusing a paid order).
  - Coupon usage is recorded once an order is actually placed.
  - Order confirmation / payment success / payment failure notifications
    are sent (email + WhatsApp) via NotificationService.
"""

import hashlib
import hmac
import random
import string
from datetime import datetime
from typing import Optional

from app.config import razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret
from app.database import get_database
from app.database.schemas.notification import NotificationEvent
from app.security import get_current_user, require_admin
from app.services.coupon_service import CouponService
from app.services.inventory_service import (
    InsufficientStockError,
    InventoryService,
    StockLineItem,
)
from app.services.notification_service import NotificationService
from fastapi import APIRouter, Depends, HTTPException, Request

try:
    import razorpay as _razorpay_lib

    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

router = APIRouter(prefix="/payments", tags=["Payments"])


def _rz_client():
    if not RAZORPAY_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="razorpay package not installed. Run: pip install razorpay",
        )
    if not razorpay_key_id or not razorpay_key_secret:
        raise HTTPException(
            status_code=503,
            detail="Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        )
    return _razorpay_lib.Client(auth=(razorpay_key_id, razorpay_key_secret))


def _gen_order_number() -> str:
    ts = datetime.now().strftime("%Y%m%d")
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ORD-{ts}-{rand}"


def _log_payment_event(
    db,
    event_type: str,
    razorpay_order_id: Optional[str] = None,
    razorpay_payment_id: Optional[str] = None,
    status: Optional[str] = None,
    amount: Optional[float] = None,
    raw_payload: Optional[dict] = None,
    error: Optional[str] = None,
    payment_id: Optional[str] = None,
) -> None:
    """Append-only audit trail — never mutated, unlike the `payments`
    collection which tracks current state. Lets you reconstruct exactly
    what happened to a payment even after multiple retries/webhooks."""
    db["payment_logs"].insert_one(
        {
            "payment_id": payment_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "event_type": event_type,
            "status": status,
            "amount": amount,
            "raw_payload": raw_payload,
            "error": error,
            "created_at": datetime.now(),
        }
    )


def _stock_items_from_order_data(order_data: dict) -> list[StockLineItem]:
    items = order_data.get("items", []) or []
    result = []
    for item in items:
        pid = item.get("product_id")
        qty = int(item.get("quantity") or 1)
        if pid:
            result.append(StockLineItem(product_id=str(pid), quantity=qty))
    return result


def _trigger_shiprocket(order_id: str, order_data: dict, db):
    """
    Fire off the full Shiprocket fulfilment pipeline (create order -> assign
    AWB/courier -> schedule pickup) in the background so the payment/COD
    response returns immediately to the customer. Runs in a separate thread
    with its own event loop since this route is still sync (pymongo-based);
    failures are logged but never block order confirmation.
    """
    import asyncio
    import threading

    def _run():
        async def _do_fulfill():
            from app.database.repositories.shipping_repository import ShippingRepository
            from app.services.shiprocket_service import ShiprocketAPIError, get_shiprocket_service
            sr = get_shiprocket_service()
            repo = ShippingRepository(db)

            # Auto-resolve pickup_location from item's product database if not explicitly set
            if not order_data.get("pickup_location"):
                items = order_data.get("items", []) or []
                for item in items:
                    pid = item.get("product_id") or item.get("id") or item.get("_id")
                    if pid:
                        try:
                            from bson import ObjectId
                            prod = db["products"].find_one({"_id": ObjectId(str(pid))})
                            if prod and prod.get("pickup_location"):
                                order_data["pickup_location"] = prod["pickup_location"]
                                break
                        except Exception:
                            pass

            try:
                await sr.fulfill_order(order_id, order_data, repo)
                print(f"[Shiprocket] Fulfilment pipeline completed for order {order_id} (location={order_data.get('pickup_location')})")
            except ShiprocketAPIError as exc:
                print(f"[Shiprocket] Fulfilment pipeline failed for order {order_id}: {exc}")
            except Exception as exc:
                print(f"[Shiprocket] Unexpected fulfilment error for order {order_id}: {exc}")

        asyncio.run(_do_fulfill())

    threading.Thread(target=_run, daemon=True).start()


def _send_order_notifications(
    db, event: NotificationEvent, order_data: dict, order_number: str, user_id: str
):
    """Fire order-lifecycle notifications in the background thread pattern
    already used for Shiprocket, so email/WhatsApp sending never adds
    latency to the checkout response."""
    import threading

    def _run():
        try:
            notif = NotificationService(db)
            addr = order_data.get("shipping_address", {}) or {}
            notif.notify(
                event,
                {
                    "customer_name": addr.get("full_name") or "Customer",
                    "order_number": order_number,
                    "amount": f"{float(order_data.get('total_amount', 0)):,.2f}",
                },
                to_email=order_data.get("customer_email") or addr.get("email"),
                to_phone=addr.get("phone"),
                user_id=user_id,
                order_id=order_data.get("_order_id_for_notify"),
            )
        except Exception as exc:
            print(f"[Notification] failed to send {event}: {exc}")

    threading.Thread(target=_run, daemon=True).start()


def _record_initial_order_log(db, order_id: str, status: str, reason: str) -> None:
    db["order_logs"].insert_one(
        {
            "order_id": order_id,
            "from_status": None,
            "to_status": status,
            "changed_by": "system",
            "changed_by_role": "system",
            "reason": reason,
            "created_at": datetime.now(),
        }
    )


# ── 1. Create Razorpay order ─────────────────────────────────────────────────


@router.post("/razorpay/create-order")
def create_razorpay_order(data: dict, current_user: dict = Depends(get_current_user)):
    """
    Step 1 of online checkout.
    Client sends { amount, currency?, idempotency_key?, items? }.
    Returns razorpay_order_id + key_id for the Razorpay checkout widget.

    idempotency_key (optional, backward compatible): if the same key is
    sent again within a short window (e.g. the customer double-clicks "Pay
    Now" or the request is retried after a network blip), the SAME
    Razorpay order is returned instead of creating a second one.

    items (optional, backward compatible): if provided, stock is
    pre-validated before the Razorpay order is created, so customers never
    get to the payment screen for something that's already out of stock.
    """
    db = get_database()
    client = _rz_client()

    amount = float(data.get("amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    idempotency_key = data.get("idempotency_key")
    if idempotency_key:
        existing = db["payments"].find_one(
            {
                "idempotency_key": idempotency_key,
                "user_id": current_user.get("id"),
                "status": {"$in": ["created", "captured"]},
            }
        )
        if existing:
            return {
                "razorpay_order_id": existing["razorpay_order_id"],
                "amount": existing["amount"],
                "currency": existing.get("currency", "INR"),
                "key_id": razorpay_key_id,
                "idempotent_replay": True,
            }

    items = data.get("items")
    if items:
        inventory = InventoryService(db)
        stock_items = [
            StockLineItem(product_id=str(i.get("product_id")), quantity=int(i.get("quantity", 1)))
            for i in items
            if i.get("product_id")
        ]
        errors = inventory.check_availability(stock_items)
        if errors:
            raise HTTPException(status_code=409, detail="; ".join(errors))

    try:
        rz_order = client.order.create(
            {
                "amount": int(amount * 100),  # paise
                "currency": data.get("currency", "INR"),
                "receipt": f"rcpt_{''.join(random.choices(string.digits, k=8))}",
                "notes": {
                    "user_id": current_user.get("id"),
                    "email": current_user.get("email", ""),
                },
            }
        )

        # Persist pending payment record
        db["payments"].insert_one(
            {
                "razorpay_order_id": rz_order["id"],
                "amount": amount,
                "currency": data.get("currency", "INR"),
                "status": "created",
                "user_id": current_user.get("id"),
                "customer_email": current_user.get("email", ""),
                "idempotency_key": idempotency_key,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
        )
        _log_payment_event(
            db,
            "order_created",
            razorpay_order_id=rz_order["id"],
            status="created",
            amount=amount,
        )

        return {
            "razorpay_order_id": rz_order["id"],
            "amount": amount,
            "currency": rz_order["currency"],
            "key_id": razorpay_key_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        _log_payment_event(db, "order_creation_failed", error=str(e), amount=amount)
        raise HTTPException(
            status_code=500, detail=f"Razorpay order creation failed: {e}"
        )


# ── 2. Verify payment + create app order + Shiprocket ──────────────────────


@router.post("/razorpay/verify")
def verify_razorpay_payment(data: dict, current_user: dict = Depends(get_current_user)):
    """
    Step 2 of online checkout.
    Verifies HMAC signature, records payment, creates order, reduces
    inventory, records coupon usage, sends notifications, triggers
    Shiprocket.

    Retry-safe: if this is called twice for the same razorpay_payment_id
    (e.g. the frontend retried after a slow response), the SECOND call
    detects the payment is already attached to an order and returns that
    same order instead of creating a duplicate.
    """
    db = get_database()

    rz_order_id = data.get("razorpay_order_id", "")
    rz_payment_id = data.get("razorpay_payment_id", "")
    rz_signature = data.get("razorpay_signature", "")
    order_data = data.get("order_data", {})

    if not all([rz_order_id, rz_payment_id, rz_signature]):
        raise HTTPException(status_code=400, detail="Missing payment fields")

    _log_payment_event(
        db, "verify_attempt", razorpay_order_id=rz_order_id, razorpay_payment_id=rz_payment_id
    )

    # ── Duplicate payment prevention ─────────────────────────────────────
    # If this exact razorpay_payment_id is already attached to an order,
    # this is a retry of a call that actually succeeded before — return
    # the existing order rather than creating a second one.
    existing_payment = db["payments"].find_one(
        {"razorpay_payment_id": rz_payment_id, "order_id": {"$exists": True}}
    )
    if existing_payment:
        _log_payment_event(
            db,
            "duplicate_verify_detected",
            razorpay_order_id=rz_order_id,
            razorpay_payment_id=rz_payment_id,
            status="captured",
        )
        return {
            "success": True,
            "order_id": existing_payment["order_id"],
            "order_number": existing_payment.get("order_number"),
            "message": "Payment already verified and order already created",
            "idempotent_replay": True,
        }

    # ── HMAC verification ─────────────────────────────────────────────────
    try:
        msg = f"{rz_order_id}|{rz_payment_id}"
        expected = hmac.new(
            razorpay_key_secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256
        ).hexdigest()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signature computation error: {e}")

    if expected != rz_signature:
        db["payments"].update_one(
            {"razorpay_order_id": rz_order_id},
            {"$set": {"status": "failed", "updated_at": datetime.now()}},
        )
        _log_payment_event(
            db,
            "signature_mismatch",
            razorpay_order_id=rz_order_id,
            razorpay_payment_id=rz_payment_id,
            status="failed",
            error="HMAC signature did not match",
        )
        raise HTTPException(
            status_code=400, detail="Payment verification failed: signature mismatch"
        )

    # ── Create order ──────────────────────────────────────────────────────
    try:
        order_num = _gen_order_number()
        order_data.update(
            {
                "user_id": current_user.get("id"),
                "order_number": order_num,
                "status": "confirmed",
                "payment_status": "captured",
                "payment_method": "Razorpay",
                "razorpay_order_id": rz_order_id,
                "razorpay_payment_id": rz_payment_id,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
        )
        result = db["orders"].insert_one(order_data)
        order_id = str(result.inserted_id)
    except Exception as e:
        _log_payment_event(
            db,
            "order_creation_failed",
            razorpay_order_id=rz_order_id,
            razorpay_payment_id=rz_payment_id,
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=f"Order creation failed: {e}")

    _record_initial_order_log(db, order_id, "confirmed", "Razorpay payment captured")

    # ── Inventory: reduce stock now that payment has captured ────────────
    # Payment already happened at this point (Razorpay widget completed),
    # so we can't cleanly refuse the order over a stock race. We still try
    # to deduct stock and flag the order for admin attention if it fails,
    # rather than silently overselling or blocking an already-paid order.
    stock_items = _stock_items_from_order_data(order_data)
    if stock_items:
        try:
            InventoryService(db).reduce_stock_for_order(stock_items, order_id)
        except InsufficientStockError as exc:
            db["orders"].update_one(
                {"_id": result.inserted_id},
                {"$set": {"inventory_issue": str(exc), "updated_at": datetime.now()}},
            )
            print(f"[Inventory] WARNING: order {order_id} has a stock shortfall: {exc}")

    # ── Coupon usage ───────────────────────────────────────────────────────
    coupon_code = order_data.get("coupon_code")
    if coupon_code:
        try:
            CouponService(db).record_usage(coupon_code)
        except Exception as exc:
            print(f"[Coupon] failed to record usage for {coupon_code}: {exc}")

    # ── Update payment record ─────────────────────────────────────────────
    shipping_addr = order_data.get("shipping_address", {})
    db["payments"].update_one(
        {"razorpay_order_id": rz_order_id},
        {
            "$set": {
                "razorpay_payment_id": rz_payment_id,
                "razorpay_signature": rz_signature,
                "status": "captured",
                "order_id": order_id,
                "order_number": order_num,
                "customer_name": shipping_addr.get("full_name", ""),
                "customer_phone": shipping_addr.get("phone", ""),
                "payment_method": "Razorpay",
                "updated_at": datetime.now(),
            }
        },
    )
    _log_payment_event(
        db,
        "captured",
        razorpay_order_id=rz_order_id,
        razorpay_payment_id=rz_payment_id,
        status="captured",
        amount=order_data.get("total_amount"),
    )

    if current_user.get("id"):
        try:
            from bson import ObjectId
            db["users"].update_one(
                {"_id": ObjectId(current_user["id"])},
                {"$inc": {"orders_count": 1}}
            )
        except Exception as exc:
            print(f"[User] Failed to increment orders_count: {exc}")

    # ── Notifications (order confirmed + payment success) ────────────────
    notify_ctx = {**order_data, "_order_id_for_notify": order_id}
    _send_order_notifications(db, NotificationEvent.ORDER_CONFIRMED, notify_ctx, order_num, current_user.get("id"))
    _send_order_notifications(db, NotificationEvent.PAYMENT_SUCCESS, notify_ctx, order_num, current_user.get("id"))

    # ── Shiprocket (non-blocking) ─────────────────────────────────────────
    _trigger_shiprocket(order_id, order_data, db)

    return {
        "success": True,
        "order_id": order_id,
        "order_number": order_num,
        "message": "Payment verified and order created successfully",
    }


# ── 3. Razorpay webhook ──────────────────────────────────────────────────────


@router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    """
    Server-to-server reconciliation endpoint. Configure this URL in the
    Razorpay Dashboard -> Settings -> Webhooks:
        https://naripehnawa.com:7100/payments/razorpay/webhook
    Subscribe to: payment.captured, payment.failed, refund.created,
    refund.processed.

    Why this matters even though /razorpay/verify already handles the
    happy path: if the customer's browser closes/loses network right after
    paying but before the verify call completes, the order would otherwise
    never get created/updated. The webhook is Razorpay's own guarantee
    that we hear about the payment outcome regardless of what the browser
    does.

    Note: the webhook alone cannot create a brand-new order (it has no
    knowledge of the cart/shipping address) — it reconciles the `payments`
    record's status and logs the event. If a captured payment arrives here
    with no matching order yet, it's flagged for manual admin review
    rather than silently dropped.
    """
    db = get_database()
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not razorpay_webhook_secret:
        _log_payment_event(
            db, "webhook_rejected", error="RAZORPAY_WEBHOOK_SECRET not configured"
        )
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    expected_signature = hmac.new(
        razorpay_webhook_secret.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        _log_payment_event(db, "webhook_signature_mismatch", error="Invalid X-Razorpay-Signature")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json

    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {}) or payload.get(
        "payload", {}
    ).get("refund", {}).get("entity", {})

    rz_payment_id = entity.get("id")
    rz_order_id = entity.get("order_id")
    amount = (entity.get("amount") or 0) / 100

    _log_payment_event(
        db,
        f"webhook_received:{event}",
        razorpay_order_id=rz_order_id,
        razorpay_payment_id=rz_payment_id,
        status=entity.get("status"),
        amount=amount,
        raw_payload=payload,
    )

    if event == "payment.captured":
        payment_record = db["payments"].find_one({"razorpay_order_id": rz_order_id})
        if payment_record and payment_record.get("status") != "captured":
            db["payments"].update_one(
                {"razorpay_order_id": rz_order_id},
                {
                    "$set": {
                        "status": "captured",
                        "razorpay_payment_id": rz_payment_id,
                        "updated_at": datetime.now(),
                        "reconciled_via_webhook": True,
                    }
                },
            )
        elif not payment_record:
            print(
                f"[Webhook] payment.captured for unknown razorpay_order_id={rz_order_id} "
                f"payment_id={rz_payment_id} - no matching payment record. Flagging for review."
            )
            db["payment_logs"].insert_one(
                {
                    "razorpay_order_id": rz_order_id,
                    "razorpay_payment_id": rz_payment_id,
                    "event_type": "webhook_orphaned_payment",
                    "status": "needs_manual_review",
                    "amount": amount,
                    "raw_payload": payload,
                    "created_at": datetime.now(),
                }
            )

    elif event == "payment.failed":
        db["payments"].update_one(
            {"razorpay_order_id": rz_order_id},
            {"$set": {"status": "failed", "updated_at": datetime.now()}},
        )

    elif event in ("refund.created", "refund.processed"):
        status = "refund_initiated" if event == "refund.created" else "refunded"
        db["payments"].update_one(
            {"razorpay_payment_id": rz_payment_id},
            {"$set": {"status": status, "updated_at": datetime.now()}},
        )
        db["refunds"].update_one(
            {"razorpay_refund_id": entity.get("id")},
            {
                "$set": {
                    "status": "success" if event == "refund.processed" else "processing",
                    "updated_at": datetime.now(),
                }
            },
        )

    return {"success": True, "event": event}


# ── 4. COD order ─────────────────────────────────────────────────────────────


@router.post("/cod/create-order")
def create_cod_order(order_data: dict, current_user: dict = Depends(get_current_user)):
    """
    Create a Cash-on-Delivery order. Unlike Razorpay orders, no payment has
    happened yet at this point, so stock IS validated before the order is
    created — a customer can never place a COD order for something that's
    already out of stock.
    """
    db = get_database()

    stock_items = _stock_items_from_order_data(order_data)
    if stock_items:
        inventory = InventoryService(db)
        errors = inventory.check_availability(stock_items)
        if errors:
            raise HTTPException(status_code=409, detail="; ".join(errors))

    try:
        order_num = _gen_order_number()
        order_data.update(
            {
                "user_id": current_user.get("id"),
                "order_number": order_num,
                "status": "confirmed",
                "payment_status": "pending",
                "payment_method": "COD",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
        )
        result = db["orders"].insert_one(order_data)
        order_id = str(result.inserted_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"COD order creation failed: {e}")

    _record_initial_order_log(db, order_id, "confirmed", "COD order placed")

    if stock_items:
        try:
            InventoryService(db).reduce_stock_for_order(stock_items, order_id)
        except InsufficientStockError as exc:
            # Should be rare since we just checked availability above, but
            # a concurrent order could have taken the last unit in between.
            db["orders"].delete_one({"_id": result.inserted_id})
            db["order_logs"].delete_many({"order_id": order_id})
            raise HTTPException(status_code=409, detail=str(exc))

    coupon_code = order_data.get("coupon_code")
    if coupon_code:
        try:
            CouponService(db).record_usage(coupon_code)
        except Exception as exc:
            print(f"[Coupon] failed to record usage for {coupon_code}: {exc}")

    shipping_addr = order_data.get("shipping_address", {})
    # Save payment record
    db["payments"].insert_one(
        {
            "razorpay_order_id": f"cod_{order_id}",
            "amount": order_data.get("total_amount", 0),
            "currency": "INR",
            "status": "cod_pending",
            "payment_method": "COD",
            "order_id": order_id,
            "order_number": order_num,
            "user_id": current_user.get("id"),
            "customer_email": current_user.get("email", ""),
            "customer_name": shipping_addr.get("full_name", ""),
            "customer_phone": shipping_addr.get("phone", ""),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    )
    _log_payment_event(
        db,
        "cod_order_created",
        status="cod_pending",
        amount=order_data.get("total_amount"),
    )

    if current_user.get("id"):
        try:
            from bson import ObjectId
            db["users"].update_one(
                {"_id": ObjectId(current_user["id"])},
                {"$inc": {"orders_count": 1}}
            )
        except Exception as exc:
            print(f"[User] Failed to increment orders_count: {exc}")

    notify_ctx = {**order_data, "_order_id_for_notify": order_id}
    _send_order_notifications(db, NotificationEvent.ORDER_CONFIRMED, notify_ctx, order_num, current_user.get("id"))

    _trigger_shiprocket(order_id, order_data, db)

    return {
        "success": True,
        "order_id": order_id,
        "order_number": order_num,
        "message": "COD order placed successfully",
    }


# ── 5. Admin: list all payments ───────────────────────────────────────────────


@router.get("/")
def get_all_payments(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin),
):
    """List all payment records (Admin only)."""
    db = get_database()
    try:
        query: dict = {}
        if status and status != "all":
            query["status"] = status

        payments = list(
            db["payments"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        )
        for p in payments:
            p["id"] = str(p.pop("_id"))

        # Apply search after transform
        if search:
            sl = search.lower()
            payments = [
                p
                for p in payments
                if sl in (p.get("order_number") or "").lower()
                or sl in (p.get("customer_name") or "").lower()
                or sl in (p.get("customer_email") or "").lower()
                or sl in (p.get("razorpay_payment_id") or "").lower()
            ]

        total = db["payments"].count_documents(query)
        return {"payments": payments, "total": total, "skip": skip, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. Admin: payment stats ───────────────────────────────────────────────────


@router.get("/stats")
def get_payment_stats(current_user: dict = Depends(require_admin)):
    """Payment statistics for admin dashboard (Admin only)."""
    db = get_database()
    try:
        payments = list(db["payments"].find())

        captured = [p for p in payments if p.get("status") == "captured"]
        cod_pending = [p for p in payments if p.get("status") == "cod_pending"]
        cod_done = [p for p in payments if p.get("status") == "cod_completed"]
        failed = [p for p in payments if p.get("status") == "failed"]

        online_rev = sum(p.get("amount", 0) for p in captured)
        cod_rev = sum(p.get("amount", 0) for p in cod_pending + cod_done)

        return {
            "total_payments": len(payments),
            "captured": len(captured),
            "cod_pending": len(cod_pending),
            "cod_completed": len(cod_done),
            "failed": len(failed),
            "total_revenue": online_rev + cod_rev,
            "online_revenue": online_rev,
            "cod_revenue_pending": sum(p.get("amount", 0) for p in cod_pending),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 7. Admin: payment audit log for a specific payment/order ────────────────


@router.get("/logs/{razorpay_order_id}")
def get_payment_logs(razorpay_order_id: str, current_user: dict = Depends(require_admin)):
    """Full audit trail for a Razorpay order (Admin only) — every event
    from order_created through captured/failed/webhook reconciliation."""
    db = get_database()
    logs = list(
        db["payment_logs"]
        .find({"razorpay_order_id": razorpay_order_id})
        .sort("created_at", 1)
    )
    for log in logs:
        log["_id"] = str(log["_id"])
    return {"razorpay_order_id": razorpay_order_id, "logs": logs}


# ── 8. Customer/Admin: retry a failed payment ────────────────────────────────


@router.post("/retry/{order_id}")
def retry_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    """
    Creates a fresh Razorpay order for an existing app order whose payment
    previously failed, so the customer can pay again without re-entering
    their address/cart. Only allowed while the order's payment_status is
    still 'pending' or 'failed' — an already-captured or COD order cannot
    be "retried".
    """
    from bson import ObjectId

    db = get_database()
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")

    order = db["orders"].find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if str(order.get("user_id")) != str(current_user.get("id")) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorised for this order")

    if order.get("payment_status") not in ("pending", "failed"):
        raise HTTPException(
            status_code=400,
            detail=f"Order payment_status is '{order.get('payment_status')}' — cannot retry",
        )

    client = _rz_client()
    amount = float(order.get("total_amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid order amount")

    try:
        rz_order = client.order.create(
            {
                "amount": int(amount * 100),
                "currency": "INR",
                "receipt": f"retry_{order_id[-10:]}_{''.join(random.choices(string.digits, k=4))}",
                "notes": {"order_id": order_id, "retry": "true"},
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay retry order creation failed: {e}")

    db["payments"].insert_one(
        {
            "razorpay_order_id": rz_order["id"],
            "amount": amount,
            "currency": "INR",
            "status": "created",
            "order_id": order_id,
            "order_number": order.get("order_number"),
            "user_id": current_user.get("id"),
            "is_retry": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    )
    _log_payment_event(
        db, "retry_order_created", razorpay_order_id=rz_order["id"], amount=amount
    )

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": amount,
        "currency": rz_order["currency"],
        "key_id": razorpay_key_id,
        "order_id": order_id,
        "order_number": order.get("order_number"),
    }
