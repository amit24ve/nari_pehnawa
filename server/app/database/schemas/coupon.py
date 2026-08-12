from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CouponType(str, Enum):
    PERCENT = "percent"
    FLAT = "flat"
    FREE_SHIPPING = "free_shipping"


class CouponBase(BaseModel):
    code: str
    type: CouponType
    value: float = 0.0  # percent (0-100) or flat rupee amount; ignored for free_shipping
    description: Optional[str] = None
    min_order_value: float = 0.0
    max_discount: Optional[float] = None  # caps % discounts
    usage_limit: Optional[int] = None  # total redemptions allowed, None = unlimited
    usage_limit_per_user: Optional[int] = 1
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    type: Optional[CouponType] = None
    value: Optional[float] = None
    description: Optional[str] = None
    min_order_value: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_limit_per_user: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class Coupon(CouponBase):
    id: str = Field(alias="_id")
    times_used: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    type: Optional[CouponType] = None
    discount_amount: float = 0.0
    free_shipping: bool = False
    message: str
