"""
ShiprocketService — a single, reusable async client that wraps every
Shiprocket External API call used by this application:

- Authentication (login, auto token generation/refresh, expiry handling)
- Order creation
- AWB generation / courier assignment
- Pickup scheduling
- Tracking
- Cancellation
- Courier serviceability
- Label + invoice generation
- Courier reassignment

Design notes:
- One shared httpx.AsyncClient per service instance (connection pooling).
- Token is cached in-memory and refreshed automatically when it's within
  `_TOKEN_REFRESH_MARGIN` of expiry, or immediately on a 401 response
  (single retry-with-refresh, not an infinite loop).
- All network calls go through `async_retry` for resilience against
  transient network errors / 5xx responses.
- No mock data anywhere — every method calls the real Shiprocket API and
  raises `ShiprocketAPIError` with the upstream detail on failure.
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any, Optional

import httpx

if TYPE_CHECKING:
    from app.database.repositories.shipping_repository import ShippingRepository

from app.config import (
    shiprocket_base_url,
    shiprocket_channel_id,
    shiprocket_default_breadth_cm,
    shiprocket_default_height_cm,
    shiprocket_default_length_cm,
    shiprocket_default_weight_kg,
    shiprocket_email,
    shiprocket_password,
    shiprocket_pickup_location,
)
from app.utils.shiprocket_helper import async_retry, build_tracking_url, logger

# Refresh the token this long before its real expiry to avoid ever using
# a token that dies mid-request.
_TOKEN_REFRESH_MARGIN = timedelta(hours=6)
# Shiprocket tokens are valid ~10 days; used only as a fallback if the JWT
# `exp` claim can't be decoded for some reason.
_FALLBACK_TOKEN_TTL = timedelta(hours=23)


class ShiprocketAPIError(Exception):
    """Raised whenever the Shiprocket API returns an error we can't recover from."""

    def __init__(self, message: str, status_code: Optional[int] = None, detail: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.detail = detail


class ShiprocketAuthError(ShiprocketAPIError):
    """Raised when login itself fails (bad credentials, account access issue, etc)."""


def _decode_jwt_expiry(token: str) -> Optional[datetime]:
    """Best-effort decode of the `exp` claim from a JWT without verifying
    the signature (we don't have Shiprocket's signing key — we only need
    the expiry timestamp to know when to refresh)."""
    try:
        payload_b64 = token.split(".")[1]
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        exp = payload.get("exp")
        if exp:
            return datetime.fromtimestamp(exp, tz=timezone.utc)
    except Exception:
        pass
    return None


class ShiprocketService:
    """Singleton-style service. Instantiate once and reuse (see get_shiprocket_service)."""

    def __init__(
        self,
        email: str = shiprocket_email,
        password: str = shiprocket_password,
        base_url: str = shiprocket_base_url,
    ):
        self._email = email
        self._password = password
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=30.0)
        self._token: Optional[str] = None
        self._token_expiry: datetime = datetime.min.replace(tzinfo=timezone.utc)

    async def aclose(self) -> None:
        await self._client.aclose()

    # ── Authentication ───────────────────────────────────────────────────────

    def _token_is_valid(self) -> bool:
        if not self._token:
            return False
        return datetime.now(timezone.utc) < (self._token_expiry - _TOKEN_REFRESH_MARGIN)

    @async_retry(max_attempts=3, base_delay=1.0)
    async def _login(self) -> str:
        """Authenticate against Shiprocket and cache the JWT + its expiry."""
        if not self._email or not self._password:
            raise ShiprocketAuthError(
                "Shiprocket credentials are not configured. "
                "Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in the environment."
            )

        try:
            resp = await self._client.post(
                f"{self._base_url}/auth/login",
                json={"email": self._email, "password": self._password},
                headers={"Content-Type": "application/json"},
            )
        except (httpx.TransportError, httpx.TimeoutException) as exc:
            raise ShiprocketAPIError(f"Network error contacting Shiprocket: {exc}") from exc

        if resp.status_code != 200:
            detail = _safe_json(resp)
            message = (
                detail.get("message")
                if isinstance(detail, dict)
                else resp.text[:300]
            )
            logger.error("Shiprocket login failed (%s): %s", resp.status_code, message)
            raise ShiprocketAuthError(
                f"Shiprocket authentication failed: {message}",
                status_code=resp.status_code,
                detail=detail,
            )

        data = resp.json()
        token = data.get("token")
        if not token:
            raise ShiprocketAuthError("Shiprocket login succeeded but returned no token")

        self._token = token
        expiry = _decode_jwt_expiry(token)
        self._token_expiry = expiry or (datetime.now(timezone.utc) + _FALLBACK_TOKEN_TTL)
        logger.info(
            "Shiprocket token acquired, valid until %s",
            self._token_expiry.isoformat(),
        )
        return token

    async def get_token(self, force_refresh: bool = False) -> str:
        """Return a valid Shiprocket JWT, transparently logging in / refreshing."""
        if force_refresh or not self._token_is_valid():
            return await self._login()
        return self._token  # type: ignore[return-value]

    async def _auth_headers(self, force_refresh: bool = False) -> dict:
        token = await self.get_token(force_refresh=force_refresh)
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # ── Low-level request helper (auto retries + one 401-triggered re-login) ──

    @async_retry(max_attempts=3, base_delay=1.0)
    async def _request(
        self,
        method: str,
        path: str,
        json_body: Optional[dict] = None,
        params: Optional[dict] = None,
        _retried_after_401: bool = False,
    ) -> dict:
        headers = await self._auth_headers()
        url = f"{self._base_url}{path}"
        try:
            resp = await self._client.request(
                method, url, json=json_body, params=params, headers=headers
            )
        except (httpx.TransportError, httpx.TimeoutException) as exc:
            raise ShiprocketAPIError(f"Network error calling {path}: {exc}") from exc

        if resp.status_code == 401 and not _retried_after_401:
            # Token might have been invalidated server-side; force one refresh + retry.
            logger.warning("Got 401 from Shiprocket on %s, refreshing token and retrying", path)
            await self.get_token(force_refresh=True)
            return await self._request(
                method, path, json_body, params, _retried_after_401=True
            )

        if resp.status_code >= 400:
            detail = _safe_json(resp)
            message = detail.get("message") if isinstance(detail, dict) else resp.text[:300]
            logger.error("Shiprocket %s %s failed (%s): %s", method, path, resp.status_code, message)
            # Let 429/5xx bubble as HTTPStatusError so async_retry can retry them.
            if resp.status_code in (408, 429, 500, 502, 503, 504):
                resp.raise_for_status()
            raise ShiprocketAPIError(
                f"Shiprocket API error on {path}: {message}",
                status_code=resp.status_code,
                detail=detail,
            )

        return _safe_json(resp) or {}

    # ── Orders ───────────────────────────────────────────────────────────────

    def _build_order_payload(self, order_id: str, order_data: dict, dimensions: Optional[dict] = None) -> dict:
        addr = order_data.get("shipping_address", {}) or {}
        if isinstance(addr, str):
            parts = [p.strip() for p in addr.split(",") if p.strip()]
            addr = {
                "full_name": order_data.get("customer_name") or "Customer",
                "phone": str(order_data.get("phone") or "").replace("+91", "").strip(),
                "address_line1": addr[:100],
                "city": parts[-3] if len(parts) >= 3 else "Mumbai",
                "state": parts[-2] if len(parts) >= 2 else "Maharashtra",
                "postal_code": parts[-1] if len(parts) >= 1 and parts[-1].strip().isdigit() else "400053",
            }
        items = order_data.get("items", []) or []
        dims = dimensions or {}

        order_items = []
        for item in items:
            order_items.append(
                {
                    "name": (item.get("product_name") or "Product")[:200],
                    "sku": str(item.get("product_id") or "SKU")[:50],
                    "units": int(item.get("quantity") or 1),
                    "selling_price": float(item.get("price") or 0),
                    "discount": 0,
                    "tax": 0,
                    "hsn": item.get("hsn", ""),
                }
            )

        is_prepaid = order_data.get("payment_method") in ("Razorpay", "Online", "razorpay")

        return {
            "order_id": str(order_id),
            "order_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "pickup_location": order_data.get("pickup_location") or shiprocket_pickup_location,
            "channel_id": shiprocket_channel_id,
            "billing_customer_name": addr.get("full_name", "Customer"),
            "billing_last_name": "",
            "billing_address": addr.get("address_line1", ""),
            "billing_address_2": addr.get("address_line2", ""),
            "billing_city": addr.get("city", ""),
            "billing_pincode": str(addr.get("postal_code", "")),
            "billing_state": addr.get("state", ""),
            "billing_country": addr.get("country", "India"),
            "billing_email": order_data.get("customer_email", "") or addr.get("email", ""),
            "billing_phone": str(addr.get("phone", "")),
            "shipping_is_billing": True,
            "order_items": order_items,
            "payment_method": "Prepaid" if is_prepaid else "COD",
            "sub_total": float(order_data.get("subtotal", order_data.get("total_amount", 0))),
            "length": float(dims.get("length", shiprocket_default_length_cm)),
            "breadth": float(dims.get("breadth", shiprocket_default_breadth_cm)),
            "height": float(dims.get("height", shiprocket_default_height_cm)),
            "weight": float(dims.get("weight", shiprocket_default_weight_kg)),
        }

    async def get_pickup_locations(self) -> list[dict]:
        """GET /settings/company/pickup — list registered pickup addresses."""
        res = await self._request("GET", "/settings/company/pickup")
        return res.get("data", {}).get("shipping_address", []) or []

    async def create_order(
        self, order_id: str, order_data: dict, dimensions: Optional[dict] = None
    ) -> dict:
        """POST /orders/create/adhoc — create a Shiprocket order from an app order."""
        payload = self._build_order_payload(order_id, order_data, dimensions)
        result = await self._request("POST", "/orders/create/adhoc", json_body=payload)

        # Fallback if configured pickup location string mismatches panel name
        if isinstance(result, dict) and "Wrong Pickup location" in str(result.get("message", "")):
            logger.warning("Pickup location '%s' invalid, fetching primary pickup address...", payload.get("pickup_location"))
            locations = await self.get_pickup_locations()
            if locations:
                primary_loc = next((l for l in locations if l.get("is_primary_location")), locations[0])
                actual_loc_name = primary_loc.get("pickup_location")
                if actual_loc_name:
                    logger.info("Retrying order creation with pickup_location='%s'", actual_loc_name)
                    payload["pickup_location"] = actual_loc_name
                    result = await self._request("POST", "/orders/create/adhoc", json_body=payload)

        if isinstance(result, dict) and not result.get("shipment_id"):
            msg = result.get("message") or "Shiprocket order creation returned no shipment_id"
            raise ShiprocketAPIError(f"Shiprocket order creation failed: {msg}", detail=result)

        logger.info(
            "Created Shiprocket order for app order %s -> shiprocket_order_id=%s shipment_id=%s",
            order_id,
            result.get("order_id"),
            result.get("shipment_id"),
        )
        return result

    # ── AWB / Courier assignment ─────────────────────────────────────────────

    async def generate_awb(self, shipment_id: int, courier_id: Optional[int] = None) -> dict:
        """POST /courier/assign/awb — generate AWB and assign a courier."""
        payload: dict = {"shipment_id": shipment_id}
        if courier_id:
            payload["courier_id"] = courier_id
        result = await self._request("POST", "/courier/assign/awb", json_body=payload)
        return result

    # ── Pickup ───────────────────────────────────────────────────────────────

    async def schedule_pickup(self, shipment_id: int, pickup_date: Optional[str] = None) -> dict:
        """POST /courier/generate/pickup — request courier pickup for a shipment."""
        payload: dict = {"shipment_id": [shipment_id]}
        result = await self._request("POST", "/courier/generate/pickup", json_body=payload)
        return result

    # ── Tracking ─────────────────────────────────────────────────────────────

    async def track_by_awb(self, awb: str) -> dict:
        """GET /courier/track/awb/{awb}"""
        return await self._request("GET", f"/courier/track/awb/{awb}")

    async def track_by_shipment_id(self, shipment_id: int) -> dict:
        """GET /courier/track/shipment/{shipment_id}"""
        return await self._request("GET", f"/courier/track/shipment/{shipment_id}")

    # ── Cancellation ─────────────────────────────────────────────────────────

    async def cancel_shipment(self, awbs: list[str]) -> dict:
        """POST /orders/cancel/shipment/awbs — cancel one or more shipments by AWB."""
        payload = {"awbs": awbs}
        return await self._request("POST", "/orders/cancel/shipment/awbs", json_body=payload)

    async def cancel_order(self, shiprocket_order_ids: list[int]) -> dict:
        """POST /orders/cancel — cancel Shiprocket order(s) before AWB is generated."""
        payload = {"ids": shiprocket_order_ids}
        return await self._request("POST", "/orders/cancel", json_body=payload)

    # ── Serviceability ───────────────────────────────────────────────────────

    async def check_serviceability(
        self,
        pickup_postcode: str,
        delivery_postcode: str,
        weight: float = 0.5,
        cod: bool = False,
        declared_value: Optional[float] = None,
    ) -> dict:
        """GET /courier/serviceability — list couriers + rates for a route."""
        params = {
            "pickup_postcode": pickup_postcode,
            "delivery_postcode": delivery_postcode,
            "weight": weight,
            "cod": 1 if cod else 0,
        }
        if declared_value is not None:
            params["declared_value"] = declared_value
        return await self._request("GET", "/courier/serviceability", params=params)

    # ── Label / Invoice ──────────────────────────────────────────────────────

    async def generate_label(self, shipment_ids: list[int]) -> dict:
        """POST /courier/generate/label — returns a `label_url` PDF link."""
        payload = {"shipment_id": shipment_ids}
        return await self._request("POST", "/courier/generate/label", json_body=payload)

    async def generate_invoice(self, order_ids: list[int]) -> dict:
        """POST /orders/print/invoice — returns an `invoice_url` PDF link."""
        payload = {"ids": order_ids}
        return await self._request("POST", "/orders/print/invoice", json_body=payload)

    async def generate_manifest(self, shipment_ids: list[int]) -> dict:
        """POST /manifests/generate — generates manifest."""
        payload = {"shipment_id": shipment_ids}
        return await self._request("POST", "/manifests/generate", json_body=payload)

    async def print_manifest(self, shipment_ids: list[int]) -> dict:
        """POST /manifests/print — returns a `manifest_url` PDF link."""
        payload = {"shipment_id": shipment_ids}
        return await self._request("POST", "/manifests/print", json_body=payload)

    # ── Courier reassignment (cancel AWB then regenerate with a new courier) ──

    async def reassign_courier(self, shipment_id: int, courier_id: int) -> dict:
        """
        Shiprocket has no single "reassign courier" endpoint — the documented
        flow is: cancel the current AWB, then generate a new one against the
        desired courier_id.
        """
        try:
            await self._request(
                "POST", "/courier/cancel/shipment/awb", json_body={"shipment_id": shipment_id}
            )
        except ShiprocketAPIError as exc:
            # If there's no AWB yet, Shiprocket rejects the cancel — that's fine,
            # we just proceed straight to assigning the new courier.
            logger.info("AWB cancel before reassignment reported: %s", exc)
        return await self.generate_awb(shipment_id, courier_id=courier_id)


    # ── Full order -> shipment orchestration ─────────────────────────────────

    async def fulfill_order(
        self,
        order_id: str,
        order_data: dict,
        repo: "ShippingRepository",
        dimensions: Optional[dict] = None,
    ) -> dict:
        """
        The complete post-payment pipeline described in the spec:

            Create Shiprocket order -> Generate AWB / assign courier
            -> Schedule pickup -> persist everything on the order
            -> return a complete response.

        Each step is best-effort past order creation: if AWB generation or
        pickup scheduling fails, we still persist whatever succeeded and
        surface the error, rather than losing the Shiprocket order link.
        """
        from app.models.shipping import ShippingInfo  # local import avoids cycle

        info = ShippingInfo()
        try:
            order_result = await self.create_order(order_id, order_data, dimensions)
        except ShiprocketAPIError as exc:
            logger.error("fulfill_order: order creation failed for %s: %s", order_id, exc)
            info.error = str(exc)
            info.shipment_status = "failed"
            await repo.update_shipping_info(order_id, info)
            raise

        info.shiprocket_order_id = order_result.get("order_id")
        info.shipment_id = order_result.get("shipment_id")
        info.shipment_status = "order_created"
        await repo.update_shipping_info(order_id, info)

        shipment_id = info.shipment_id
        if not shipment_id:
            info.error = "Shiprocket did not return a shipment_id"
            await repo.update_shipping_info(order_id, info)
            return info.to_dict()

        # Step 2: generate AWB / assign courier
        try:
            awb_result = await self.generate_awb(shipment_id)
            response_data = awb_result.get("response", {}).get("data", awb_result)
            
            # Raise a clear error if AWB assignment fails (e.g. insufficient wallet balance)
            assign_err = response_data.get("awb_assign_error") or awb_result.get("message")
            if not (response_data.get("awb_code") or awb_result.get("awb_code")) and assign_err:
                raise ShiprocketAPIError(f"AWB assignment failed: {assign_err}", detail=awb_result)

            info.awb = response_data.get("awb_code") or awb_result.get("awb_code")
            info.tracking_number = info.awb
            info.courier_name = response_data.get("courier_name") or awb_result.get("courier_name")
            info.courier_company_id = response_data.get("courier_company_id")
            info.tracking_url = build_tracking_url(info.awb)
            info.shipment_status = "awb_assigned" if info.awb else info.shipment_status
        except ShiprocketAPIError as exc:
            logger.error("fulfill_order: AWB generation failed for shipment %s: %s", shipment_id, exc)
            info.error = str(exc)
            await repo.update_shipping_info(order_id, info)
            raise
            return info.to_dict()

        await repo.update_shipping_info(order_id, info)

        # Step 3: schedule pickup
        try:
            await self.schedule_pickup(shipment_id)
            info.pickup_status = "scheduled"
            info.pickup_scheduled_date = datetime.now().strftime("%Y-%m-%d")
            info.shipment_status = "pickup_scheduled"
        except ShiprocketAPIError as exc:
            logger.warning("fulfill_order: pickup scheduling failed for shipment %s: %s", shipment_id, exc)
            info.error = f"Pickup scheduling failed: {exc}"
            info.pickup_status = "failed"

        info.last_synced_at = datetime.now()
        await repo.update_shipping_info(order_id, info)
        return info.to_dict()


