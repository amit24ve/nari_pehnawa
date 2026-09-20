from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.database import get_database
from app.security import get_current_user
from app.services.referral_service import REWARD_COINS, code_for, claim, ensure_indexes, settle_due

router = APIRouter(prefix="/referrals", tags=["Referrals"])


class ClaimRequest(BaseModel):
    code: str = Field(min_length=4, max_length=24)


@router.get("/me")
def my_referrals(current_user: dict = Depends(get_current_user)):
    db = get_database()
    ensure_indexes(db)
    user_id = str(current_user["id"])
    # This also settles due rewards when a user revisits the app.
    settle_due(db)
    code = code_for(db, user_id)
    rows = list(db.referrals.find({"referrer_user_id": user_id}, {"status": 1, "created_at": 1}))
    own = db.referrals.find_one({"referred_user_id": user_id}, {"status": 1})
    return {
        "code": code, "reward_coins": REWARD_COINS,
        "pending": sum(r["status"] == "pending" for r in rows),
        "credited": sum(r["status"] == "credited" for r in rows),
        "ineligible": sum(r["status"] in ("ineligible", "reversed") for r in rows),
        "my_claimed_code": bool(own),
    }


@router.post("/claim")
def claim_referral(payload: ClaimRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    ensure_indexes(db)
    try:
        claim(db, str(current_user["id"]), payload.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"status": "pending", "message": "Referral linked to your account"}
