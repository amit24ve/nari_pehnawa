"""
Unified Multi-Provider SMS & OTP Service for Indian E-Commerce
Supports:
1. Fast2SMS (India - Quick OTP / DLT SMS)
2. 2Factor.in (India - Dedicated OTP Gateway)
3. MSG91 (India - Flow / OTP API)
"""

import os
import requests
import socket
import logging

logger = logging.getLogger(__name__)

# Force IPv4 helper for providers with IP filters
def _ipv4_request(method: str, url: str, **kwargs):
    try:
        import requests.packages.urllib3.util.connection as urllib3_cn
        urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
    except Exception:
        pass
    return requests.request(method, url, **kwargs)


def send_otp_sms(phone_10: str, otp_code: str) -> dict:
    """
    Dispatch OTP SMS to Indian 10-digit mobile number using configured SMS provider.
    Tries providers in configured order with graceful fallback.
    """
    clean_phone = "".join(filter(str.isdigit, str(phone_10)))
    if len(clean_phone) == 12 and clean_phone.startswith("91"):
        clean_phone = clean_phone[2:]
    elif len(clean_phone) == 11 and clean_phone.startswith("0"):
        clean_phone = clean_phone[1:]

    # ── 1. MSG91 (Primary Provider) ──────────────────────────────────────────
    msg91_key = os.getenv("MSG91_AUTHKEY", "571630Aktt8Nkq3uSh6ab87411P1")
    if msg91_key:
        res = _send_msg91(clean_phone, otp_code, msg91_key)
        if res.get("success"):
            return res
        logger.warning(f"MSG91 failed: {res}")

    return {"success": False, "message": "Failed to dispatch SMS via MSG91"}


def _send_fast2sms(phone_10: str, otp_code: str, api_key: str) -> dict:
    """Fast2SMS Quick OTP / DLT endpoint (fast2sms.com)"""
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": api_key.strip(),
        "Content-Type": "application/json"
    }
    
    # Try Fast2SMS OTP Route
    payload = {
        "variables_values": str(otp_code),
        "route": "otp",
        "numbers": phone_10
    }
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=8)
        data = r.json()
        if r.status_code == 200 and data.get("return") is True:
            logger.info(f"Fast2SMS OTP sent successfully to {phone_10}: {data}")
            return {"success": True, "provider": "Fast2SMS", "data": data}
        
        # Fallback to Quick SMS route if OTP route template not set
        payload_quick = {
            "message": f"Your Nari Pehnawa login verification code is {otp_code}. Valid for 10 minutes. Please do not share this OTP.",
            "language": "english",
            "route": "q",
            "numbers": phone_10
        }
        r2 = requests.post(url, headers=headers, json=payload_quick, timeout=8)
        data2 = r2.json()
        if r2.status_code == 200 and data2.get("return") is True:
            logger.info(f"Fast2SMS Quick SMS sent successfully to {phone_10}: {data2}")
            return {"success": True, "provider": "Fast2SMS", "data": data2}

        return {"success": False, "provider": "Fast2SMS", "error": data}
    except Exception as e:
        logger.error(f"Fast2SMS exception: {e}")
        return {"success": False, "provider": "Fast2SMS", "error": str(e)}


def _send_2factor(phone_10: str, otp_code: str, api_key: str) -> dict:
    """2Factor.in dedicated Indian OTP endpoint (2factor.in)"""
    url = f"https://2factor.in/API/V1/{api_key.strip()}/SMS/{phone_10}/{otp_code}/OTP1"
    try:
        r = requests.get(url, timeout=8)
        data = r.json()
        if r.status_code == 200 and data.get("Status") == "Success":
            logger.info(f"2Factor OTP sent successfully to {phone_10}: {data}")
            return {"success": True, "provider": "2Factor", "data": data}
        return {"success": False, "provider": "2Factor", "error": data}
    except Exception as e:
        logger.error(f"2Factor exception: {e}")
        return {"success": False, "provider": "2Factor", "error": str(e)}


def _send_msg91(phone_10: str, otp_code: str, api_key: str) -> dict:
    """MSG91 Flow & OTP dispatch"""
    otp_template_id = os.getenv("MSG91_OTP_TEMPLATE_ID", "6ab7c339fac81f8c28075912")
    headers = {
        "authkey": api_key.strip(),
        "content-type": "application/json",
        "accept": "application/json"
    }

    # 1. Flow API
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
        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"text": r.text}
        if r.status_code == 200 and data.get("type") == "success":
            logger.info(f"MSG91 Flow OTP sent to {phone_10}")
            return {"success": True, "provider": "MSG91", "data": data}
    except Exception as e:
        logger.warning(f"MSG91 Flow failed: {e}")

    # 2. OTP API
    try:
        otp_url = "https://control.msg91.com/api/v5/otp"
        params = {
            "authkey": api_key.strip(),
            "template_id": otp_template_id,
            "mobile": f"91{phone_10}",
            "otp": otp_code,
            "otp_expiry": "10",
            "otp_length": str(len(otp_code))
        }
        r2 = _ipv4_request("POST", otp_url, headers=headers, params=params, json={}, timeout=8)
        data2 = r2.json() if r2.headers.get("content-type", "").startswith("application/json") else {"text": r2.text}
        if r2.status_code == 200 and data2.get("type") == "success":
            return {"success": True, "provider": "MSG91", "data": data2}
        return {"success": False, "provider": "MSG91", "error": data2}
    except Exception as e:
        return {"success": False, "provider": "MSG91", "error": str(e)}
