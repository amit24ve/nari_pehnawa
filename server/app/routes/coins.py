from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_database
from app.security import get_current_user, require_admin
from app.services.reward_coin_service import (
    RewardCoinService,
    COINS_PER_RUPEE,
    COINS_STANDARD_ITEM,
    COINS_SALE_ITEM,
    MAX_REDEEM_PERCENT
)

router = APIRouter(prefix="/coins", tags=["Reward Coins"])


class CoinQuoteRequest(BaseModel):
    subtotal: float
    coins_to_use: int = 0


class AdminAdjustRequest(BaseModel):
    user_id: str
    amount: int  # Positive to add, negative to deduct
    reason: str = "Admin manual adjustment"


@router.get("/rules")
def get_coin_rules():
    """Get active reward coin rules and conversion rates."""
    return {
        "coins_per_rupee": COINS_PER_RUPEE,
        "rupees_per_coin": round(1 / COINS_PER_RUPEE, 2),
        "standard_item_coins": COINS_STANDARD_ITEM,
        "sale_item_coins": COINS_SALE_ITEM,
        "max_redeem_percent": MAX_REDEEM_PERCENT,
        "summary": f"Earn {COINS_STANDARD_ITEM} coins on regular items ({COINS_SALE_ITEM} on sale items). 10 Coins = ₹1. Use up to {MAX_REDEEM_PERCENT}% of order value."
    }


@router.get("/wallet")
def get_my_wallet(current_user: dict = Depends(get_current_user)):
    """Get authenticated user's coin wallet, balance, and transaction history."""
    db = get_database()
    service = RewardCoinService(db)
    return service.get_user_wallet(current_user.get("id"))


@router.post("/quote")
def quote_coin_discount(payload: CoinQuoteRequest, current_user: dict = Depends(get_current_user)):
    """Calculate and validate coin discount for checkout."""
    db = get_database()
    service = RewardCoinService(db)
    return service.validate_redemption(
        user_id=current_user.get("id"),
        coins_to_use=payload.coins_to_use,
        subtotal=payload.subtotal
    )


# ── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────


@router.get("/admin/summary")
def get_admin_coin_summary(current_user: dict = Depends(require_admin)):
    """Summary of coins in circulation and liability for admin."""
    db = get_database()
    users = list(db["users"].find({}, {"coins_balance": 1, "coins_earned_total": 1, "coins_spent_total": 1}))
    total_balance = sum(u.get("coins_balance", 0) or 0 for u in users)
    total_earned = sum(u.get("coins_earned_total", 0) or 0 for u in users)
    total_spent = sum(u.get("coins_spent_total", 0) or 0 for u in users)
    
    return {
        "total_active_coins": total_balance,
        "total_liability_inr": round(total_balance / COINS_PER_RUPEE, 2),
        "total_coins_ever_earned": total_earned,
        "total_coins_ever_spent": total_spent,
        "total_discount_given_inr": round(total_spent / COINS_PER_RUPEE, 2),
        "coins_per_rupee": COINS_PER_RUPEE,
        "max_redeem_percent": MAX_REDEEM_PERCENT
    }


@router.get("/admin/user/{user_id}")
def get_user_coins_admin(user_id: str, current_user: dict = Depends(require_admin)):
    """Get specific user's coin wallet details and history (Admin only)."""
    db = get_database()
    service = RewardCoinService(db)
    return service.get_user_wallet(user_id)


@router.post("/admin/adjust")
def admin_adjust_coins(payload: AdminAdjustRequest, current_user: dict = Depends(require_admin)):
    """Credit or debit coins for a user (Admin only)."""
    db = get_database()
    service = RewardCoinService(db)
    try:
        res = service.admin_adjust_coins(
            user_id=payload.user_id,
            amount=payload.amount,
            reason=payload.reason,
            admin_email=current_user.get("email", "admin")
        )
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
