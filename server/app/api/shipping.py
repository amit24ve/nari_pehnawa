"""
Shipping API routes — the public surface of the Shiprocket integration.

Endpoints:
    POST   /shipping/create-order            (admin)  create Shiprocket order for an app order
    POST   /shipping/generate-awb             (admin)  generate AWB / assign courier
    POST   /shipping/schedule-pickup          (admin)  schedule courier pickup
    GET    /shipping/track/{awb}              (auth)   live tracking by AWB
    POST   /shipping/cancel                   (admin)  cancel a shipment
    GET    /shipping/courier-serviceability   (auth)   list couriers + rates for a route
    GET    /shipping/label/{shipment_id}      (admin)  get shipping label PDF url
    GET    /shipping/invoice/{shipment_id}    (admin)  get invoice PDF url
    POST   /shipping/reassign-courier         (admin)  cancel + reassign a different courier
    POST   /shipping/fulfill/{order_id}       (admin)  full pipeline: create -> AWB -> pickup
    GET    /shipping/order/{order_id}         (auth)   customer/admin shipping status for an order
    POST   /shipping/webhook                          Shiprocket status-update webhook (no auth header,
                                                        verified via shared secret instead)

All admin-only endpoints require the `require_admin` dependency already used
elsewhere in this codebase. Customer-facing tracking endpoints require any
authenticated user and additionally verify the order belongs to them (or
that they're an admin) before returning data.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pymongo.database import Database

from app.database import get_database
from app.database.repositories.shipping_repository import ShippingRepository
from app.models.shipping import ShippingEvent, ShippingInfo
from app.schemas.shipping import (
    CancelShipmentRequest,
    CancelShipmentResponse,
    CourierOption,
    CreateShipmentRequest,
    CreateShipmentResponse,
    GenerateAWBRequest,
    GenerateAWBResponse,
    OrderShippingInfo,
    ReassignCourierRequest,
    SchedulePickupRequest,
    SchedulePickupResponse,
    ServiceabilityResponse,
    TrackShipmentResponse,
)
from app.security import get_current_user, require_admin
from app.services.shiprocket_service import (
    ShiprocketAPIError,
    ShiprocketService,
    build_tracking_summary,
    get_shiprocket_service,
)
from app.utils.shiprocket_helper import build_tracking_url, logger, map_shiprocket_status
from app.config import shiprocket_webhook_secret

router = APIRouter(prefix="/shipping", tags=["Shipping"])


# ── Dependencies ─────────────────────────────────────────────────────────────


def get_shipping_repository(db: Database = Depends(get_database)) -> ShippingRepository:
    return ShippingRepository(db)


def _require_order(order: Optional[dict], order_id: str) -> dict:
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


async def _load_order_or_404(order_id: str, repo: ShippingRepository) -> dict:
    try:
        ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")
    order = await repo.get_order(order_id)
    return _require_order(order, order_id)


def _shipping_info_response(order: dict) -> OrderShippingInfo:
    shipping = order.get("shipping", {}) or {}
    return OrderShippingInfo(
        order_id=str(order.get("_id")),
        order_number=order.get("order_number"),
        shiprocket_order_id=shipping.get("shiprocket_order_id"),
        shipment_id=shipping.get("shipment_id"),
        awb=shipping.get("awb"),
        tracking_number=shipping.get("tracking_number") or shipping.get("awb"),
        tracking_url=shipping.get("tracking_url"),
        courier_name=shipping.get("courier_name"),
        pickup_status=shipping.get("pickup_status", "not_scheduled"),
        shipment_status=shipping.get("shipment_status", "new"),
        pickup_date=shipping.get("pickup_date") or shipping.get("pickup_scheduled_date"),
        delivered_date=shipping.get("delivered_date"),
        shipping_cost=shipping.get("shipping_cost"),
        label_url=shipping.get("label_url"),
        invoice_url=shipping.get("invoice_url"),
        estimated_delivery=shipping.get("estimated_delivery"),
        current_status=shipping.get("current_status"),
    )


# ── Create order ─────────────────────────────────────────────────────────────


@router.post("/create-order", response_model=CreateShipmentResponse)
async def create_shipment(
    payload: CreateShipmentRequest,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Create a Shiprocket order for an existing app order (Admin only)."""
    order = await _load_order_or_404(payload.order_id, repo)
    order_data = {k: v for k, v in order.items() if k != "_id"}
    dims = payload.dimensions.model_dump() if payload.dimensions else None

    try:
        result = await sr.create_order(payload.order_id, order_data, dims)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    info = ShippingInfo(
        shiprocket_order_id=result.get("order_id"),
        shipment_id=result.get("shipment_id"),
        shipment_status="order_created",
    )
    await repo.update_shipping_info(payload.order_id, info)

    return CreateShipmentResponse(
        success=True,
        order_id=payload.order_id,
        shiprocket_order_id=info.shiprocket_order_id,
        shipment_id=info.shipment_id,
        shipment_status=info.shipment_status,
        message="Shiprocket order created successfully",
    )


