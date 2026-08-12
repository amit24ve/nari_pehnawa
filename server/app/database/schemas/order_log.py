from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OrderLog(BaseModel):
    """Immutable audit trail entry for a single order status transition."""

    id: str = Field(alias="_id")
    order_id: str
    from_status: Optional[str] = None
    to_status: str
    changed_by: Optional[str] = None  # user_id of admin/customer, or "system"
    changed_by_role: Optional[str] = None  # admin | customer | system
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


class InventoryLog(BaseModel):
    """Audit trail entry for every stock quantity change on a product."""

    id: str = Field(alias="_id")
    product_id: str
    order_id: Optional[str] = None
    change_type: str  # reserve | release | reduce | restore
    quantity: int  # positive = added back, negative = deducted
    stock_before: int
    stock_after: int
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


class PaymentLog(BaseModel):
    """Immutable audit trail entry for every payment-related event
    (create, verify attempt, webhook event, failure, retry)."""

    id: str = Field(alias="_id")
    payment_id: Optional[str] = None  # our internal payments._id
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    event_type: str  # order_created | verify_attempt | webhook_received | signature_mismatch | captured | failed | refund_initiated | refund_processed
    status: Optional[str] = None
    amount: Optional[float] = None
    raw_payload: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
