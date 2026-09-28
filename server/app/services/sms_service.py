"""
APITxT SMS & OTP Service for Indian E-Commerce (Nari Pehnawa)
Provides direct integration with APITxT:
- /api/sendOTP: SMS, WhatsApp, Voice OTP delivery (works with default system template or custom template_id)
- /api/sendMsg: Transactional order notifications (Order Placed, Shipped, Delivered, Cancelled)
- /api/balance: Wallet balance verification
"""

import logging
import os
from typing import Optional
import requests

logger = logging.getLogger(__name__)

DEFAULT_APITXT_AUTHKEY = "WcH5Bte6t91yK2flL7x_aoQyr0_Dek5pgPzREaPsei4"
APITXT_BASE_URL = "https://apitxt.com/api"


def normalize_phone_10(phone: str) -> str:
    """Normalize phone input to 10-digit Indian mobile number"""
    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits


def send_otp_sms(phone_10: str, otp_code: str, channel: str = "sms") -> dict:
    """
    Dispatch OTP to Indian 10-digit mobile number using APITxT /api/sendOTP.
    Supports channel='sms', 'whatsapp', or 'voice'.
    Works directly with APITxT system default template or custom template_id if configured.
    """
    clean_phone = normalize_phone_10(phone_10)
    auth_key = os.getenv("APITXT_AUTHKEY", DEFAULT_APITXT_AUTHKEY).strip() or DEFAULT_APITXT_AUTHKEY
    template_id = os.getenv("APITXT_OTP_TEMPLATE_ID", "").strip()

    logger.info(f"[APITxT] Dispatching OTP to +91{clean_phone} (Code: {otp_code}, Channel: {channel})")

    url = f"{APITXT_BASE_URL}/sendOTP"
    payload = {
        "authkey": auth_key,
        "mobile": f"91{clean_phone}",
        "otp": str(otp_code),
    }
    if template_id:
        payload["template_id"] = template_id
    if channel and channel.lower() != "sms":
        payload["channel"] = channel.lower()

    try:
        resp = requests.post(url, data=payload, timeout=10)
        data = resp.json() if "application/json" in resp.headers.get("content-type", "") else {"text": resp.text}

        if resp.status_code == 200 and data.get("status") == "success":
            logger.info(f"[APITxT] OTP successfully dispatched to +91{clean_phone}: {data}")
            return {"success": True, "provider": "APITxT", "data": data}
        else:
            logger.warning(f"[APITxT] OTP dispatch returned error (HTTP {resp.status_code}): {data}")
            return {"success": False, "provider": "APITxT", "error": data}
    except Exception as exc:
        logger.error(f"[APITxT] OTP dispatch exception: {exc}")
        return {"success": False, "provider": "APITxT", "error": str(exc)}
    finally:
        # Always audit log the OTP code for internal monitoring and troubleshooting
        logger.info(f"[APITxT OTP AUDIT] Mobile: +91{clean_phone} | Code: {otp_code}")


def send_transactional_sms(
    phone_10: str,
    message: str,
    template_id: Optional[str] = None,
    sender: Optional[str] = None,
    pe_id: Optional[str] = None,
    route: Optional[str] = None,
) -> dict:
    """
    Send transactional SMS via APITxT /api/sendMsg.
    """
    clean_phone = normalize_phone_10(phone_10)
    auth_key = os.getenv("APITXT_AUTHKEY", DEFAULT_APITXT_AUTHKEY).strip() or DEFAULT_APITXT_AUTHKEY
    sender_id = (sender or os.getenv("APITXT_SENDER", "")).strip()
    route_id = (route or os.getenv("APITXT_ROUTE", "4")).strip()
    template = (template_id or os.getenv("APITXT_TEMPLATE_ID", "")).strip()
    entity_id = (pe_id or os.getenv("APITXT_PE_ID", "NA")).strip() or "NA"

    logger.info(f"[APITxT] Sending transactional SMS to +91{clean_phone}")

    url = f"{APITXT_BASE_URL}/sendMsg"
    payload = {
        "authkey": auth_key,
        "mobiles": f"91{clean_phone}",
        "message": message,
        "sender": sender_id,
        "route": route_id,
        "template_id": template,
        "pe_id": entity_id,
    }

    try:
        resp = requests.post(url, data=payload, timeout=10)
        data = resp.json() if "application/json" in resp.headers.get("content-type", "") else {"text": resp.text}

        if resp.status_code == 200 and data.get("status") in ("success", 200):
            logger.info(f"[APITxT] Message sent to +91{clean_phone}: {data}")
            return {"success": True, "provider": "APITxT", "data": data}
        else:
            logger.warning(f"[APITxT] Message dispatch error (HTTP {resp.status_code}): {data}")
            return {"success": False, "provider": "APITxT", "error": data}
    except Exception as exc:
        logger.error(f"[APITxT] Message dispatch exception: {exc}")
        return {"success": False, "provider": "APITxT", "error": str(exc)}


def get_wallet_balance() -> dict:
    """Check account wallet balance on APITxT"""
    auth_key = os.getenv("APITXT_AUTHKEY", DEFAULT_APITXT_AUTHKEY).strip() or DEFAULT_APITXT_AUTHKEY
    try:
        r = requests.get(f"{APITXT_BASE_URL}/balance?authkey={auth_key}", timeout=6)
        return r.json()
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
