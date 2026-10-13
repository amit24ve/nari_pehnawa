"""
CouponService — real, server-side coupon validation.

Replaces the entirely client-side, hardcoded `COUPON_CODES` object that
previously lived in client/src/components/Cart.jsx. The frontend must now
call POST /coupons/validate to get a trustworthy discount amount instead of
computing it itself — never trust a discount value sent by the client.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pymongo.database import Database

from app.database.schemas.coupon import CouponType


class CouponService:
    def __init__(self, db: Database):
        self.db = db
        self.coupons = db["coupons"]
        self.orders = db["orders"]

    def validate(
        self, code: str, subtotal: float, user_id: Optional[str] = None
    ) -> dict:
        """
        Returns a dict:
            {valid, code, type, discount_amount, free_shipping, message}

        Checks (in order): coupon exists & active, within valid date window,
        subtotal meets min_order_value, global usage_limit not exceeded,
        per-user usage_limit_per_user not exceeded (requires user_id).
        Also supports active Influencer collaboration follower discount codes.
        """
        code_norm = code.strip().upper()
        coupon = self.coupons.find_one({"code": code_norm})

        if not coupon:
            # Check if this code belongs to an active Influencer Collaboration with follower discount
            try:
                collab = self.db["collab_creators"].find_one({"referral_code": code_norm, "status": "active"})
                if collab:
                    disc_rate = float(collab.get("customer_discount_rate") or 0.0)
                    if disc_rate > 0:
                        disc_amt = round((subtotal * disc_rate) / 100.0, 2)
                        creator_name = collab.get("name", "Influencer")
                        return {
                            "valid": True,
                            "code": code_norm,
                            "type": "percent",
                            "value": disc_rate,
                            "discount_amount": disc_amt,
                            "free_shipping": False,
                            "message": f"Special {disc_rate}% OFF applied via {creator_name}'s referral!",
                            "collab_ref": code_norm,
                        }
            except Exception as e:
                print(f"[CouponService] Collab coupon check note: {e}")

            return self._invalid(code_norm, "Invalid coupon code.")

        if not coupon.get("is_active", True):
            return self._invalid(code_norm, "This coupon is no longer active.")

        now = datetime.now()
        valid_from = coupon.get("valid_from")
        valid_until = coupon.get("valid_until")
        if valid_from and now < valid_from:
            return self._invalid(code_norm, "This coupon is not active yet.")
        if valid_until and now > valid_until:
            return self._invalid(code_norm, "This coupon has expired.")

        min_order_value = float(coupon.get("min_order_value", 0))
        if subtotal < min_order_value:
            return self._invalid(
                code_norm,
                f"Minimum order value of \u20b9{min_order_value:,.0f} required for this coupon.",
            )

        usage_limit = coupon.get("usage_limit")
        times_used = int(coupon.get("times_used", 0))
        if usage_limit is not None and times_used >= usage_limit:
            return self._invalid(code_norm, "This coupon has reached its usage limit.")

        usage_limit_per_user = coupon.get("usage_limit_per_user")
        if usage_limit_per_user is not None and user_id:
            user_uses = self.orders.count_documents(
                {"user_id": user_id, "coupon_code": code_norm}
            )
            if user_uses >= usage_limit_per_user:
                return self._invalid(
                    code_norm, "You have already used this coupon the maximum number of times."
                )

        coupon_type = coupon.get("type")
        value = float(coupon.get("value", 0))
        max_discount = coupon.get("max_discount")

        discount_amount = 0.0
        free_shipping = False

        if coupon_type == CouponType.PERCENT.value:
            discount_amount = round(subtotal * value / 100, 2)
            if max_discount is not None:
                discount_amount = min(discount_amount, float(max_discount))
        elif coupon_type == CouponType.FLAT.value:
            discount_amount = min(value, subtotal)
        elif coupon_type == CouponType.FREE_SHIPPING.value:
            free_shipping = True
        else:
            return self._invalid(code_norm, "Unsupported coupon type.")

        return {
            "valid": True,
            "code": code_norm,
            "type": coupon_type,
            "discount_amount": discount_amount,
            "free_shipping": free_shipping,
            "message": coupon.get("description") or "Coupon applied successfully!",
        }

    def _invalid(self, code: str, message: str) -> dict:
        return {
            "valid": False,
            "code": code,
            "type": None,
            "discount_amount": 0.0,
            "free_shipping": False,
            "message": message,
        }

    def record_usage(self, code: str) -> None:
        """Called once an order using this coupon is actually placed
        (not on validate — validate can be called many times without
        consuming the coupon)."""
        self.coupons.update_one(
            {"code": code.strip().upper()}, {"$inc": {"times_used": 1}}
        )


def get_coupon_service(db: Database) -> CouponService:
    return CouponService(db)
