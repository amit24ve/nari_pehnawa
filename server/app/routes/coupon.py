from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.database.schemas.coupon import (
    Coupon,
    CouponCreate,
    CouponUpdate,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.security import get_current_user, require_admin
from app.services.coupon_service import CouponService

router = APIRouter(prefix="/coupons", tags=["Coupons"])


# ── Customer: validate a coupon at checkout ──────────────────────────────────


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(
    payload: CouponValidateRequest, current_user: dict = Depends(get_current_user)
):
    """
    Server-side coupon validation (replaces the old client-only fake
    discount codes). Called from the cart/checkout page whenever the
    customer applies a code — the returned discount_amount is the only
    number the frontend should trust and display.
    """
    db = get_database()
    service = CouponService(db)
    result = service.validate(
        payload.code, payload.subtotal, user_id=current_user.get("id")
    )
    return result


# ── Admin: coupon CRUD ────────────────────────────────────────────────────────


@router.post("/", response_model=Coupon, status_code=201)
def create_coupon(coupon: CouponCreate, current_user: dict = Depends(require_admin)):
    """Create a new coupon (Admin only)."""
    db = get_database()
    coupons_collection = db["coupons"]

    code_norm = coupon.code.strip().upper()
    if coupons_collection.find_one({"code": code_norm}):
        raise HTTPException(status_code=400, detail="A coupon with this code already exists")

    try:
        from datetime import datetime

        coupon_data = coupon.model_dump()
        coupon_data["code"] = code_norm
        coupon_data["times_used"] = 0
        coupon_data["created_at"] = datetime.now()
        coupon_data["updated_at"] = datetime.now()
        result = coupons_collection.insert_one(coupon_data)
        coupon_data["_id"] = str(result.inserted_id)
        return coupon_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Coupon])
def get_coupons(
    is_active: Optional[bool] = None, current_user: dict = Depends(require_admin)
):
    """List all coupons (Admin only)."""
    db = get_database()
    coupons_collection = db["coupons"]
    try:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        coupons = list(coupons_collection.find(query).sort("created_at", -1))
        for c in coupons:
            c["_id"] = str(c["_id"])
        return coupons
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{coupon_id}", response_model=Coupon)
def get_coupon(coupon_id: str, current_user: dict = Depends(require_admin)):
    """Get a single coupon by ID (Admin only)."""
    db = get_database()
    coupons_collection = db["coupons"]
    try:
        coupon = coupons_collection.find_one({"_id": ObjectId(coupon_id)})
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        coupon["_id"] = str(coupon["_id"])
        return coupon
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{coupon_id}", response_model=Coupon)
def update_coupon(
    coupon_id: str, coupon: CouponUpdate, current_user: dict = Depends(require_admin)
):
    """Update a coupon (Admin only)."""
    db = get_database()
    coupons_collection = db["coupons"]
    try:
        from datetime import datetime

        update_data = {k: v for k, v in coupon.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        update_data["updated_at"] = datetime.now()

        result = coupons_collection.find_one_and_update(
            {"_id": ObjectId(coupon_id)},
            {"$set": update_data},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=404, detail="Coupon not found")
        result["_id"] = str(result["_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{coupon_id}")
def delete_coupon(coupon_id: str, current_user: dict = Depends(require_admin)):
    """Delete a coupon (Admin only)."""
    db = get_database()
    coupons_collection = db["coupons"]
    try:
        result = coupons_collection.delete_one({"_id": ObjectId(coupon_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Coupon not found")
        return {"message": "Coupon deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
