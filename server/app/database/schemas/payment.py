from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RazorpayOrderCreate(BaseModel):
    amount: float  # in INR
    currency: str = "INR"
    notes: Optional[dict] = None


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_data: dict  # full order payload to store after verification


class Payment(BaseModel):
    id: str = Field(alias="_id")
    order_id: Optional[str] = None
    order_number: Optional[str] = None
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    amount: float
    currency: str = "INR"
    # created | captured | failed | refunded | cod_pending | cod_completed
    status: str = "created"
    payment_method: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