# ── Generate AWB ─────────────────────────────────────────────────────────────


@router.post("/generate-awb", response_model=GenerateAWBResponse)
async def generate_awb(
    payload: GenerateAWBRequest,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Generate an AWB / assign a courier for a shipment (Admin only)."""
    try:
        result = await sr.generate_awb(payload.shipment_id, payload.courier_id)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    data = result.get("response", {}).get("data", result)
    awb_code = data.get("awb_code") or result.get("awb_code")
    courier_name = data.get("courier_name") or result.get("courier_name")
    courier_company_id = data.get("courier_company_id")

    order = await repo.find_order_by_shipment_id(payload.shipment_id)

    if order:
        await repo.update_shipping_info(
            str(order["_id"]),
            ShippingInfo(
                awb=awb_code,
                tracking_number=awb_code,
                courier_name=courier_name,
                courier_company_id=courier_company_id,
                tracking_url=build_tracking_url(awb_code),
                shipment_status="awb_assigned" if awb_code else "order_created",
            ),
        )

    return GenerateAWBResponse(
        success=bool(awb_code),
        shipment_id=payload.shipment_id,
        awb_code=awb_code,
        courier_name=courier_name,
        courier_company_id=courier_company_id,
        message="AWB generated successfully" if awb_code else "AWB generation returned no code",
    )


# ── Schedule pickup ──────────────────────────────────────────────────────────


@router.post("/schedule-pickup", response_model=SchedulePickupResponse)
async def schedule_pickup(
    payload: SchedulePickupRequest,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Schedule a courier pickup for a shipment (Admin only)."""
    try:
        await sr.schedule_pickup(payload.shipment_id, payload.pickup_date)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    order = await repo.find_order_by_shipment_id(payload.shipment_id)
    scheduled_date = payload.pickup_date or datetime.now().strftime("%Y-%m-%d")
    if order:
        await repo.update_shipping_info(
            str(order["_id"]),
            ShippingInfo(
                pickup_status="scheduled",
                pickup_scheduled_date=scheduled_date,
                shipment_status="pickup_scheduled",
            ),
        )

    return SchedulePickupResponse(
        success=True,
        shipment_id=payload.shipment_id,
        pickup_status="scheduled",
        pickup_scheduled_date=scheduled_date,
        message="Pickup scheduled successfully",
    )


# ── Tracking ─────────────────────────────────────────────────────────────────


@router.get("/track/{awb}", response_model=TrackShipmentResponse)
async def track_shipment(
    awb: str,
    current_user: dict = Depends(get_current_user),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Track a shipment by AWB. Any authenticated user may track (order
    ownership is enforced at the /shipping/order/{order_id} level)."""
    try:
        raw = await sr.track_by_awb(awb)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=404, detail=f"No tracking data for AWB {awb}: {exc}")

    summary = build_tracking_summary(awb, raw)

    # Sync latest status back onto the order for fast subsequent reads.
    order = await repo.find_order_by_awb(awb)
    if order:
        mapped_status = map_shiprocket_status(summary["current_status"])
        await repo.update_shipping_info(
            str(order["_id"]),
            ShippingInfo(
                current_status=summary["current_status"],
                shipment_status=mapped_status,
                estimated_delivery=summary.get("estimated_delivery") or None,
                delivered_date=summary.get("delivered_date") or None,
            ),
        )

    return TrackShipmentResponse(**summary, shipment_status=map_shiprocket_status(summary["current_status"]))


# ── Cancel ───────────────────────────────────────────────────────────────────


@router.post("/cancel", response_model=CancelShipmentResponse)
async def cancel_shipment(
    payload: CancelShipmentRequest,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Cancel a shipment by order_id or a list of AWBs (Admin only)."""
    awbs = payload.awbs or []

    if payload.order_id and not awbs:
        order = await _load_order_or_404(payload.order_id, repo)
        awb = (order.get("shipping") or {}).get("awb")
        if not awb:
            raise HTTPException(
                status_code=400, detail="Order has no AWB yet; nothing to cancel"
            )
        awbs = [awb]

    if not awbs:
        raise HTTPException(status_code=400, detail="Provide order_id or awbs to cancel")

    try:
        await sr.cancel_shipment(awbs)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    for awb in awbs:
        await repo.update_shipping_by_awb(awb, {"shipment_status": "cancelled"})
        order = await repo.find_order_by_awb(awb)
        if order:
            await repo.update_order_status(str(order["_id"]), "cancelled")

    return CancelShipmentResponse(success=True, message=f"Cancelled {len(awbs)} shipment(s)")


# ── Serviceability ───────────────────────────────────────────────────────────


@router.get("/courier-serviceability", response_model=ServiceabilityResponse)
async def courier_serviceability(
    pickup_postcode: str = Query(...),
    delivery_postcode: str = Query(...),
    weight: float = Query(0.5),
    cod: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    sr: ShiprocketService = Depends(get_shiprocket_service),
):
    """Check courier availability + rates between two pincodes."""
    try:
        raw = await sr.check_serviceability(pickup_postcode, delivery_postcode, weight, cod)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    companies = (raw.get("data") or {}).get("available_courier_companies") or []
    options: List[CourierOption] = []
    for c in companies:
        options.append(
            CourierOption(
                courier_company_id=c.get("courier_company_id"),
                courier_name=c.get("courier_name", ""),
                rate=float(c.get("rate", 0) or 0),
                estimated_delivery_days=str(c.get("estimated_delivery_days", "")),
                is_cod_available=bool(c.get("cod") or c.get("is_cod")),
                rating=c.get("rating"),
            )
        )
    options.sort(key=lambda o: o.rate)
    recommended = options[0].courier_company_id if options else None

    return ServiceabilityResponse(available_couriers=options, recommended_courier_id=recommended)


# ── Label / Invoice ──────────────────────────────────────────────────────────


@router.get("/label/{shipment_id}")
async def get_label(
    shipment_id: int,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Generate/fetch the shipping label PDF URL for a shipment (Admin only)."""
    try:
        result = await sr.generate_label([shipment_id])
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    label_url = result.get("label_url")
    if not label_url:
        raise HTTPException(status_code=502, detail="Shiprocket did not return a label URL")

    order = await repo.find_order_by_shipment_id(shipment_id)
    if order:
        await repo.update_shipping_info(str(order["_id"]), ShippingInfo(label_url=label_url))

    return {"success": True, "shipment_id": shipment_id, "label_url": label_url}


@router.get("/invoice/{shipment_id}")
async def get_invoice(
    shipment_id: int,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Generate/fetch the invoice PDF URL for a shipment's Shiprocket order (Admin only)."""
    order = await repo.find_order_by_shipment_id(shipment_id)
    shiprocket_order_id = (order.get("shipping") or {}).get("shiprocket_order_id") if order else None
    if not shiprocket_order_id:
        raise HTTPException(
            status_code=404, detail="No Shiprocket order found for this shipment_id"
        )

    try:
        result = await sr.generate_invoice([shiprocket_order_id])
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    invoice_url = result.get("invoice_url")
    if not invoice_url:
        raise HTTPException(status_code=502, detail="Shiprocket did not return an invoice URL")

    if order:
        await repo.update_shipping_info(str(order["_id"]), ShippingInfo(invoice_url=invoice_url))

    return {"success": True, "shipment_id": shipment_id, "invoice_url": invoice_url}


# ── Reassign courier ─────────────────────────────────────────────────────────


@router.post("/reassign-courier")
async def reassign_courier(
    payload: ReassignCourierRequest,
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Cancel the current AWB and reassign a different courier (Admin only)."""
    try:
        result = await sr.reassign_courier(payload.shipment_id, payload.courier_id)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    data = result.get("response", {}).get("data", result)
    awb_code = data.get("awb_code") or result.get("awb_code")
    courier_name = data.get("courier_name") or result.get("courier_name")

    order = await repo.find_order_by_shipment_id(payload.shipment_id)
    if order:
        await repo.update_shipping_info(
            str(order["_id"]),
            ShippingInfo(
                awb=awb_code,
                tracking_number=awb_code,
                courier_name=courier_name,
                courier_company_id=payload.courier_id,
                tracking_url=build_tracking_url(awb_code),
                shipment_status="awb_assigned" if awb_code else "order_created",
            ),
        )

    return {"success": bool(awb_code), "awb_code": awb_code, "courier_name": courier_name}


# ── Full pipeline trigger (used automatically after payment, and manually) ──


@router.get("/pickup-locations")
async def get_pickup_locations(
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
):
    """List all registered pickup addresses/warehouses from Shiprocket (Admin only)."""
    try:
        locations = await sr.get_pickup_locations()
        return {"success": True, "locations": locations}
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/fulfill/{order_id}")
async def fulfill_order(
    order_id: str,
    pickup_location: Optional[str] = Query(None),
    current_user: dict = Depends(require_admin),
    sr: ShiprocketService = Depends(get_shiprocket_service),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """
    Run the full pipeline for an existing order: create Shiprocket order ->
    generate AWB -> assign courier -> schedule pickup -> persist everything.
    Optionally accepts a custom pickup_location nickname.
    """
    order = await _load_order_or_404(order_id, repo)
    order_data = {k: v for k, v in order.items() if k != "_id"}
    if pickup_location:
        order_data["pickup_location"] = pickup_location

    try:
        result = await sr.fulfill_order(order_id, order_data, repo)
    except ShiprocketAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {"success": True, "order_id": order_id, "shipping": result}


# ── Customer + Admin: order shipping info ────────────────────────────────────


@router.get("/order/{order_id}", response_model=OrderShippingInfo)
async def get_order_shipping(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """Fetch stored shipping/tracking info for an order (owner or admin)."""
    order = await _load_order_or_404(order_id, repo)

    if current_user.get("role") != "admin" and str(order.get("user_id")) != str(
        current_user.get("id")
    ):
        raise HTTPException(status_code=403, detail="Not authorised to view this order")

    return _shipping_info_response(order)


# ── Webhook ──────────────────────────────────────────────────────────────────


@router.post("/webhook")
async def shiprocket_webhook(
    payload: dict,
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
    repo: ShippingRepository = Depends(get_shipping_repository),
):
    """
    Receives Shiprocket status-update webhooks (order created, pickup
    scheduled, in transit, out for delivery, delivered, RTO, cancelled) and
    updates the matching order automatically.

    Shiprocket calls this endpoint server-to-server, so authentication is
    via a shared secret configured on both sides (Shiprocket panel ->
    Settings -> API -> Webhook, and SHIPROCKET_WEBHOOK_SECRET here) rather
    than a user JWT.
    """
    if shiprocket_webhook_secret and x_api_key != shiprocket_webhook_secret:
        logger.warning("Rejected webhook call with invalid X-Api-Key")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    awb = payload.get("awb") or payload.get("awb_code")
    order_id_field = payload.get("order_id")
    raw_status = payload.get("current_status") or payload.get("shipment_status") or ""
    mapped_status = map_shiprocket_status(raw_status)

    await repo.log_event(
        ShippingEvent(
            awb=awb,
            order_id=str(order_id_field) if order_id_field else None,
            event_type=raw_status or mapped_status,
            raw_payload=payload,
        )
    )

    order = await repo.find_order_by_awb(awb) if awb else None
    if not order and order_id_field:
        order = await repo.find_order_by_shiprocket_order_id(order_id_field)

    if not order:
        logger.warning("Webhook for unknown shipment (awb=%s order_id=%s)", awb, order_id_field)
        return {"success": True, "matched": False}

    update = ShippingInfo(
        current_status=raw_status or None,
        shipment_status=mapped_status,
        courier_name=payload.get("courier_name") or None,
    )
    if mapped_status == "delivered":
        update.delivered_date = datetime.now().strftime("%Y-%m-%d")

    await repo.update_shipping_info(str(order["_id"]), update)

    # Mirror the shipment status onto the order's top-level `status` field so
    # existing admin/customer order views (which read `order.status`) reflect
    # the shipment lifecycle without needing to know about `shipping.*`.
    order_status_map = {
        "delivered": "delivered",
        "in_transit": "shipped",
        "out_for_delivery": "shipped",
        "picked_up": "shipped",
        "cancelled": "cancelled",
    }
    if mapped_status in order_status_map:
        await repo.update_order_status(str(order["_id"]), order_status_map[mapped_status])

    return {"success": True, "matched": True, "order_id": str(order["_id"]), "status": mapped_status}