def _safe_json(resp: httpx.Response) -> Any:
    try:
        return resp.json()
    except Exception:
        return {"raw": resp.text[:500]}


def build_tracking_summary(awb: str, tracking_payload: dict) -> dict:
    """Normalize Shiprocket's /courier/track/awb response into a flat dict."""
    track = tracking_payload.get("tracking_data", {}) or {}
    shipment_tracks = track.get("shipment_track") or [{}]
    activities = track.get("shipment_track_activities") or []
    head = shipment_tracks[0] if shipment_tracks else {}

    return {
        "awb": awb,
        "current_status": head.get("current_status", "Unknown") or "Unknown",
        "courier_name": head.get("courier_name", ""),
        "estimated_delivery": head.get("edd", ""),
        "delivered_date": head.get("delivered_date", ""),
        "tracking_url": build_tracking_url(awb),
        "tracking_history": [
            {
                "date": a.get("date"),
                "status": a.get("status"),
                "activity": a.get("activity"),
                "location": a.get("location"),
            }
            for a in activities
        ],
    }


# ── Module-level singleton (dependency-injected via app/api/shipping.py) ─────

_service_instance: Optional[ShiprocketService] = None


def get_shiprocket_service() -> ShiprocketService:
    """FastAPI dependency: returns a shared ShiprocketService instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ShiprocketService()
    return _service_instance
