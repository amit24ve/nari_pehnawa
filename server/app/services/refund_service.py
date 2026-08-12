"""
RefundService — creates and processes refunds against Razorpay, with retry
support and a manual-completion path for COD orders (which never had an
online payment to refund against — the seller settles those out-of-band,
e.g. bank transfer, and an admin marks the refund as completed once done).

Refund lifecycle (per the spec):
    Return/Cancellation Approved -> Refund Initiated -> Refund Processing
        -> Refund Success | Refund Failed -> Retry
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo.database import Database

from app.config import razorpay_key_id, razorpay_key_secret

try:
    import razorpay as _razorpay_lib

    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False


class RefundServiceError(Exception):
    pass


class RefundService:
    def __init__(self, db: Database):
        self.db = db
        self.refunds = db["refunds"]
        self.payments = db["payments"]
        self.orders = db["orders"]

    def _get_client(self):
        if not RAZORPAY_AVAILABLE:
            raise RefundServiceError("razorpay package not installed")
        if not razorpay_key_id or not razorpay_key_secret:
            raise RefundServiceError("Razorpay credentials not configured")
        return _razorpay_lib.Client(auth=(razorpay_key_id, razorpay_key_secret))

    # ── create ───────────────────────────────────────────────────────────

    def create_refund(
        self,
        order_id: str,
        amount: float,
        reason: str,
        return_id: Optional[str] = None,
        cancellation_id: Optional[str] = None,
        exchange_id: Optional[str] = None,
        auto_process: bool = True,
    ) -> dict:
        """Creates a `refunds` document and, if auto_process is True and the
        order was paid online via Razorpay, immediately attempts to process
        it. Returns the (possibly updated) refund document."""
        refund_doc = {
            "order_id": order_id,
            "return_id": return_id,
            "cancellation_id": cancellation_id,
            "exchange_id": exchange_id,
            "amount": amount,
            "reason": reason,
            "status": "initiated",
            "attempts": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        result = self.refunds.insert_one(refund_doc)
        refund_id = str(result.inserted_id)
        refund_doc["_id"] = refund_id

        if auto_process:
            refund_doc = self.process_refund(refund_id)

        return refund_doc

    # ── process ──────────────────────────────────────────────────────────

    def process_refund(self, refund_id: str) -> dict:
        """
        Attempts to actually move the money back:
          - If the order was paid via Razorpay and has a captured payment,
            calls the real Razorpay refund API.
          - If the order was COD (no online payment to reverse), marks the
            refund as `processing` and leaves it for an admin to confirm
            once the bank transfer/other offline refund has been sent
            (see mark_manual_success below) — there is no online payment
            gateway involved for COD, so "processing" here means "awaiting
            manual settlement", which is the honest state.
        """
        refund = self.refunds.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            raise RefundServiceError(f"Refund not found: {refund_id}")

        order = self.orders.find_one({"_id": ObjectId(refund["order_id"])})
        if not order:
            raise RefundServiceError(f"Order not found for refund: {refund_id}")

        payment = self.payments.find_one(
            {"order_id": refund["order_id"], "status": {"$in": ["captured", "refund_initiated"]}}
        )

        self.refunds.update_one(
            {"_id": ObjectId(refund_id)},
            {"$inc": {"attempts": 1}, "$set": {"updated_at": datetime.now(), "status": "processing"}},
        )

        if payment and payment.get("razorpay_payment_id") and (order.get("payment_method") == "Razorpay"):
            try:
                client = self._get_client()
                rz_refund = client.payment.refund(
                    payment["razorpay_payment_id"],
                    {"amount": int(refund["amount"] * 100)},
                )
                self.refunds.update_one(
                    {"_id": ObjectId(refund_id)},
                    {
                        "$set": {
                            "status": "success",
                            "razorpay_refund_id": rz_refund.get("id"),
                            "updated_at": datetime.now(),
                        }
                    },
                )
                self.payments.update_one(
                    {"_id": payment["_id"]},
                    {"$set": {"status": "refunded", "updated_at": datetime.now()}},
                )
            except Exception as exc:
                self.refunds.update_one(
                    {"_id": ObjectId(refund_id)},
                    {
                        "$set": {
                            "status": "failed",
                            "error": str(exc),
                            "updated_at": datetime.now(),
                        }
                    },
                )
        else:
            # COD / no online payment to reverse — needs manual settlement.
            self.refunds.update_one(
                {"_id": ObjectId(refund_id)},
                {
                    "$set": {
                        "status": "processing",
                        "error": None,
                        "updated_at": datetime.now(),
                    }
                },
            )

        updated = self.refunds.find_one({"_id": ObjectId(refund_id)})
        updated["_id"] = str(updated["_id"])
        return updated

    def retry_refund(self, refund_id: str) -> dict:
        """Re-attempts a failed refund. Simply calls process_refund again —
        the attempts counter tracks how many tries have happened."""
        refund = self.refunds.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            raise RefundServiceError(f"Refund not found: {refund_id}")
        if refund.get("status") == "success":
            raise RefundServiceError("Refund already succeeded — cannot retry")
        return self.process_refund(refund_id)

    def mark_manual_success(self, refund_id: str, admin_note: Optional[str] = None) -> dict:
        """For COD orders where an admin has manually settled the refund
        (bank transfer, UPI, etc outside Razorpay) — marks it success."""
        refund = self.refunds.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            raise RefundServiceError(f"Refund not found: {refund_id}")

        self.refunds.update_one(
            {"_id": ObjectId(refund_id)},
            {
                "$set": {
                    "status": "success",
                    "error": admin_note,
                    "updated_at": datetime.now(),
                }
            },
        )
        updated = self.refunds.find_one({"_id": ObjectId(refund_id)})
        updated["_id"] = str(updated["_id"])
        return updated


def get_refund_service(db: Database) -> RefundService:
    return RefundService(db)
