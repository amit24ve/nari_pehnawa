from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ── Returns ────────────────────────────────────────────────────────────────


class ReturnStatus(str, Enum):
    REQUESTED = "requested"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    WAREHOUSE_RECEIVED = "warehouse_received"
    QC_IN_PROGRESS = "qc_in_progress"
    QC_PASSED = "qc_passed"
    QC_FAILED = "qc_failed"
    REFUND_INITIATED = "refund_initiated"
    COMPLETED = "completed"
    CLOSED = "closed"


class ReturnItemRequest(BaseModel):
    product_id: str
    quantity: int
    reason: str


class ReturnCreate(BaseModel):
    order_id: str
    items: List[ReturnItemRequest]
    reason: str
    comments: Optional[str] = None


class ReturnAdminAction(BaseModel):
    action: str  # approve | reject | schedule_pickup | mark_picked_up | mark_received | qc_pass | qc_fail
    reason: Optional[str] = None


class ReturnRequest(BaseModel):
    id: str = Field(alias="_id")
    order_id: str
    user_id: str
    items: List[ReturnItemRequest]
    reason: str
    comments: Optional[str] = None
    status: ReturnStatus = ReturnStatus.REQUESTED
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    refund_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


# ── Exchanges ─────────────────────────────────────────────────────────────


class ExchangeStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    QC_IN_PROGRESS = "qc_in_progress"
    QC_PASSED = "qc_passed"
    QC_FAILED = "qc_failed"
    NEW_ITEM_SHIPPED = "new_item_shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CLOSED = "closed"


class ExchangeCreate(BaseModel):
    order_id: str
    product_id: str
    quantity: int
    current_size: Optional[str] = None
    requested_size: Optional[str] = None
    reason: str
    comments: Optional[str] = None


class ExchangeAdminAction(BaseModel):
    action: str  # approve | reject | schedule_pickup | mark_picked_up | qc_pass | qc_fail | ship_new_item | mark_delivered
    reason: Optional[str] = None


class ExchangeRequest(BaseModel):
    id: str = Field(alias="_id")
    order_id: str
    user_id: str
    product_id: str
    quantity: int
    current_size: Optional[str] = None
    requested_size: Optional[str] = None
    reason: str
    comments: Optional[str] = None
    status: ExchangeStatus = ExchangeStatus.REQUESTED
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    new_awb: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


# ── Refunds ───────────────────────────────────────────────────────────────


class RefundStatus(str, Enum):
    INITIATED = "initiated"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    RETRY_SCHEDULED = "retry_scheduled"


class RefundCreate(BaseModel):
    order_id: str
    amount: float
    reason: str
    return_id: Optional[str] = None
    cancellation_id: Optional[str] = None


class Refund(BaseModel):
    id: str = Field(alias="_id")
    order_id: str
    return_id: Optional[str] = None
    cancellation_id: Optional[str] = None
    razorpay_refund_id: Optional[str] = None
    amount: float
    reason: str
    status: RefundStatus = RefundStatus.INITIATED
    attempts: int = 0
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


# ── Cancellation ──────────────────────────────────────────────────────────


class CancellationStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class CancellationCreate(BaseModel):
    order_id: str
    reason: str


class CancellationRequest(BaseModel):
    id: str = Field(alias="_id")
    order_id: str
    user_id: str
    reason: str
    status: CancellationStatus = CancellationStatus.REQUESTED
    admin_notes: Optional[str] = None
    refund_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
