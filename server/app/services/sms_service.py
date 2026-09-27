"""
MSG91 SMS & OTP Service for Indian E-Commerce (Nari Pehnawa)
Provides direct integration with MSG91 OTP API (/api/v5/otp) and Flow API (/api/v5/flow).
"""

import os
import requests
import socket
import logging

logger = logging.getLogger(__name__)

DEFAULT_MSG91_AUTHKEY = "571630Aktt8Nkq3uSh6ab87411P1"


def _ipv4_request(method: str, url: str, **kwargs):
    """Force outgoing socket to IPv4 (185.211.6.40) to match MSG91 IP whitelist."""
    try:
        import urllib3.util.connection as urllib3_cn
        urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
    except Exception:
        try:
            import requests.packages.urllib3.util.connection as urllib3_cn
            urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
        except Exception:
            pass
    return requests.request(method, url, **kwargs)


def send_otp_sms(phone_10: str, otp_code: str) -> dict:
    """
    Dispatch OTP SMS to Indian 10-digit mobile number using MSG91.
    """
    clean_phone = "".join(filter(str.isdigit, str(phone_10)))
    if len(clean_phone) == 12 and clean_phone.startswith("91"):
        clean_phone = clean_phone[2:]
    elif len(clean_phone) == 11 and clean_phone.startswith("0"):
        clean_phone = clean_phone[1:]

    logger.info(f"Dispatching OTP SMS to +91{clean_phone} (Code: {otp_code}) via MSG91")

    msg91_key = os.getenv("MSG91_AUTHKEY", DEFAULT_MSG91_AUTHKEY).strip()
    if not msg91_key:
        msg91_key = DEFAULT_MSG91_AUTHKEY

    res = _send_msg91(clean_phone, otp_code, msg91_key)
    if res.get("success"):
        return res

    logger.warning(f"MSG91 SMS delivery issue: {res}")
    # Always log OTP in server logs for audit and fallback verification
    logger.info(f"[SMS AUDIT] OTP for +91{clean_phone} is {otp_code}")
    return res


def _send_msg91(phone_10: str, otp_code: str, api_key: str) -> dict:
    """MSG91 Flow & OTP dispatch with IPv4 socket binding"""
    otp_template_id = os.getenv("MSG91_OTP_TEMPLATE_ID", "").strip()
    headers = {
        "authkey": api_key.strip(),
        "content-type": "application/json",
        "accept": "application/json"
    }

    # 1. Flow API (if specific template_id is configured)
    if otp_template_id:
        try:
            flow_url = "https://control.msg91.com/api/v5/flow"
            payload = {
                "template_id": otp_template_id,
                "short_url": "0",
                "recipients": [
                    {
                        "mobiles": f"91{phone_10}",
                        "OTP": str(otp_code)
                    }
                ]
            }
            r = _ipv4_request("POST", flow_url, headers=headers, json=payload, timeout=8)
            data = r.json() if "application/json" in r.headers.get("content-type", "") else {"text": r.text}
            if r.status_code == 200 and data.get("type") == "success":
                logger.info(f"MSG91 Flow OTP sent to {phone_10}: {data}")
                return {"success": True, "provider": "MSG91", "data": data}
        except Exception as e:
            logger.warning(f"MSG91 Flow failed: {e}")

    # 2. Direct MSG91 OTP API (/api/v5/otp)
    try:
        otp_url = "https://control.msg91.com/api/v5/otp"
        params = {
            "template_id": otp_template_id,
            "mobile": f"91{phone_10}",
            "otp": str(otp_code),
            "otp_expiry": "10",
            "otp_length": str(len(otp_code))
        }
        r2 = _ipv4_request("POST", otp_url, headers=headers, params=params, json={}, timeout=8)
        data2 = r2.json() if "application/json" in r2.headers.get("content-type", "") else {"text": r2.text}
        if r2.status_code == 200 and data2.get("type") == "success":
            logger.info(f"MSG91 OTP API sent successfully to {phone_10}: {data2}")
            return {"success": True, "provider": "MSG91", "data": data2}
        logger.warning(f"MSG91 OTP API returned: {data2}")
        return {"success": False, "provider": "MSG91", "error": data2}
    except Exception as e:
        logger.error(f"MSG91 OTP exception: {e}")
        return {"success": False, "provider": "MSG91", "error": str(e)}
