"""Referral attribution and delayed, idempotent coin settlement."""

from datetime import datetime, timedelta
import logging
import secrets
import string

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

REWARD_COINS = 500
HOLD_DAYS = 7
CODE_ALPHABET = string.ascii_uppercase + string.digits


def ensure_indexes(db):
    db.users.create_index("referral_code", unique=True, partialFilterExpression={"referral_code": {"$type": "string"}})
    db.referrals.create_index("referred_user_id", unique=True)
    db.coin_transactions.create_index("referral_id", unique=True, sparse=True)
    db.coin_transactions.create_index("referral_reversal_id", unique=True, sparse=True)


def code_for(db, user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError("Account not found")
    if user.get("referral_code"):
        return user["referral_code"]
    for _ in range(8):
        code = "NP" + "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))
        try:
            updated = db.users.find_one_and_update(
                {"_id": user["_id"], "referral_code": {"$exists": False}},
                {"$set": {"referral_code": code}},
                return_document=ReturnDocument.AFTER,
            )
            if updated:
                return code
            return db.users.find_one({"_id": user["_id"]})["referral_code"]
        except DuplicateKeyError:
            continue
    raise RuntimeError("Could not allocate referral code")


def claim(db, user_id, code):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role", "customer") != "customer":
        raise ValueError("Customer account required")
    created = user.get("created_at")
    if not isinstance(created, datetime) or datetime.utcnow() - created > timedelta(days=7):
        raise ValueError("Referral code can only be added within 7 days of signup")
    if db.orders.find_one({"user_id": user_id}, {"_id": 1}) or user.get("orders_count", 0):
        raise ValueError("Referral code must be added before your first order")
    referrer = db.users.find_one({"referral_code": code.strip().upper()})
    if not referrer or referrer["_id"] == user["_id"] or referrer.get("role", "customer") != "customer":
        raise ValueError("Invalid referral code")
    try:
        db.referrals.insert_one({
            "referrer_user_id": str(referrer["_id"]),
            "referred_user_id": user_id,
            "status": "pending",
            "created_at": datetime.utcnow(),
        })
    except DuplicateKeyError:
        raise ValueError("A referral is already linked to this account")


def _delivery_date(db, order):
    order_id = str(order["_id"])
    log = db.order_logs.find_one(
        {"order_id": order_id, "to_status": {"$in": ["delivered", "completed"]}},
        sort=[("created_at", 1)],
    )
    if log and isinstance(log.get("created_at"), datetime):
        return log["created_at"]
    shipping = order.get("shipping") or {}
    raw = shipping.get("delivered_date") or order.get("delivered_at")
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"):
                try:
                    return datetime.strptime(raw, fmt)
                except ValueError:
                    continue
    return None


def settle_one(db, referral, now=None):
    now = now or datetime.utcnow()
    first = db.orders.find_one(
        {"user_id": referral["referred_user_id"]},
        sort=[("created_at", 1), ("_id", 1)],
    )
    if not first:
        return "pending"
    status = str(first.get("status") or "").lower()
    if status in ("cancelled", "returned", "refunded"):
        db.referrals.update_one({"_id": referral["_id"], "status": "pending"}, {"$set": {"status": "ineligible", "reason": "First order was cancelled or returned"}})
        return "ineligible"
    order_id = str(first["_id"])
    cancellation = db.cancellations.find_one({"order_id": order_id, "status": {"$nin": ["rejected", "closed"]}})
    returned = db.returns.find_one({"order_id": order_id, "status": {"$nin": ["rejected"]}})
    exchanged = db.exchanges.find_one({"order_id": order_id, "status": {"$nin": ["rejected"]}})
    if cancellation or returned or exchanged:
        db.referrals.update_one({"_id": referral["_id"], "status": "pending"}, {"$set": {"status": "ineligible", "reason": "First order was cancelled, returned or exchanged"}})
        return "ineligible"
    if status not in ("delivered", "completed"):
        return "pending"
    delivered = _delivery_date(db, first)
    if not delivered or now < delivered + timedelta(days=HOLD_DAYS):
        return "pending"
    # A transaction keeps the balance, ledger and referral state in sync.
    with db.client.start_session() as session:
        with session.start_transaction():
            pending = db.referrals.find_one({"_id": referral["_id"], "status": "pending"}, session=session)
            if not pending or db.coin_transactions.find_one({"referral_id": str(referral["_id"])}, session=session):
                return "credited"
            balance_user = db.users.find_one_and_update(
                {"_id": ObjectId(referral["referrer_user_id"])},
                {"$inc": {"coins_balance": REWARD_COINS, "coins_earned_total": REWARD_COINS}},
                return_document=ReturnDocument.AFTER, session=session,
            )
            if not balance_user:
                raise RuntimeError("Referrer account missing")
            db.coin_transactions.insert_one({
                "user_id": referral["referrer_user_id"], "referral_id": str(referral["_id"]),
                "order_id": order_id, "type": "referral_credit", "coins": REWARD_COINS,
                "rupee_value": 50, "balance_after": balance_user.get("coins_balance", 0),
                "description": "Referral reward: first order completed", "created_at": now,
            }, session=session)
            db.referrals.update_one({"_id": referral["_id"], "status": "pending"}, {
                "$set": {"status": "credited", "first_order_id": order_id, "credited_at": now}
            }, session=session)
    return "credited"


def settle_due(db, limit=None):
    count = 0
    cursor = db.referrals.find({"status": "pending"}).sort("created_at", 1)
    if limit:
        cursor = cursor.limit(limit)
    for referral in cursor:
        settle_one(db, referral)
        count += 1
    return count


def reverse_for_order(db, order_id):
    referral = db.referrals.find_one({"first_order_id": str(order_id), "status": "credited"})
    if not referral:
        return False
    with db.client.start_session() as session:
        with session.start_transaction():
            current = db.referrals.find_one({"_id": referral["_id"], "status": "credited"}, session=session)
            if not current:
                return False
            balance_user = db.users.find_one_and_update(
                {"_id": ObjectId(referral["referrer_user_id"])},
                {"$inc": {"coins_balance": -REWARD_COINS, "coins_earned_total": -REWARD_COINS}},
                return_document=ReturnDocument.AFTER, session=session,
            )
            if not balance_user:
                raise RuntimeError("Referrer account missing")
            db.coin_transactions.insert_one({
                "user_id": referral["referrer_user_id"], "referral_reversal_id": str(referral["_id"]),
                "order_id": str(order_id), "type": "referral_reversal", "coins": -REWARD_COINS,
                "rupee_value": -50, "balance_after": balance_user.get("coins_balance", 0),
                "description": "Referral reward reversed: first order returned or cancelled",
                "created_at": datetime.utcnow(),
            }, session=session)
            db.referrals.update_one({"_id": referral["_id"], "status": "credited"}, {
                "$set": {"status": "reversed", "reversed_at": datetime.utcnow()}
            }, session=session)
    return True


def try_reverse_for_order(db, order_id):
    try:
        return reverse_for_order(db, order_id)
    except Exception:
        logging.exception("Referral reversal failed for order %s; background reconciliation will retry", order_id)
        return False


def reconcile_reversals(db):
    for referral in db.referrals.find({"status": "credited"}, {"first_order_id": 1}):
        order_id = referral.get("first_order_id")
        if not order_id:
            continue
        order = db.orders.find_one({"_id": ObjectId(order_id)}, {"status": 1})
        invalid = order and str(order.get("status") or "").lower() in ("cancelled", "returned", "refunded")
        invalid = invalid or db.returns.find_one({"order_id": order_id}, {"_id": 1})
        invalid = invalid or db.exchanges.find_one({"order_id": order_id}, {"_id": 1})
        if invalid:
            try_reverse_for_order(db, order_id)
