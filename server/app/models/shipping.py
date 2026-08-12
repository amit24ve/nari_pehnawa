"""
MongoDB document model for the `shipping` sub-object embedded in every
`orders` collection document, plus the standalone `shipping_events`
collection used to store raw webhook history for auditing.

These are plain dataclasses (not Pydantic) because they map directly to
what gets stored via pymongo/motor `$set` operations - Pydantic schemas in
app/schemas/shipping.py handle validation at the API boundary.
"""

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class ShippingInfo:
    """Embedded `orders.shipping` sub-document."""

    shipment_id: Optional[int] = None
    shiprocket_order_id: Optional[int] = None
    awb: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    courier_name: Optional[str] = None
    courier_company_id: Optional[int] = None
    pickup_status: str = "not_scheduled"
    shipment_status: str = "new"
    pickup_date: Optional[str] = None
    pickup_scheduled_date: Optional[str] = None
    delivered_date: Optional[str] = None
    shipping_cost: Optional[float] = None
    label_url: Optional[str] = None
    invoice_url: Optional[str] = None
    estimated_delivery: Optional[str] = None
    current_status: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        data = asdict(self)
        # Drop None values so partial updates via $set don't clobber
        # fields we didn't intend to touch.
        return {k: v for k, v in data.items() if v is not None}


@dataclass
class ShippingEvent:
    """
    A single row in the `shipping_events` collection - an immutable audit
    log of every webhook Shiprocket sends us, keyed by AWB / order.
    """

    awb: Optional[str]
    order_id: Optional[str]
    event_type: Optional[str]
    raw_payload: dict
    received_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return asdict(self)
