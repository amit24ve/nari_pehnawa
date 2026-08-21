"""
Pydantic v2 request/response schemas for the Shiprocket shipping module.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, Field, field_validator


# ── Enums ──────────────────────────────────────────────────────────────────


class PickupStatus(str, Enum):
    NOT_SCHEDULED = "not_scheduled"
    SCHEDULED = "scheduled"
    PICKED_UP = "picked_up"
    FAILED = "failed"


class ShipmentStatus(str, Enum):
    NEW = "new"
    ORDER_CREATED = "order_created"
    AWB_ASSIGNED = "awb_assigned"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    RTO_INITIATED = "rto_initiated"
    RTO_DELIVERED = "rto_delivered"
    CANCELLED = "cancelled"
    FAILED = "failed"


# ── Shared value objects ────────────────────────────────────────────────────


class PackageDimensions(BaseModel):
    """Physical package details required by Shiprocket for rate calculation."""

    length: float = Field(default=10, gt=0, description="Length in cm")
    breadth: float = Field(default=10, gt=0, description="Breadth in cm")
    height: float = Field(default=10, gt=0, description="Height in cm")
    weight: float = Field(default=0.5, gt=0, description="Weight in kg")


# ── Create shipment (order -> Shiprocket) ───────────────────────────────────


class CreateShipmentRequest(BaseModel):
    """Payload to create a Shiprocket order for an existing app order."""

    order_id: str = Field(..., description="MongoDB order _id (as string)")
    dimensions: Optional[PackageDimensions] = None


class CreateShipmentResponse(BaseModel):
    success: bool
    order_id: str
    shiprocket_order_id: Optional[int] = None
    shipment_id: Optional[int] = None
    awb_code: Optional[str] = None
    courier_name: Optional[str] = None
    courier_company_id: Optional[int] = None
    pickup_status: str = PickupStatus.NOT_SCHEDULED.value
    shipment_status: str = ShipmentStatus.NEW.value
    tracking_url: Optional[str] = None
    message: Optional[str] = None


# ── AWB generation ───────────────────────────────────────────────────────────


class GenerateAWBRequest(BaseModel):
    shipment_id: int = Field(..., description="Shiprocket shipment_id")
    courier_id: Optional[int] = Field(
        None, description="Specific courier company id. Omit to auto-assign."
    )


class GenerateAWBResponse(BaseModel):
    success: bool
    shipment_id: int
    awb_code: Optional[str] = None
    courier_name: Optional[str] = None
    courier_company_id: Optional[int] = None
    message: Optional[str] = None


# ── Pickup scheduling ────────────────────────────────────────────────────────


class SchedulePickupRequest(BaseModel):
    shipment_id: int = Field(..., description="Shiprocket shipment_id")
    pickup_date: Optional[str] = Field(
        None, description="YYYY-MM-DD; defaults to today if omitted"
    )

    @field_validator("pickup_date")
    @classmethod
    def _validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("pickup_date must be in YYYY-MM-DD format") from exc
        return v


class SchedulePickupResponse(BaseModel):
    success: bool
    shipment_id: int
    pickup_status: str
    pickup_scheduled_date: Optional[str] = None
    message: Optional[str] = None


# ── Tracking ─────────────────────────────────────────────────────────────────


class TrackingActivity(BaseModel):
    date: Optional[str] = None
    status: Optional[str] = None
    activity: Optional[str] = None
    location: Optional[str] = None


class TrackShipmentResponse(BaseModel):
    awb: str
    current_status: str = "Unknown"
    shipment_status: Optional[str] = None
    courier_name: Optional[str] = None
    estimated_delivery: Optional[str] = None
    delivered_date: Optional[str] = None
    tracking_url: Optional[str] = None
    tracking_history: List[TrackingActivity] = Field(default_factory=list)


# ── Cancel shipment ──────────────────────────────────────────────────────────


class CancelShipmentRequest(BaseModel):
    order_id: Optional[str] = Field(
        None, description="MongoDB order id (either this or awbs must be set)"
    )
    awbs: Optional[List[str]] = Field(
        None, description="One or more Shiprocket AWB codes to cancel"
    )


class CancelShipmentResponse(BaseModel):
    success: bool
    message: str


# ── Courier serviceability ───────────────────────────────────────────────────


class ServiceabilityQuery(BaseModel):
    pickup_postcode: str
    delivery_postcode: str
    weight: float = 0.5
    cod: bool = False
    declared_value: Optional[float] = None


class CourierOption(BaseModel):
    courier_company_id: int
    courier_name: str
    rate: float
    estimated_delivery_days: Optional[str] = None
    is_cod_available: bool = False
    rating: Optional[float] = None


class ServiceabilityResponse(BaseModel):
    available_couriers: List[CourierOption] = Field(default_factory=list)
    recommended_courier_id: Optional[int] = None


# ── Reassign courier (admin) ────────────────────────────────────────────────


class ReassignCourierRequest(BaseModel):
    shipment_id: int
    courier_id: int


# ── Order shipping info (customer + admin view) ─────────────────────────────


class OrderShippingInfo(BaseModel):
    order_id: str
    order_number: Optional[str] = None
    shiprocket_order_id: Optional[int] = None
    shipment_id: Optional[int] = None
    awb: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    courier_name: Optional[str] = None
    pickup_status: str = PickupStatus.NOT_SCHEDULED.value
    shipment_status: str = ShipmentStatus.NEW.value
    pickup_date: Optional[str] = None
    delivered_date: Optional[str] = None
    shipping_cost: Optional[float] = None
    label_url: Optional[str] = None
    invoice_url: Optional[str] = None
    manifest_url: Optional[str] = None
    estimated_delivery: Optional[str] = None
    current_status: Optional[str] = None


# ── Webhook payload (as sent by Shiprocket) ─────────────────────────────────


class ShiprocketWebhookPayload(BaseModel):
    """
    Shiprocket sends slightly different fields depending on the event, so
    everything except awb is optional and we work off whatever is present.
    """

    awb: Optional[str] = None
    order_id: Optional[str] = None
    current_status: Optional[str] = None
    current_status_id: Optional[int] = None
    shipment_status: Optional[str] = None
    courier_name: Optional[str] = None
    etd: Optional[str] = None
    scans: Optional[List[dict]] = None

    class Config:
        extra = "allow"


# ── Bulk Actions & Manifest Requests ─────────────────────────────────────────


class GenerateManifestRequest(BaseModel):
    shipment_ids: List[Union[int, str]]


class BulkActionRequest(BaseModel):
    ids: List[Union[int, str]]

