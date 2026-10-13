"""
Influencer Collaboration & Referral Tracking Service for Nari Pehnawa.
Completely isolated module managing creators, referral clicks, order attribution,
and commission ledger calculations.
"""

from datetime import datetime, timezone, timedelta
import hashlib
import secrets
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo.database import Database
import os

FEATURE_FLAG_KEY = "COLLABORATION_SYSTEM_ENABLED"


def is_collaboration_enabled(db: Database) -> bool:
    """Check if the collaboration module feature flag is enabled."""
    env_val = os.getenv(FEATURE_FLAG_KEY, "true").lower()
    if env_val in ("false", "0", "no"):
        return False
    # Check DB settings if available
    try:
        setting = db["admin_settings"].find_one({"key": "collaboration_system_enabled"})
        if setting and setting.get("value") is False:
            return False
    except Exception:
        pass
    return True


def hash_token(token: str) -> str:
    """SHA-256 hash for secure storage of creator dashboard tokens."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class CollaborationService:
    def __init__(self, db: Database):
        self.db = db
        self.creators = db["collab_creators"]
        self.clicks = db["collab_clicks"]
        self.attributions = db["collab_order_attributions"]
        self.ledger = db["collab_commission_ledger"]
        self.payouts = db["collab_payouts"]
        self.audit_logs = db["collab_audit_logs"]
        self.orders = db["orders"]

    def ensure_indexes(self):
        """Ensure necessary indexes for fast lookup and uniqueness."""
        try:
            self.creators.create_index("referral_code", unique=True)
            self.creators.create_index("token_hash", unique=True)
            self.creators.create_index("status")
            self.clicks.create_index([("referral_code", 1), ("created_at", -1)])
            self.clicks.create_index([("visitor_id", 1), ("referral_code", 1), ("created_at", -1)])
            self.attributions.create_index("order_id", unique=True)
            self.attributions.create_index("creator_id")
            self.attributions.create_index("referral_code")
            self.ledger.create_index([("order_id", 1), ("entry_type", 1)])
            self.ledger.create_index("creator_id")
            self.payouts.create_index("creator_id")
        except Exception as e:
            print(f"[CollaborationService] Index creation note: {e}")

    # ── Creator CRUD & Token Management ─────────────────────────────────────

    def create_creator(
        self,
        name: str,
        referral_code: str,
        commission_rate: float = 10.0,
        customer_discount_rate: float = 5.0,
        commission_basis: str = "eligible_subtotal",
        email: Optional[str] = None,
        phone: Optional[str] = None,
        instagram_handle: Optional[str] = None,
        notes: Optional[str] = None,
        approved_products: Optional[List[str]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        created_by: str = "admin",
    ) -> Dict[str, Any]:
        """Create a new creator collaboration with generated dashboard token."""
        code = referral_code.strip().upper()
        if not code or len(code) < 3:
            raise ValueError("Referral code must be at least 3 characters.")

        if self.creators.find_one({"referral_code": code}):
            raise ValueError(f"Referral code '{code}' is already in use.")

        raw_token = secrets.token_urlsafe(32)
        t_hash = hash_token(raw_token)

        now = datetime.now(timezone.utc)
        creator_doc = {
            "name": name.strip(),
            "email": email.strip() if email else None,
            "phone": phone.strip() if phone else None,
            "instagram_handle": instagram_handle.strip().replace("@", "") if instagram_handle else None,
            "notes": notes,
            "referral_code": code,
            "token_hash": t_hash,
            "commission_rate": float(commission_rate),
            "customer_discount_rate": float(customer_discount_rate) if customer_discount_rate is not None else 0.0,
            "commission_basis": commission_basis,  # "eligible_subtotal" | "net_order_amount"
            "approved_products": approved_products or [],  # Empty means all products approved
            "start_date": start_date or now,
            "end_date": end_date,
            "status": "active",  # "active" | "paused" | "revoked" | "expired"
            "created_at": now,
            "updated_at": now,
            "created_by": created_by,
        }

        res = self.creators.insert_one(creator_doc)
        creator_id = str(res.inserted_id)

        # Audit log
        self._audit_log(
            creator_id=creator_id,
            action="creator_created",
            changed_by=created_by,
            details={"referral_code": code, "commission_rate": commission_rate},
        )

        creator_doc["_id"] = creator_id
        creator_doc["id"] = creator_id
        creator_doc["raw_token"] = raw_token  # Return once for the admin to copy
        creator_doc["raw_dashboard_token"] = raw_token
        return creator_doc

    def regenerate_token(self, creator_id: str, admin_user: str = "admin") -> str:
        """Regenerate the private dashboard token, revoking the previous one."""
        raw_token = secrets.token_urlsafe(32)
        t_hash = hash_token(raw_token)

        res = self.creators.find_one_and_update(
            {"_id": ObjectId(creator_id)},
            {"$set": {"token_hash": t_hash, "updated_at": datetime.now(timezone.utc)}},
            return_document=True,
        )
        if not res:
            raise ValueError("Creator not found.")

        self._audit_log(
            creator_id=creator_id,
            action="token_regenerated",
            changed_by=admin_user,
            details={"message": "Dashboard token regenerated and old token revoked"},
        )
        return raw_token

    def update_creator_status(self, creator_id: str, new_status: str, admin_user: str = "admin") -> Dict[str, Any]:
        """Update status: active, paused, revoked, expired."""
        valid_statuses = ("active", "paused", "revoked", "expired")
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of {valid_statuses}")

        res = self.creators.find_one_and_update(
            {"_id": ObjectId(creator_id)},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
            return_document=True,
        )
        if not res:
            raise ValueError("Creator not found.")

        self._audit_log(
            creator_id=creator_id,
            action="status_updated",
            changed_by=admin_user,
            details={"new_status": new_status},
        )
        res["_id"] = str(res["_id"])
        return res

    def update_creator(
        self,
        creator_id: str,
        update_data: Dict[str, Any],
        admin_user: str = "admin",
    ) -> Dict[str, Any]:
        """Update creator profile and commission rate with audit record."""
        current = self.creators.find_one({"_id": ObjectId(creator_id)})
        if not current:
            raise ValueError("Creator not found.")

        allowed_fields = [
            "name", "email", "phone", "instagram_handle", "notes",
            "commission_rate", "customer_discount_rate", "commission_basis",
            "approved_products", "start_date", "end_date", "status"
        ]

        set_fields = {}
        for f in allowed_fields:
            if f in update_data and update_data[f] is not None:
                set_fields[f] = update_data[f]

        if "commission_rate" in set_fields:
            set_fields["commission_rate"] = float(set_fields["commission_rate"])
            if set_fields["commission_rate"] != current.get("commission_rate"):
                self._audit_log(
                    creator_id=creator_id,
                    action="commission_rate_changed",
                    changed_by=admin_user,
                    details={
                        "old_rate": current.get("commission_rate"),
                        "new_rate": set_fields["commission_rate"],
                        "effective_from": datetime.now(timezone.utc).isoformat(),
                    },
                )

        if "customer_discount_rate" in set_fields:
            set_fields["customer_discount_rate"] = float(set_fields["customer_discount_rate"])

        set_fields["updated_at"] = datetime.now(timezone.utc)
        res = self.creators.find_one_and_update(
            {"_id": ObjectId(creator_id)},
            {"$set": set_fields},
            return_document=True,
        )
        res["_id"] = str(res["_id"])
        return res

    def delete_creator(self, creator_id: str, admin_user: str = "admin") -> bool:
        """Permanently delete a creator collaboration and record audit log."""
        creator = self.creators.find_one({"_id": ObjectId(creator_id)})
        if not creator:
            raise ValueError("Creator not found.")

        self.creators.delete_one({"_id": ObjectId(creator_id)})
        self._audit_log(
            creator_id=creator_id,
            action="creator_deleted",
            changed_by=admin_user,
            details={
                "name": creator.get("name"),
                "referral_code": creator.get("referral_code"),
                "deleted_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        return True

    def get_creator_by_token(self, raw_token: str) -> Optional[Dict[str, Any]]:
        """Find creator by raw dashboard token via SHA-256 hash comparison."""
        t_hash = hash_token(raw_token)
        creator = self.creators.find_one({"token_hash": t_hash})
        if creator:
            creator["_id"] = str(creator["_id"])
            del creator["token_hash"]
        return creator

    def get_creator_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Find creator by referral code."""
        creator = self.creators.find_one({"referral_code": code.strip().upper()})
        if creator:
            creator["_id"] = str(creator["_id"])
            if "token_hash" in creator:
                del creator["token_hash"]
        return creator

    # ── Click Tracking & De-duplication ────────────────────────────────────

    def record_click(
        self,
        referral_code: str,
        visitor_id: Optional[str] = None,
        landing_page: Optional[str] = None,
        referrer: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Record a referral link click.
        Checks for unique visitor within a 24-hour window to avoid inflating click metrics.
        """
        if not is_collaboration_enabled(self.db):
            return {"status": "disabled"}

        code = referral_code.strip().upper()
        creator = self.creators.find_one({"referral_code": code})
        if not creator:
            return {"status": "invalid_code"}

        now = datetime.now(timezone.utc)
        # Check collaboration validity (dates & status)
        if creator.get("status") != "active":
            return {"status": "inactive_creator"}

        if creator.get("end_date") and now > creator["end_date"].replace(tzinfo=timezone.utc if creator["end_date"].tzinfo is None else creator["end_date"].tzinfo):
            return {"status": "expired"}

        # Anonymized IP hash for privacy
        ip_hash = hashlib.sha256((ip_address or "unknown").encode("utf-8")).hexdigest()[:16] if ip_address else None

        # Check for duplicate click in the last 24 hours for this visitor
        twenty_four_hours_ago = now - timedelta(hours=24)
        is_unique_24h = True
        if visitor_id:
            recent_click = self.clicks.find_one({
                "referral_code": code,
                "visitor_id": visitor_id,
                "created_at": {"$gte": twenty_four_hours_ago},
            })
            if recent_click:
                is_unique_24h = False

        click_doc = {
            "creator_id": str(creator["_id"]),
            "referral_code": code,
            "visitor_id": visitor_id,
            "is_unique_24h": is_unique_24h,
            "landing_page": landing_page or "/",
            "referrer": referrer,
            "ip_hash": ip_hash,
            "user_agent": user_agent[:255] if user_agent else None,
            "created_at": now,
        }
        self.clicks.insert_one(click_doc)

        inc_fields = {"total_clicks": 1}
        if is_unique_24h:
            inc_fields["unique_visitors"] = 1
        self.creators.update_one(
            {"_id": creator["_id"]},
            {"$inc": inc_fields}
        )

        return {
            "status": "success",
            "tracked": True,
            "referral_code": code,
            "creator_name": creator.get("name"),
            "is_unique": is_unique_24h,
        }

    # ── Order Attribution & Commission Calculation ──────────────────────────

    def attribute_order_if_eligible(
        self,
        order_id: str,
        referral_code: Optional[str],
        order_data: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Integrates with the order placement flow.
        Calculates eligible subtotal based on approved products, records attribution,
        and posts an initial 'pending' commission ledger entry.
        """
        if not is_collaboration_enabled(self.db) or not referral_code:
            return None

        code = referral_code.strip().upper()
        creator = self.creators.find_one({"referral_code": code})
        if not creator or creator.get("status") != "active":
            return None

        now = datetime.now(timezone.utc)
        # Check date range
        start_date = creator.get("start_date")
        end_date = creator.get("end_date")
        if start_date and now < start_date.replace(tzinfo=timezone.utc if start_date.tzinfo is None else start_date.tzinfo):
            return None
        if end_date and now > end_date.replace(tzinfo=timezone.utc if end_date.tzinfo is None else end_date.tzinfo):
            return None

        # Check existing attribution to avoid duplicate attribution
        existing = self.attributions.find_one({"order_id": str(order_id)})
        if existing:
            return existing

        # Calculate eligible commission base
        basis = creator.get("commission_basis", "eligible_subtotal")
        rate = float(creator.get("commission_rate", 10.0))
        approved_pids = set(creator.get("approved_products") or [])

        items = order_data.get("items") or []
        eligible_items_subtotal = 0.0

        for item in items:
            pid = str(item.get("product_id") or item.get("id") or "")
            item_total = float(item.get("total") or (float(item.get("price") or 0) * int(item.get("quantity") or 1)))
            if not approved_pids or pid in approved_pids:
                eligible_items_subtotal += item_total

        # Apply proportional order discount if any
        order_subtotal = float(order_data.get("subtotal") or eligible_items_subtotal or 0.0)
        order_discount = float(order_data.get("discount") or 0.0)
        if order_subtotal > 0 and order_discount > 0:
            discount_ratio = max(0.0, 1.0 - (order_discount / order_subtotal))
            eligible_items_subtotal *= discount_ratio

        if basis == "net_order_amount":
            commission_base = float(order_data.get("total_amount") or eligible_items_subtotal)
        else:
            commission_base = eligible_items_subtotal

        commission_amount = round((commission_base * rate) / 100.0, 2)

        attribution_doc = {
            "order_id": str(order_id),
            "order_number": order_data.get("order_number"),
            "creator_id": str(creator["_id"]),
            "creator_name": creator.get("name"),
            "referral_code": code,
            "commission_rate": rate,
            "commission_basis": basis,
            "commission_base_amount": round(commission_base, 2),
            "eligible_base": round(commission_base, 2),
            "commission_amount": commission_amount,
            "commission_status": "pending",
            "order_total": float(order_data.get("total_amount") or 0.0),
            "order_status": order_data.get("order_status") or order_data.get("status", "pending"),
            "payment_status": order_data.get("payment_status", "pending"),
            "payment_method": order_data.get("payment_method", "N/A"),
            "created_at": now,
            "updated_at": now,
        }
        self.attributions.insert_one(attribution_doc)

        self.creators.update_one(
            {"_id": creator["_id"]},
            {"$inc": {"attributed_orders": 1, "eligible_sales": round(commission_base, 2)}}
        )

        # Post initial 'pending' commission ledger entry
        self._record_ledger_entry(
            creator_id=str(creator["_id"]),
            order_id=str(order_id),
            order_number=order_data.get("order_number"),
            entry_type="pending",
            amount=commission_amount,
            notes=f"Order placed with {rate}% commission",
        )

        return attribution_doc

    def on_order_status_updated(self, order_id: str, new_status: str, previous_status: Optional[str] = None):
        """
        Handle order status changes (delivered, cancelled, returned, refunded).
        Idempotent and safe.
        """
        if not is_collaboration_enabled(self.db):
            return

        attribution = self.attributions.find_one({"order_id": str(order_id)})
        if not attribution:
            return  # Not an attributed order

        creator_id = attribution["creator_id"]
        comm_amount = float(attribution["commission_amount"])
        now = datetime.now(timezone.utc)

        # If order is delivered / completed: transition to 'approved'
        if new_status in ("delivered", "completed"):
            has_approved = self.ledger.find_one({"order_id": str(order_id), "entry_type": {"$in": ["approved", "payable"]}})
            if not has_approved:
                self.attributions.update_one(
                    {"order_id": str(order_id)},
                    {"$set": {"order_status": new_status, "commission_status": "approved", "updated_at": now}},
                )
                self.creators.update_one(
                    {"_id": ObjectId(creator_id)},
                    {"$inc": {"commission_earned": comm_amount, "outstanding_liability": comm_amount}}
                )
                self._record_ledger_entry(
                    creator_id=creator_id,
                    order_id=str(order_id),
                    order_number=attribution.get("order_number"),
                    entry_type="approved",
                    amount=comm_amount,
                    notes=f"Order marked {new_status}; commission approved pending return window",
                )
            else:
                self.attributions.update_one(
                    {"order_id": str(order_id)},
                    {"$set": {"order_status": new_status, "updated_at": now}},
                )

        # If order is cancelled, returned, or refunded: reverse commission
        elif new_status in ("cancelled", "returned", "refunded"):
            has_reversal = self.ledger.find_one({"order_id": str(order_id), "entry_type": "reversed"})
            if not has_reversal:
                self.attributions.update_one(
                    {"order_id": str(order_id)},
                    {"$set": {"order_status": new_status, "commission_status": "reversed", "reversed_amount": comm_amount, "updated_at": now}},
                )
                if attribution.get("commission_status") in ("approved", "payable"):
                    self.creators.update_one(
                        {"_id": ObjectId(creator_id)},
                        {"$inc": {"outstanding_liability": -comm_amount}}
                    )
                self._record_ledger_entry(
                    creator_id=creator_id,
                    order_id=str(order_id),
                    order_number=attribution.get("order_number"),
                    entry_type="reversed",
                    amount=-comm_amount,
                    notes=f"Order marked {new_status}; commission reversed",
                )
            else:
                self.attributions.update_one(
                    {"order_id": str(order_id)},
                    {"$set": {"order_status": new_status, "updated_at": now}},
                )
        else:
            self.attributions.update_one(
                {"order_id": str(order_id)},
                {"$set": {"order_status": new_status, "updated_at": now}},
            )

    def handle_refund_reversal(self, order_id: str, refund_amount: float, is_partial: bool = False):
        """
        Handles partial or full refunds. Idempotently adjusts commission ledger.
        """
        attribution = self.attributions.find_one({"order_id": str(order_id)})
        if not attribution:
            return

        creator_id = attribution["creator_id"]
        comm_rate = float(attribution.get("commission_rate", 10.0))
        order_total = float(attribution.get("order_total", 0.0))

        if is_partial and order_total > 0:
            reversal_comm = round((refund_amount * comm_rate) / 100.0, 2)
        else:
            reversal_comm = float(attribution.get("commission_amount", 0.0))

        # Check if already reversed for this amount
        existing = self.ledger.find_one({
            "order_id": str(order_id),
            "entry_type": "reversed",
            "amount": -reversal_comm
        })
        if not existing:
            self._record_ledger_entry(
                creator_id=creator_id,
                order_id=str(order_id),
                order_number=attribution.get("order_number"),
                entry_type="reversed",
                amount=-reversal_comm,
                notes=f"Refund of ₹{refund_amount:,.2f} processed; commission adjusted",
            )

    # ── Commission Ledger & Payouts ─────────────────────────────────────────

    def _record_ledger_entry(
        self,
        creator_id: str,
        order_id: Optional[str],
        order_number: Optional[str],
        entry_type: str,  # "pending", "approved", "payable", "paid", "reversed"
        amount: float,
        notes: str,
    ):
        """Appends an immutable entry to collab_commission_ledger."""
        entry = {
            "creator_id": creator_id,
            "order_id": order_id,
            "order_number": order_number,
            "entry_type": entry_type,
            "amount": round(amount, 2),
            "notes": notes,
            "created_at": datetime.now(timezone.utc),
        }
        self.ledger.insert_one(entry)

    def record_payout(
        self,
        creator_id: str,
        amount: float,
        payment_method: str = "Bank Transfer",
        reference_id: Optional[str] = None,
        notes: Optional[str] = None,
        admin_user: str = "admin",
    ) -> Dict[str, Any]:
        """Record an admin payment made to a creator."""
        creator = self.creators.find_one({"_id": ObjectId(creator_id)})
        if not creator:
            raise ValueError("Creator not found.")

        amt = round(float(amount), 2)
        if amt <= 0:
            raise ValueError("Payout amount must be greater than zero.")

        now = datetime.now(timezone.utc)
        payout_doc = {
            "creator_id": str(creator["_id"]),
            "creator_name": creator.get("name"),
            "amount": amt,
            "payment_method": payment_method,
            "reference_id": reference_id or f"PAY_{now.strftime('%Y%m%d%H%M%S')}",
            "notes": notes,
            "recorded_by": admin_user,
            "created_at": now,
        }
        res = self.payouts.insert_one(payout_doc)
        payout_id = str(res.inserted_id)

        # Also add a 'paid' ledger entry to keep ledger reconciled
        self._record_ledger_entry(
            creator_id=str(creator["_id"]),
            order_id=None,
            order_number=None,
            entry_type="paid",
            amount=-amt,
            notes=f"Payout recorded: {payment_method} ref #{payout_doc['reference_id']}",
        )

        self._audit_log(
            creator_id=str(creator["_id"]),
            action="payout_recorded",
            changed_by=admin_user,
            details={"payout_id": payout_id, "amount": amt, "reference_id": payout_doc["reference_id"]},
        )
        # Also update creator document totals
        self.creators.update_one(
            {"_id": creator["_id"]},
            {"$inc": {"commission_paid": amt, "outstanding_liability": -amt}}
        )

        payout_doc["_id"] = payout_id
        payout_doc["payout_id"] = payout_id
        payout_doc["outstanding_liability"] = max(0.0, float(creator.get("outstanding_liability", 0.0)) - amt)
        return payout_doc

    # ── Creator Dashboard Analytics (Read-Only, Zero PII) ────────────────────

    def get_creator_dashboard_stats(
        self,
        creator_id: str,
        start_filter: Optional[datetime] = None,
        end_filter: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Aggregate creator statistics with absolute privacy (ZERO customer PII).
        """
        creator = self.creators.find_one({"_id": ObjectId(creator_id)})
        if not creator:
            raise ValueError("Creator not found.")

        query_clicks = {"creator_id": creator_id}
        query_attr = {"creator_id": creator_id}
        if start_filter or end_filter:
            date_q = {}
            if start_filter:
                date_q["$gte"] = start_filter
            if end_filter:
                date_q["$lte"] = end_filter
            query_clicks["created_at"] = date_q
            query_attr["created_at"] = date_q

        # Clicks aggregation
        total_clicks = self.clicks.count_documents(query_clicks)
        unique_visitors = self.clicks.count_documents({**query_clicks, "is_unique_24h": True})

        # Attributed orders
        attributions = list(self.attributions.find(query_attr).sort("created_at", -1))
        total_attributed_orders = len(attributions)

        # Order breakdown counts
        status_counts = {
            "pending": 0,
            "confirmed": 0,
            "processing": 0,
            "shipped": 0,
            "delivered": 0,
            "completed": 0,
            "cancelled": 0,
            "returned": 0,
            "refunded": 0,
        }

        eligible_sales_value = 0.0
        total_commission_earned = 0.0

        for a in attributions:
            st = (a.get("order_status") or "pending").lower()
            if st in status_counts:
                status_counts[st] += 1
            else:
                status_counts["processing"] += 1

            # Only successful/active orders count towards eligible sales
            if st not in ("cancelled", "returned", "refunded"):
                eligible_sales_value += float(a.get("commission_base_amount") or 0.0)
                total_commission_earned += float(a.get("commission_amount") or 0.0)

        eligible_successful_orders = sum(status_counts[k] for k in ("confirmed", "processing", "shipped", "delivered", "completed"))

        # Commission breakdown from ledger
        ledger_entries = list(self.ledger.find({"creator_id": creator_id}))
        comm_pending = sum(e["amount"] for e in ledger_entries if e["entry_type"] == "pending")
        comm_approved = sum(e["amount"] for e in ledger_entries if e["entry_type"] == "approved")
        comm_reversed = abs(sum(e["amount"] for e in ledger_entries if e["entry_type"] == "reversed"))
        
        # Total payouts
        payout_docs = list(self.payouts.find({"creator_id": creator_id}))
        comm_paid = sum(p["amount"] for p in payout_docs)

        # Net approved balance awaiting payout
        comm_payable = max(0.0, comm_approved - comm_paid - comm_reversed)

        # Recent orders list (STRICTLY SANITIZED - NO PII)
        sanitized_orders = []
        for a in attributions[:20]:
            sanitized_orders.append({
                "order_number": a.get("order_number"),
                "date": a.get("created_at").strftime("%d %b %Y, %I:%M %p") if isinstance(a.get("created_at"), datetime) else str(a.get("created_at")),
                "order_status": a.get("order_status"),
                "commission_base": float(a.get("commission_base_amount") or 0.0),
                "commission_earned": float(a.get("commission_amount") or 0.0),
            })

        # Conversion rate
        conv_rate = round((total_attributed_orders / total_clicks * 100), 2) if total_clicks > 0 else 0.0

        return {
            "creator_name": creator.get("name"),
            "referral_code": creator.get("referral_code"),
            "commission_rate": creator.get("commission_rate"),
            "customer_discount_rate": creator.get("customer_discount_rate", 0.0),
            "commission_basis": creator.get("commission_basis"),
            "collaboration_status": creator.get("status"),
            "start_date": creator.get("start_date"),
            "end_date": creator.get("end_date"),
            "commission": {
                "total_earned": round(total_commission_earned, 2),
                "pending_verification": round(comm_pending, 2),
                "approved_unpaid": round(comm_payable, 2),
                "already_paid": round(comm_paid, 2),
                "reversed": round(comm_reversed, 2),
            },
            "order_breakdown": status_counts,
            "creator": {
                "name": creator.get("name"),
                "referral_code": creator.get("referral_code"),
                "commission_rate": creator.get("commission_rate"),
                "customer_discount_rate": creator.get("customer_discount_rate", 0.0),
                "commission_basis": creator.get("commission_basis"),
                "status": creator.get("status"),
                "start_date": creator.get("start_date"),
                "end_date": creator.get("end_date"),
                "approved_products_count": len(creator.get("approved_products") or []),
            },
            "metrics": {
                "total_clicks": total_clicks,
                "unique_visitors": unique_visitors,
                "total_attributed_orders": total_attributed_orders,
                "total_eligible_sales_value": round(eligible_sales_value, 2),
                "eligible_successful_orders": eligible_successful_orders,
                "conversion_rate": conv_rate,
                "eligible_sales_value": round(eligible_sales_value, 2),
                "total_commission_earned": round(total_commission_earned, 2),
                "commission_pending": round(comm_pending, 2),
                "commission_approved": round(comm_approved, 2),
                "commission_payable": round(comm_payable, 2),
                "commission_paid": round(comm_paid, 2),
                "commission_reversed": round(comm_reversed, 2),
            },
            "status_breakdown": status_counts,
            "recent_orders": sanitized_orders,
        }

    # ── Admin Reports & List ────────────────────────────────────────────────

    def get_admin_collaborations_list(self) -> List[Dict[str, Any]]:
        """Get summary list of all collaborations for Admin Panel."""
        creators = list(self.creators.find({}).sort("created_at", -1))
        results = []
        for c in creators:
            cid = str(c["_id"])
            clicks_count = self.clicks.count_documents({"creator_id": cid})
            unique_clicks = self.clicks.count_documents({"creator_id": cid, "is_unique_24h": True})
            orders_count = self.attributions.count_documents({"creator_id": cid})

            # Calculate sales and commission
            attr_docs = list(self.attributions.find({"creator_id": cid}))
            active_sales = sum(float(a.get("commission_base_amount") or 0) for a in attr_docs if a.get("order_status") not in ("cancelled", "returned", "refunded"))
            earned_comm = sum(float(a.get("commission_amount") or 0) for a in attr_docs if a.get("order_status") not in ("cancelled", "returned", "refunded"))

            payouts = list(self.payouts.find({"creator_id": cid}))
            paid_comm = sum(float(p.get("amount") or 0) for p in payouts)

            results.append({
                "id": cid,
                "name": c.get("name"),
                "email": c.get("email"),
                "phone": c.get("phone"),
                "instagram_handle": c.get("instagram_handle"),
                "referral_code": c.get("referral_code"),
                "commission_rate": c.get("commission_rate"),
                "customer_discount_rate": c.get("customer_discount_rate", 0.0),
                "commission_basis": c.get("commission_basis"),
                "status": c.get("status"),
                "start_date": c.get("start_date"),
                "end_date": c.get("end_date"),
                "created_at": c.get("created_at"),
                "clicks": clicks_count,
                "unique_visitors": unique_clicks,
                "attributed_orders": orders_count,
                "eligible_sales": round(active_sales, 2),
                "commission_earned": round(earned_comm, 2),
                "commission_paid": round(paid_comm, 2),
                "outstanding_liability": max(0.0, round(earned_comm - paid_comm, 2)),
            })
        return results

    def get_admin_collaboration_detail(self, creator_id: str) -> Dict[str, Any]:
        """Detailed creator record including clicks, orders, customer info, and ledger."""
        creator = self.creators.find_one({"_id": ObjectId(creator_id)})
        if not creator:
            raise ValueError("Creator not found.")

        cid = str(creator["_id"])
        attributions = list(self.attributions.find({"creator_id": cid}).sort("created_at", -1))
        ledger = list(self.ledger.find({"creator_id": cid}).sort("created_at", -1))
        payouts = list(self.payouts.find({"creator_id": cid}).sort("created_at", -1))
        audits = list(self.audit_logs.find({"creator_id": cid}).sort("created_at", -1))

        # Format and enrich with order customer details
        for a in attributions:
            a["_id"] = str(a["_id"])
            try:
                oid = a.get("order_id")
                q = {"$or": [{"_id": ObjectId(oid) if ObjectId.is_valid(oid) else oid}, {"_id": oid}]}
                order_doc = self.orders.find_one(q)
                if order_doc:
                    shipping = order_doc.get("shipping_address") or {}
                    a["customer_name"] = shipping.get("full_name") or order_doc.get("customer_name") or "Customer"
                    a["customer_phone"] = shipping.get("phone") or order_doc.get("customer_phone") or "—"
                    a["customer_email"] = shipping.get("email") or order_doc.get("customer_email") or "—"
                    a["customer_city"] = shipping.get("city") or shipping.get("state") or "—"
                    a["order_total"] = float(order_doc.get("total_amount") or a.get("order_total") or 0.0)
                    a["items"] = [
                        {
                            "name": it.get("product_name") or it.get("name") or "Product",
                            "qty": it.get("quantity", 1),
                            "price": it.get("price", 0),
                        }
                        for it in order_doc.get("items", [])
                    ]
            except Exception:
                pass

        for l in ledger:
            l["_id"] = str(l["_id"])
        for p in payouts:
            p["_id"] = str(p["_id"])
        for u in audits:
            u["_id"] = str(u["_id"])

        creator["_id"] = cid
        if "token_hash" in creator:
            del creator["token_hash"]

        earned_comm = sum(float(a.get("commission_amount") or 0) for a in attributions if a.get("order_status") not in ("cancelled", "returned", "refunded"))
        paid_comm = sum(float(p.get("amount") or 0) for p in payouts)
        summary = {
            "total_clicks": self.clicks.count_documents({"creator_id": cid}),
            "unique_visitors": self.clicks.count_documents({"creator_id": cid, "is_unique_24h": True}),
            "attributed_orders": len(attributions),
            "commission_earned": round(earned_comm, 2),
            "commission_paid": round(paid_comm, 2),
            "outstanding_liability": max(0.0, round(earned_comm - paid_comm, 2)),
        }

        return {
            "creator": creator,
            "summary": summary,
            "orders": attributions,
            "attributions": attributions,
            "ledger": ledger,
            "payouts": payouts,
            "audit_logs": audits,
        }

    def _audit_log(self, creator_id: str, action: str, changed_by: str, details: Dict[str, Any]):
        """Logs administrative adjustments to collab_audit_logs."""
        try:
            self.audit_logs.insert_one({
                "creator_id": creator_id,
                "action": action,
                "changed_by": changed_by,
                "details": details,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception as e:
            print(f"[CollaborationService] Audit log error: {e}")
