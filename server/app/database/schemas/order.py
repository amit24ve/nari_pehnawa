from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    """
    Full customer-facing order lifecycle. Kept as a superset of every status
    string already written by existing code (pending/confirmed/processing/
    shipped/delivered/cancelled/refunded/paid/completed) plus the richer
    Amazon/Flipkart-style stages, so nothing already stored in MongoDB
    becomes invalid against this enum.
    """

    PENDING_PAYMENT = "pending_payment"
    PAYMENT_FAILED = "payment_failed"
    PENDING = "pending"  # legacy value, treated same as pending_payment
    PAID = "paid"  # legacy value written by order.py status-change endpoint
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    PACKED = "packed"
    READY_TO_SHIP = "ready_to_ship"
    SHIPMENT_CREATED = "shipment_created"
    PICKUP_SCHEDULED = "pickup_scheduled"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    COMPLETED = "completed"  # legacy value used by admin frontend; == delivered+settled
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    COMPLETED = "completed"  # legacy alias for captured, kept for compatibility
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUND_INITIATED = "refund_initiated"
    REFUNDED = "refunded"


# Statuses that represent a "final, no more automatic transitions" state.
TERMINAL_ORDER_STATUSES = {
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
}

# Statuses a customer is allowed to request cancellation from (i.e. before
# the order has shipped). Once shipped, cancellation must go through the
# return flow instead.
CANCELLABLE_STATUSES = {
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.PACKED,
    OrderStatus.READY_TO_SHIP,
}


class OrderItemBase(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    quantity: int
    size: str
    color: Optional[str] = None
    price: float
    total: float
    hsn_code: Optional[str] = None  # GST HSN/SAC code for invoicing


class OrderItemCreate(OrderItemBase):
    pass


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"


class OrderBase(BaseModel):
    user_id: str
    items: List[OrderItemBase]
    shipping_address: ShippingAddress
    subtotal: float
    discount: float = 0.0
    shipping_cost: float = 0.0
    tax: float = 0.0
    total_amount: float
    payment_method: str = "COD"
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None
    staff_assigned: Optional[str] = None
    warehouse_assigned: Optional[str] = None
    courier_name: Optional[str] = None


class Order(OrderBase):
    id: str = Field(alias="_id")
    order_number: str
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    tracking_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    estimated_delivery: Optional[datetime] = None
    staff_assigned: Optional[str] = None
    warehouse_assigned: Optional[str] = None
    courier_name: Optional[str] = None

    class Config:
        populate_by_name = True
