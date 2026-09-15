"""
Reward Coin Service (Nari Pehnawa Coins):
- Rate: 10 Coins = 1 INR (0.10 INR per coin)
- Earning: 100 Coins per regular product item, 50 Coins per sale/discounted product item
- Max Redemption: Up to 50% of the order subtotal
- Audit Trail: Logged in `coin_transactions` collection
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId


COINS_PER_RUPEE = 10  # 10 Coins = ₹1
COINS_STANDARD_ITEM = 100  # 100 Coins for regular item
COINS_SALE_ITEM = 50       # 50 Coins for sale/discounted item
MAX_REDEEM_PERCENT = 50    # Max 50% discount from coins


class RewardCoinService:
    def __init__(self, db):
        self.db = db
        self.users = db["users"]
        self.orders = db["orders"]
        self.transactions = db["coin_transactions"]

    def get_user_wallet(self, user_id: str) -> Dict[str, Any]:
        """Fetch user's coin balance, total earned, total spent, and recent history."""
        user = None
        if ObjectId.is_valid(user_id):
            user = self.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            user = self.users.find_one({"_id": user_id}) or self.users.find_one({"id": user_id})

        balance = user.get("coins_balance", 0) if user else 0
        earned_total = user.get("coins_earned_total", 0) if user else 0
        spent_total = user.get("coins_spent_total", 0) if user else 0

        # Fetch transactions
        cursor = self.transactions.find(
            {"$or": [{"user_id": str(user_id)}, {"user_id": user_id}]}
        ).sort("created_at", -1).limit(50)

        tx_list = []
        for tx in cursor:
            tx_list.append({
                "id": str(tx["_id"]),
                "type": tx.get("type", "credit"),
                "coins": tx.get("coins", 0),
                "rupee_value": tx.get("rupee_value", 0.0),
                "balance_after": tx.get("balance_after", 0),
                "description": tx.get("description", ""),
                "order_id": tx.get("order_id"),
                "order_number": tx.get("order_number"),
                "created_at": tx.get("created_at")
            })

        return {
            "coins_balance": balance,
            "rupee_value": round(balance / COINS_PER_RUPEE, 2),
            "coins_earned_total": earned_total,
            "coins_spent_total": spent_total,
            "rate_per_rupee": COINS_PER_RUPEE,
            "max_redeem_percent": MAX_REDEEM_PERCENT,
            "transactions": tx_list
        }

    def calculate_item_coins(self, item: Dict[str, Any]) -> int:
        """Calculate coins to award for a single cart/order item."""
        qty = int(item.get("quantity", 1) or 1)
        is_on_sale = (
            bool(item.get("on_sale")) or
            bool(item.get("discount") and int(item.get("discount")) > 0) or
            bool(item.get("is_sale"))
        )
        coins_per_unit = COINS_SALE_ITEM if is_on_sale else COINS_STANDARD_ITEM
        return coins_per_unit * qty

    def calculate_order_potential_coins(self, items: List[Dict[str, Any]]) -> int:
        """Calculate total coins an order will grant upon completion."""
        total_coins = 0
        for it in items:
            total_coins += self.calculate_item_coins(it)
        return total_coins

    def validate_redemption(
        self, user_id: str, coins_to_use: int, subtotal: float
    ) -> Dict[str, Any]:
        """
        Validate how many coins can be used for a given order subtotal.
        Returns validated coins_to_use, discount_amount, and remaining balance.
        """
        wallet = self.get_user_wallet(user_id)
        current_balance = wallet["coins_balance"]

        if coins_to_use <= 0 or current_balance <= 0 or subtotal <= 0:
            return {
                "valid": True,
                "coins_used": 0,
                "discount_amount": 0.0,
                "max_allowed_coins": 0,
                "max_discount_amount": 0.0,
                "remaining_balance": current_balance
            }

        # Max allowed discount is 50% of subtotal
        max_discount_rupees = round(subtotal * (MAX_REDEEM_PERCENT / 100.0), 2)
        max_allowed_coins = int(max_discount_rupees * COINS_PER_RUPEE)

        # Usable coins cannot exceed current balance or max allowed cap
        actual_coins_to_use = min(coins_to_use, current_balance, max_allowed_coins)
        discount_amount = round(actual_coins_to_use / COINS_PER_RUPEE, 2)

        return {
            "valid": True,
            "coins_used": actual_coins_to_use,
            "discount_amount": discount_amount,
            "max_allowed_coins": min(current_balance, max_allowed_coins),
            "max_discount_amount": min(round(current_balance / COINS_PER_RUPEE, 2), max_discount_rupees),
            "remaining_balance": current_balance - actual_coins_to_use
        }

    def process_order_placement(
        self, user_id: Optional[str], order_id: str, order_number: str,
        items: List[Dict[str, Any]], coins_to_redeem: int, subtotal: float
    ) -> Dict[str, Any]:
        """
        Deduct redeemed coins (if any) and credit earned coins on order placement.
        """
        if not user_id:
            return {"coins_used": 0, "coin_discount": 0.0, "coins_earned": 0}

        user_query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user = self.users.find_one(user_query)
        if not user:
            user = self.users.find_one({"id": user_id})
            if not user:
                return {"coins_used": 0, "coin_discount": 0.0, "coins_earned": 0}

        user_actual_id = str(user["_id"])
        current_balance = int(user.get("coins_balance", 0))

        # 1. Handle Coin Redemption (Debit)
        actual_coins_used = 0
        discount_amount = 0.0
        if coins_to_redeem > 0 and current_balance > 0:
            redemption = self.validate_redemption(user_actual_id, coins_to_redeem, subtotal)
            actual_coins_used = redemption["coins_used"]
            discount_amount = redemption["discount_amount"]

            if actual_coins_used > 0:
                new_balance = current_balance - actual_coins_used
                self.users.update_one(
                    {"_id": user["_id"]},
                    {
                        "$set": {"coins_balance": new_balance},
                        "$inc": {"coins_spent_total": actual_coins_used}
                    }
                )
                self.transactions.insert_one({
                    "user_id": user_actual_id,
                    "order_id": str(order_id),
                    "order_number": order_number,
                    "type": "debit",
                    "coins": -actual_coins_used,
                    "rupee_value": discount_amount,
                    "balance_after": new_balance,
                    "description": f"Redeemed {actual_coins_used} Coins (₹{discount_amount:.2f} off) on Order #{order_number}",
                    "created_at": datetime.now()
                })
                current_balance = new_balance

        # 2. Handle Coin Reward (Credit)
        coins_earned = self.calculate_order_potential_coins(items)
        if coins_earned > 0:
            new_balance = current_balance + coins_earned
            self.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {"coins_balance": new_balance},
                    "$inc": {"coins_earned_total": coins_earned}
                }
            )
            self.transactions.insert_one({
                "user_id": user_actual_id,
                "order_id": str(order_id),
                "order_number": order_number,
                "type": "credit",
                "coins": coins_earned,
                "rupee_value": round(coins_earned / COINS_PER_RUPEE, 2),
                "balance_after": new_balance,
                "description": f"Earned {coins_earned} Reward Coins on Order #{order_number}",
                "created_at": datetime.now()
            })

        return {
            "coins_used": actual_coins_used,
            "coin_discount": discount_amount,
            "coins_earned": coins_earned
        }

    def process_order_cancellation(
        self, user_id: Optional[str], order_id: str, order_number: str,
        coins_used: int, coins_earned: int, action_type: str = "cancelled"
    ) -> None:
        """Reverse coin transactions when an order is cancelled or returned."""
        if not user_id:
            return

        # Idempotency guard: avoid double reversing coins for the same order
        already_reversed = self.transactions.find_one({
            "order_id": str(order_id),
            "type": {"$in": ["reversal", "refund"]}
        })
        if already_reversed:
            return

        user_query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user = self.users.find_one(user_query) or self.users.find_one({"id": user_id})
        if not user:
            return

        user_actual_id = str(user["_id"])
        current_balance = int(user.get("coins_balance", 0))

        # Refund spent coins if any were used
        if coins_used > 0:
            new_balance = current_balance + coins_used
            self.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {"coins_balance": new_balance},
                    "$inc": {"coins_spent_total": -coins_used}
                }
            )
            self.transactions.insert_one({
                "user_id": user_actual_id,
                "order_id": str(order_id),
                "order_number": order_number,
                "type": "refund",
                "coins": coins_used,
                "rupee_value": round(coins_used / COINS_PER_RUPEE, 2),
                "balance_after": new_balance,
                "description": f"Refunded {coins_used} Coins from {action_type} Order #{order_number}",
                "created_at": datetime.now()
            })
            current_balance = new_balance

        # Reverse earned coins (deduct 100/50 coins per item awarded on purchase)
        if coins_earned > 0:
            new_balance = max(0, current_balance - coins_earned)
            self.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {"coins_balance": new_balance},
                    "$inc": {"coins_earned_total": -coins_earned}
                }
            )
            self.transactions.insert_one({
                "user_id": user_actual_id,
                "order_id": str(order_id),
                "order_number": order_number,
                "type": "reversal",
                "coins": -coins_earned,
                "rupee_value": round(coins_earned / COINS_PER_RUPEE, 2),
                "balance_after": new_balance,
                "description": f"Deducted {coins_earned} Coins from {action_type} Order #{order_number}",
                "created_at": datetime.now()
            })

    def admin_adjust_coins(
        self, user_id: str, amount: int, reason: str, admin_email: str
    ) -> Dict[str, Any]:
        """Admin manual credit/debit adjustment."""
        user_query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user = self.users.find_one(user_query) or self.users.find_one({"id": user_id})
        if not user:
            raise ValueError("User not found")

        current_balance = int(user.get("coins_balance", 0))
        new_balance = max(0, current_balance + amount)
        actual_delta = new_balance - current_balance

        update_ops: Dict[str, Any] = {"$set": {"coins_balance": new_balance}}
        if actual_delta > 0:
            update_ops["$inc"] = {"coins_earned_total": actual_delta}
        elif actual_delta < 0:
            update_ops["$inc"] = {"coins_spent_total": abs(actual_delta)}

        self.users.update_one({"_id": user["_id"]}, update_ops)

        self.transactions.insert_one({
            "user_id": str(user["_id"]),
            "type": "admin_adjust",
            "coins": actual_delta,
            "rupee_value": round(abs(actual_delta) / COINS_PER_RUPEE, 2),
            "balance_after": new_balance,
            "description": f"Admin Adjustment ({admin_email}): {reason}",
            "created_at": datetime.now()
        })

        return {
            "user_id": str(user["_id"]),
            "coins_delta": actual_delta,
            "new_balance": new_balance,
            "rupee_value": round(new_balance / COINS_PER_RUPEE, 2)
        }
