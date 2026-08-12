from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class NotificationChannel(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"


class NotificationEvent(str, Enum):
    ORDER_CONFIRMED = "order_confirmed"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    ORDER_PACKED = "order_packed"
    ORDER_SHIPPED = "order_shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    REFUND_INITIATED = "refund_initiated"
    REFUND_COMPLETED = "refund_completed"
    RETURN_APPROVED = "return_approved"
    RETURN_REJECTED = "return_rejected"
    EXCHANGE_APPROVED = "exchange_approved"


class NotificationStatus(str, Enum):
    SENT = "sent"
    FAILED = "failed"
    SKIPPED_NO_CONFIG = "skipped_no_config"


class NotificationLog(BaseModel):
    id: str = Field(alias="_id")
    user_id: Optional[str] = None
    order_id: Optional[str] = None
    event: NotificationEvent
    channel: NotificationChannel
    recipient: str
    subject: Optional[str] = None
    body_preview: Optional[str] = None
    status: NotificationStatus
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
