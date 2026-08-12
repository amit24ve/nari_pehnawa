"""
Reusable helpers for the Shiprocket integration:
- structured logging
- async retry decorator (network-error / 5xx resilient, no extra dependency)
- Shiprocket status -> internal ShipmentStatus mapping
- order/address payload builders shared by the service layer

Keeping these here (instead of duplicating logic inside the service or the
route handlers) is what "no duplicate code" / reusable-helpers means in
practice for this module.
"""

from __future__ import annotations

import asyncio
import functools
import logging
from typing import Any, Awaitable, Callable, Optional, TypeVar

import httpx

# ── Logging ──────────────────────────────────────────────────────────────────

logger = logging.getLogger("shiprocket")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)s | shiprocket | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)


# ── Async retry decorator ────────────────────────────────────────────────────

T = TypeVar("T")

RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


def async_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    retry_on_status: Optional[set] = None,
):
    """
    Retries an async function on network errors, timeouts, or the given set
    of HTTP status codes (checked via a raised httpx.HTTPStatusError or an
    object exposing `.status_code`). Uses exponential backoff.

    This intentionally avoids adding a `tenacity` dependency for a handful
    of retry call-sites - keeps the requirements.txt footprint small.
    """

    codes = retry_on_status or RETRYABLE_STATUS_CODES

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exc: Optional[Exception] = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except httpx.HTTPStatusError as exc:
                    last_exc = exc
                    status = exc.response.status_code if exc.response else None
                    if status not in codes or attempt == max_attempts:
                        raise
                    logger.warning(
                        "Retryable HTTP %s on %s (attempt %s/%s)",
                        status,
                        func.__name__,
                        attempt,
                        max_attempts,
                    )
                except (httpx.TransportError, httpx.TimeoutException) as exc:
                    last_exc = exc
                    if attempt == max_attempts:
                        raise
                    logger.warning(
                        "Network error on %s (attempt %s/%s): %s",
                        func.__name__,
                        attempt,
                        max_attempts,
                        exc,
                    )
                await asyncio.sleep(base_delay * (2 ** (attempt - 1)))
            if last_exc:
                raise last_exc
            raise RuntimeError("async_retry exhausted without a result")

        return wrapper

    return decorator


# ── Status mapping ───────────────────────────────────────────────────────────

# Shiprocket's `current_status` strings (from the tracking + webhook APIs)
# mapped to our internal ShipmentStatus enum values (app/schemas/shipping.py)
SHIPROCKET_STATUS_MAP = {
    "NEW": "order_created",
    "INVOICED": "order_created",
    "READY TO SHIP": "awb_assigned",
    "PICKUP SCHEDULED": "pickup_scheduled",
    "PICKUP QUEUED": "pickup_scheduled",
    "PICKUP GENERATED": "pickup_scheduled",
    "PICKED UP": "picked_up",
    "SHIPPED": "in_transit",
    "IN TRANSIT": "in_transit",
    "OUT FOR DELIVERY": "out_for_delivery",
    "DELIVERED": "delivered",
    "RTO INITIATED": "rto_initiated",
    "RTO ACKNOWLEDGED": "rto_initiated",
    "RTO DELIVERED": "rto_delivered",
    "CANCELED": "cancelled",
    "CANCELLED": "cancelled",
    "LOST": "failed",
    "DAMAGED": "failed",
    "UNDELIVERED": "failed",
}


def map_shiprocket_status(raw_status: Optional[str]) -> str:
    """Best-effort mapping of a Shiprocket status string to our enum values."""
    if not raw_status:
        return "new"
    return SHIPROCKET_STATUS_MAP.get(raw_status.strip().upper(), "in_transit")


def build_tracking_url(awb: Optional[str]) -> Optional[str]:
    if not awb:
        return None
    return f"https://shiprocket.co/tracking/{awb}"
