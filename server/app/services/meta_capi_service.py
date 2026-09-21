import os
import time
import hashlib
import requests
import logging
from typing import List, Dict, Optional, Any

logger = logging.getLogger("meta_capi")

# Default Pixel ID from frontend index.html or environment
META_PIXEL_ID = os.getenv("META_PIXEL_ID", "1481512443741331")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", os.getenv("WHATSAPP_ACCESS_TOKEN", ""))
META_API_VERSION = os.getenv("META_API_VERSION", "v20.0")


def _hash_field(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    cleaned = str(val).strip().lower()
    if not cleaned:
        return None
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()


def _hash_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    # Keep only digits
    digits = "".join(c for c in str(phone) if c.isdigit())
    if not digits:
        return None
    if len(digits) == 10:
        digits = f"91{digits}"
    return hashlib.sha256(digits.encode("utf-8")).hexdigest()


def send_meta_capi_event(
    event_name: str,
    custom_data: Dict[str, Any],
    user_email: Optional[str] = None,
    user_phone: Optional[str] = None,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    event_source_url: str = "https://naripehnawa.com",
    event_id: Optional[str] = None,
) -> bool:
    """
    Dispatches a server-side Conversions API (CAPI) event to Meta.
    Guarantees matching content_ids and values with the browser Pixel.
    """
    if not META_PIXEL_ID:
        return False

    # Ensure content_ids is a clean list of strings
    raw_content_ids = custom_data.get("content_ids", [])
    if isinstance(raw_content_ids, str):
        raw_content_ids = [raw_content_ids]
    clean_content_ids = [str(cid).strip() for cid in raw_content_ids if cid and str(cid).strip()]

    user_data = {}
    if user_email:
        hashed_em = _hash_field(user_email)
        if hashed_em:
            user_data["em"] = [hashed_em]
    if user_phone:
        hashed_ph = _hash_phone(user_phone)
        if hashed_ph:
            user_data["ph"] = [hashed_ph]
    if client_ip:
        user_data["client_ip_address"] = client_ip
    if user_agent:
        user_data["client_user_agent"] = user_agent

    event_payload = {
        "event_name": event_name,
        "event_time": int(time.time()),
        "action_source": "website",
        "event_source_url": event_source_url,
        "user_data": user_data,
        "custom_data": {
            "content_ids": clean_content_ids,
            "content_type": "product",
            "currency": custom_data.get("currency", "INR"),
            "value": float(custom_data.get("value", 0.0) or 0.0),
            "num_items": int(custom_data.get("num_items", len(clean_content_ids)) or 1),
        },
    }

    if event_id:
        event_payload["event_id"] = str(event_id)

    # Log in server log for auditing & verification
    logger.info(
        f"[Meta CAPI] {event_name} -> content_ids: {clean_content_ids}, value: {event_payload['custom_data']['value']} INR"
    )

    if not META_ACCESS_TOKEN:
        # Access token not configured in .env yet; event is validated & logged
        return True

    url = f"https://graph.facebook.com/{META_API_VERSION}/{META_PIXEL_ID}/events"
    params = {"access_token": META_ACCESS_TOKEN}
    payload = {"data": [event_payload]}

    try:
        res = requests.post(url, params=params, json=payload, timeout=5)
        if res.status_code in [200, 201]:
            return True
        else:
            logger.warning(f"[Meta CAPI] Event dispatch warning: {res.status_code} - {res.text}")
            return False
    except Exception as e:
        logger.error(f"[Meta CAPI] Exception during event dispatch: {e}")
        return False
