from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from app.database import get_database
from app.security import verify_password, create_access_token
from app.services.mobile_session_service import issue_refresh
from typing import Optional
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from urllib.parse import urlencode
import requests
import re
import base64
import json

from app.config import (
    google_client_id,
    google_client_secret,
    google_redirect_uri,
    frontend_url,
)

router = APIRouter(prefix="/auth", tags=["Auth"])
from app.routes import google_mobile
router.include_router(google_mobile.router)


class PhoneSendOTPRequest(BaseModel):
    phone: str


class PhoneVerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    email: Optional[str] = None


class PhoneResendOTPRequest(BaseModel):
    phone: str


def normalize_indian_phone(phone: str) -> str:
    """Normalize phone number to 10-digit Indian mobile number"""
    digits = "".join(c for c in str(phone) if c.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits


@router.post("/phone/send-otp")
def phone_send_otp(request: PhoneSendOTPRequest):
    """Send mobile verification OTP via APITxT for Phone Login / Registration"""
    import random
    from datetime import datetime, timedelta

    phone_clean = normalize_indian_phone(request.phone)
    if not phone_clean or len(phone_clean) != 10:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid 10-digit Indian mobile number."
        )

    db = get_database()
    otps = db["otps"]
    users = db["users"]

    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(minutes=10)

    # Store OTP record in Mongo
    otps.delete_many({"phone": phone_clean})
    otps.insert_one({
        "phone": phone_clean,
        "otp": otp_code,
        "expires_at": expires_at,
        "created_at": now_utc
    })

    # Dispatch via APITxT SMS Provider
    from app.services.sms_service import send_otp_sms
    sms_res = send_otp_sms(phone_clean, otp_code)

    # Check if this phone number belongs to existing user or seller
    user = users.find_one({"$or": [{"phone": phone_clean}, {"phone": f"+91{phone_clean}"}, {"phone": f"91{phone_clean}"}]})
    seller = db["sellers"].find_one({"$or": [{"phone": phone_clean}, {"phone": f"+91{phone_clean}"}, {"phone": f"91{phone_clean}"}]})
    is_existing_user = (user is not None) or (seller is not None)
    display_name = (seller.get("name") if seller else None) or (user.get("name") if user else None)

    return {
        "success": True,
        "message": f"6-digit OTP sent successfully to +91 {phone_clean}",
        "phone": phone_clean,
        "is_existing_user": is_existing_user,
        "name": display_name,
        "sms_provider": sms_res.get("provider", "APITxT")
    }


@router.post("/phone/resend-otp")
def phone_resend_otp(request: PhoneResendOTPRequest):
    """Resend OTP via APITxT SMS Provider"""
    import random
    from datetime import datetime, timedelta, timezone

    phone_clean = normalize_indian_phone(request.phone)
    if not phone_clean or len(phone_clean) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number.")

    db = get_database()
    otps = db["otps"]

    # Generate fresh OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(minutes=10)

    otps.delete_many({"phone": phone_clean})
    otps.insert_one({
        "phone": phone_clean,
        "otp": otp_code,
        "expires_at": expires_at,
        "created_at": now_utc
    })

    # Dispatch via APITxT SMS Provider
    from app.services.sms_service import send_otp_sms
    send_otp_sms(phone_clean, otp_code)

    return {
        "success": True,
        "message": f"Fresh OTP code sent to +91 {phone_clean}"
    }


@router.post("/phone/verify-otp")
def phone_verify_otp(request: PhoneVerifyOTPRequest):
    """Verify phone OTP and log in or auto-register user"""
    phone_clean = normalize_indian_phone(request.phone)
    otp_input = request.otp.strip()

    if not phone_clean or len(phone_clean) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number.")

    if not otp_input:
        raise HTTPException(status_code=400, detail="Please enter the OTP code.")

    db = get_database()
    otps = db["otps"]
    users = db["users"]

    now_utc = datetime.now(timezone.utc)
    today_ist = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")

    # 1. Check local Mongo OTP record
    otp_record = otps.find_one({"phone": phone_clean, "otp": otp_input})
    is_valid_db = False
    if otp_record:
        exp = otp_record.get("expires_at")
        if isinstance(exp, datetime):
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp >= now_utc:
                is_valid_db = True
        otps.delete_one({"_id": otp_record["_id"]})

    if not is_valid_db:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code. Please try again.")

    # OTP is valid! Find or auto-create customer account
    user = users.find_one({
        "$or": [
            {"phone": phone_clean},
            {"phone": f"+91{phone_clean}"},
            {"phone": f"91{phone_clean}"}
        ]
    })

    is_new_user = False
    if not user:
        # Check if optional email was provided by customer
        custom_email = request.email.strip().lower() if (request.email and "@" in request.email) else None
        user_by_email = users.find_one({"email": custom_email}) if custom_email else None
        
        if user_by_email:
            # Link phone to existing account
            users.update_one(
                {"_id": user_by_email["_id"]},
                {"$set": {"phone": phone_clean, "is_phone_verified": True, "last_login": today_ist}}
            )
            user = users.find_one({"_id": user_by_email["_id"]})
        else:
            # Create new user with complete customer schema
            user_name = request.name.strip() if request.name and request.name.strip() else None
            if not user_name:
                raise HTTPException(
                    status_code=400,
                    detail="Please enter your Full Name."
                )

            is_new_user = True
            new_user_data = {
                "phone": phone_clean,
                "name": user_name,
                "role": "customer",
                "is_admin": False,
                "status": "active",
                "auth_provider": "phone_otp",
                "is_phone_verified": True,
                "is_email_verified": bool(custom_email),
                "joined_date": today_ist,
                "last_login": today_ist,
                "orders_count": 0,
                "coins_balance": 0,
                "coins_earned_total": 0,
                "coins_spent_total": 0,
                "addresses": [],
                "created_at": now_utc
            }
            if custom_email:
                new_user_data["email"] = custom_email
            res = users.insert_one(new_user_data)
            user = users.find_one({"_id": res.inserted_id})
    else:
        # Existing user - update phone verified and last login
        update_fields = {
            "phone": phone_clean,
            "is_phone_verified": True,
            "last_login": today_ist
        }
        if request.name and request.name.strip() and (user.get("name") in [None, "", f"User {phone_clean[-4:]}"]):
            update_fields["name"] = request.name.strip()
        if request.email and "@" in request.email and not user.get("email"):
            update_fields["email"] = request.email.strip().lower()

        users.update_one({"_id": user["_id"]}, {"$set": update_fields})
        user = users.find_one({"_id": user["_id"]})

    # Check if this phone number or email belongs to a registered merchant seller
    seller_match = db["sellers"].find_one({
        "$or": [
            {"phone": phone_clean},
            {"email": (user.get("email") or "").strip().lower() if user and user.get("email") else "NONE_MATCH"}
        ]
    })
    is_seller = bool(seller_match or (user and user.get("role") == "seller") or (user and user.get("is_seller")))
    role = "seller" if is_seller else user.get("role", "customer")
    is_admin = bool((user and user.get("is_admin")) or role == "admin")

    # Issue JWT token
    token = create_access_token({
        "sub": str(seller_match["_id"]) if (seller_match and is_seller) else str(user["_id"]),
        "phone": phone_clean,
        "email": user.get("email") or (seller_match.get("email") if seller_match else None),
        "role": role,
        "is_seller": is_seller,
        "token_version": (seller_match or user).get("token_version", 1)
    })

    orders_cnt = db["orders"].count_documents({
        "$or": [
            {"user_id": str(user["_id"])},
            {"customer_email": user.get("email")},
            {"email": user.get("email")},
            {"phone": phone_clean},
            {"customer_phone": phone_clean}
        ]
    })

    user_out = {
        "id": str(seller_match["_id"]) if (seller_match and is_seller) else str(user["_id"]),
        "phone": phone_clean,
        "email": user.get("email") or (seller_match.get("email") if seller_match else None),
        "name": user.get("name") or (seller_match.get("name") if seller_match else "User"),
        "role": role,
        "is_seller": is_seller,
        "is_admin": is_admin,
        "orders_count": orders_cnt
    }

    seller_out = None
    if is_seller and seller_match:
        seller_out = {
            "id": str(seller_match["_id"]),
            "email": seller_match.get("email"),
            "name": seller_match.get("name"),
            "shop_name": seller_match.get("shop_name", "My Store"),
            "city": seller_match.get("city"),
            "state": seller_match.get("state"),
            "kyc_status": seller_match.get("kyc_status", "pending"),
            "role": "seller",
            "is_seller": True
        }

    return {
        "success": True,
        "access_token": token,
        "refresh_token": issue_refresh(db, user["_id"]) if user.get("role", "customer") == "customer" else None,
        "token_type": "bearer",
        "is_new_user": is_new_user,
        "role": role,
        "is_seller": is_seller,
        "redirect_url": "/seller/dashboard" if is_seller else ("/admin/dashboard" if is_admin else None),
        "user": user_out,
        "seller": seller_out
    }


class LoginRequest(BaseModel):
    email: str  # Can be email or 10-digit mobile number
    password: str


class SendOTPRequest(BaseModel):
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    otp: Optional[str] = None



class ForgotPasswordSendOTPRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


@router.get("/check-email")
def check_email(email: str):
    """Check if an email already exists in the database"""
    if not email or "@" not in email:
        return {"exists": False}
    db = get_database()
    users = db["users"]
    normalized_email = email.strip().lower()
    user = users.find_one({"email": {"$regex": f"^{normalized_email}$", "$options": "i"}})
    return {"exists": user is not None}


@router.post("/send-otp")
def send_otp(request: SendOTPRequest):
    """Send verification OTP to email during registration"""
    import random
    from datetime import datetime, timedelta
    from app.services.notification_service import NotificationService

    db = get_database()
    users = db["users"]

    # Check if user already exists
    if users.find_one({"email": request.email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(minutes=10)

    # Store OTP in DB
    otps = db["otps"]
    otps.delete_many({"email": request.email})
    otps.insert_one({
        "email": request.email,
        "otp": otp_code,
        "expires_at": expires_at,
        "created_at": now_utc
    })

    # Send Email via NotificationService
    notif = NotificationService(db)
    subject = "Your Nari Pehnawa Verification Code"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #8B0000; margin: 0;">Nari Pehnawa</h2>
            <p style="color: #666; font-size: 14px;">Email Verification Code</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Your 6-digit verification code is:</p>
            <h1 style="color: #8B0000; letter-spacing: 5px; margin: 0; font-size: 32px;">{otp_code}</h1>
            <p style="margin: 10px 0 0 0; color: #888; font-size: 12px;">Valid for 10 minutes</p>
        </div>
        <p style="color: #555; font-size: 13px; line-height: 1.5;">Please enter this code on the registration screen to verify your email and complete account setup.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px; text-align: center;">If you did not request this code, please ignore this email.</p>
    </div>
    """
    sent = notif.send_custom_email(
        to_email=request.email,
        subject=subject,
        body=html_body,
        is_html=True,
        event_name="email_otp_sent"
    )

    return {
        "success": True,
        "message": f"Verification code sent to {request.email}"
    }


@router.post("/forgot-password/send-otp")
def forgot_password_send_otp(request: ForgotPasswordSendOTPRequest):
    """Send reset password OTP directly to user's registered email via Gmail SMTP"""
    import random
    import re
    from datetime import datetime, timedelta, timezone
    from app.services.notification_service import NotificationService

    db = get_database()
    users = db["users"]
    clean_email = request.email.strip().lower()
    escaped = re.escape(clean_email)
    pattern = f"^{escaped}$"

    # Check if user exists in users or sellers collection
    user = users.find_one({"email": {"$regex": pattern, "$options": "i"}})
    if not user:
        seller = db["sellers"].find_one({"email": {"$regex": pattern, "$options": "i"}})
        if seller:
            user = seller

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email address. Please check your spelling or register."
        )

    # Generate secure 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(minutes=10)

    # Store OTP in DB (case-insensitive email matching)
    otps = db["otps"]
    otps.delete_many({"email": {"$regex": pattern, "$options": "i"}})
    otps.insert_one({
        "email": clean_email,
        "otp": otp_code,
        "expires_at": expires_at,
        "created_at": now_utc
    })

    # Send Email via NotificationService
    notif = NotificationService(db)
    subject = "Your Nari Pehnawa Password Reset Code"
    recipient_name = user.get("name") or user.get("full_name") or "Valued Customer"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #faf7f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e8dfc8;">
            <div style="background: linear-gradient(135deg, #4A0A19 0%, #780016 100%); padding: 28px 24px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.15em; font-family: Georgia, serif;">NARI PEHNAWA</h1>
                <p style="margin: 6px 0 0 0; color: #f5d082; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">Authentic Handcrafted Ethnic Fashion</p>
            </div>
            <div style="padding: 32px 28px;">
                <h2 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">Password Reset Request</h2>
                <p style="margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.6;">Hello <strong>{recipient_name}</strong>,</p>
                <p style="margin: 0 0 24px 0; color: #555555; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your Nari Pehnawa account. Use the 6-digit verification code below to verify your email and complete your password reset:</p>
                
                <div style="background-color: #faf7f2; border: 2px dashed #c59b27; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #780016; font-weight: 700; margin-bottom: 8px;">Your Verification Code</span>
                    <span style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #780016; font-family: 'Courier New', Courier, monospace;">{otp_code}</span>
                    <span style="display: block; font-size: 12px; color: #888888; margin-top: 8px;">⏱ Valid for 10 minutes</span>
                </div>

                <p style="margin: 0 0 16px 0; color: #666666; font-size: 13px; line-height: 1.5;">Please enter this code on the password reset screen to set your new password. For security reasons, never share this code with anyone.</p>
                
                <div style="border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 28px;">
                    <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">If you did not request this password reset, you can safely ignore this email — your account remains secure and no changes have been made.</p>
                </div>
            </div>
            <div style="background-color: #f5f5f5; padding: 14px 24px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; color: #888888; font-size: 11px;">© 2026 Nari Pehnawa. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    sent = notif.send_custom_email(
        to_email=clean_email,
        subject=subject,
        body=html_body,
        is_html=True,
        event_name="password_reset_otp_sent"
    )

    if not sent:
        raise HTTPException(
            status_code=500,
            detail="Unable to dispatch reset email. Please ensure your email is correct or try again in a few minutes."
        )

    return {
        "success": True,
        "message": f"A 6-digit verification code has been sent to {clean_email}. Please check your inbox and spam folder."
    }


@router.post("/forgot-password/reset")
def forgot_password_reset(request: ForgotPasswordResetRequest):
    """Verify OTP and reset password"""
    import re
    from app.security import get_password_hash
    from datetime import datetime, timezone

    db = get_database()
    users = db["users"]
    otps = db["otps"]
    clean_email = request.email.strip().lower()
    escaped = re.escape(clean_email)
    pattern = f"^{escaped}$"

    # Verify user exists in users or sellers
    user = users.find_one({"email": {"$regex": pattern, "$options": "i"}})
    is_seller_only = False
    if not user:
        seller = db["sellers"].find_one({"email": {"$regex": pattern, "$options": "i"}})
        if seller:
            user = seller
            is_seller_only = True

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    # Verify OTP
    otp_record = otps.find_one({
        "email": {"$regex": pattern, "$options": "i"},
        "otp": request.otp.strip()
    })
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check the code sent to your email.")

    now_utc = datetime.now(timezone.utc)
    exp = otp_record.get("expires_at")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now_utc:
            raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    # OTP is valid — delete used OTP record
    otps.delete_one({"_id": otp_record["_id"]})

    # Update password_hash, password_changed_at and increment token_version
    now_utc = datetime.now(timezone.utc)
    current_ver = user.get("token_version") or 1
    new_hash = get_password_hash(request.new_password)
    users.update_one(
        {"email": {"$regex": pattern, "$options": "i"}},
        {
            "$set": {
                "password_hash": new_hash,
                "password_changed_at": now_utc,
                "token_version": current_ver + 1
            }
        }
    )
    db["sellers"].update_many(
        {"email": {"$regex": pattern, "$options": "i"}},
        {
            "$set": {
                "password_hash": new_hash,
                "password_changed_at": now_utc,
                "token_version": current_ver + 1
            }
        }
    )
    db["mobile_refresh_sessions"].delete_many({"user_id": str(user["_id"])})

    return {
        "success": True,
        "message": "Password has been successfully reset. You can now log in."
    }


@router.post("/login")
def login(request: LoginRequest):
    """Login endpoint - returns access token and user info (Unified login for Customers, Admins, and Sellers)"""
    db = get_database()
    users = db["users"]
    email_clean = request.email.strip()
    escaped = re.escape(email_clean)
    email_pattern = f"^{escaped}$"
    phone_clean = normalize_indian_phone(email_clean)

    query_or = [
        {"email": {"$regex": email_pattern, "$options": "i"}},
        {"phone": email_clean},
        {"name": {"$regex": email_pattern, "$options": "i"}},
        {"full_name": {"$regex": email_pattern, "$options": "i"}},
    ]
    if phone_clean and len(phone_clean) == 10:
        query_or.append({"phone": phone_clean})
    if email_clean.lower() in ("admin", "administrator"):
        query_or.append({"role": "admin"})
        query_or.append({"is_admin": True})
        query_or.append({"email": "admin@naripehnawa.com"})

    user = users.find_one({"$or": query_or})
    seller = db["sellers"].find_one({"$or": query_or})

    # Case 1: Account registered as a Seller
    if seller and not user:
        hashed_s = seller.get("password_hash")
        plain_s = seller.get("password")
        valid_s = False
        if hashed_s and verify_password(request.password, hashed_s):
            valid_s = True
        elif plain_s and str(plain_s).strip() == str(request.password).strip():
            valid_s = True
            try:
                new_h = get_password_hash(request.password)
                db["sellers"].update_one({"_id": seller["_id"]}, {"$set": {"password_hash": new_h}, "$unset": {"password": ""}})
            except Exception:
                pass
        elif hashed_s and str(hashed_s).strip() == str(request.password).strip():
            valid_s = True
            try:
                new_h = get_password_hash(request.password)
                db["sellers"].update_one({"_id": seller["_id"]}, {"$set": {"password_hash": new_h}})
            except Exception:
                pass

        if not valid_s:
            raise HTTPException(
                status_code=401,
                detail="Incorrect password for seller account. Please try again."
            )
        if seller.get("status") == "suspended":
            raise HTTPException(
                status_code=403,
                detail="Your seller merchant account has been suspended. Please contact Admin."
            )

        token = create_access_token({
            "sub": str(seller["_id"]),
            "email": seller["email"],
            "role": "seller",
            "token_version": seller.get("token_version", 1)
        })
        seller_out = {
            "id": str(seller["_id"]),
            "email": seller["email"],
            "name": seller.get("name"),
            "shop_name": seller.get("shop_name", "My Store"),
            "city": seller.get("city"),
            "state": seller.get("state"),
            "kyc_status": seller.get("kyc_status", "pending"),
            "role": "seller"
        }
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "seller",
            "is_seller": True,
            "redirect_url": "/seller/dashboard",
            "user": seller_out,
            "seller": seller_out
        }

    # Case 2: No user and no seller
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password. Please check your credentials or register."
        )

    # Case 3: User found - verify password
    hashed = user.get("password_hash")
    plain = user.get("password")
    user_password_valid = False

    if hashed and verify_password(request.password, hashed):
        user_password_valid = True
    elif plain and str(plain).strip() == str(request.password).strip():
        user_password_valid = True
        try:
            new_h = get_password_hash(request.password)
            users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": new_h}, "$unset": {"password": ""}})
        except Exception:
            pass
    elif hashed and str(hashed).strip() == str(request.password).strip():
        user_password_valid = True
        try:
            new_h = get_password_hash(request.password)
            users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": new_h}})
        except Exception:
            pass

    if not user_password_valid:
        # Also check if seller password matches
        if seller:
            s_hashed = seller.get("password_hash")
            s_plain = seller.get("password")
            if (s_hashed and verify_password(request.password, s_hashed)) or (s_plain and str(s_plain).strip() == str(request.password).strip()) or (s_hashed and str(s_hashed).strip() == str(request.password).strip()):
                token = create_access_token({
                    "sub": str(seller["_id"]),
                    "email": seller["email"],
                    "role": "seller",
                    "token_version": seller.get("token_version", 1)
                })
                seller_out = {
                    "id": str(seller["_id"]),
                    "email": seller["email"],
                    "name": seller.get("name"),
                    "shop_name": seller.get("shop_name", "My Store"),
                    "city": seller.get("city"),
                    "state": seller.get("state"),
                    "kyc_status": seller.get("kyc_status", "pending"),
                    "role": "seller"
                }
                return {
                    "access_token": token,
                    "token_type": "bearer",
                    "role": "seller",
                    "is_seller": True,
                    "redirect_url": "/seller/dashboard",
                    "user": seller_out,
                    "seller": seller_out
                }

        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again or reset your password."
        )

    # If the user is also registered as a seller or role == "seller"
    if seller or user.get("role") == "seller":
        seller_id = str(seller["_id"]) if seller else str(user["_id"])
        token = create_access_token({
            "sub": seller_id,
            "email": user.get("email"),
            "role": "seller",
            "token_version": (seller or user).get("token_version", 1)
        })
        seller_out = {
            "id": seller_id,
            "email": user.get("email"),
            "name": user.get("name"),
            "shop_name": seller.get("shop_name") if seller else user.get("name"),
            "role": "seller"
        }
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "seller",
            "is_seller": True,
            "redirect_url": "/seller/dashboard",
            "user": seller_out,
            "seller": seller_out
        }

    # Case 4: Normal Customer or Admin
    is_admin = bool(user.get("is_admin") or user.get("role") in ("admin", "super_admin"))
    role = "admin" if is_admin else user.get("role", "customer")
    token = create_access_token({
        "sub": str(user.get("_id")),
        "email": user.get("email"),
        "role": role,
        "is_admin": is_admin,
        "token_version": user.get("token_version", 1)
    })

    # Prepare user response
    orders_cnt = db["orders"].count_documents({
        "$or": [{"user_id": str(user.get("_id"))}, {"customer_email": user.get("email")}, {"email": user.get("email")}]
    })
    user_out = {
        "id": str(user.get('_id')),
        "email": user.get('email'),
        "name": user.get('name'),
        "role": role,
        "is_admin": is_admin,
        "orders_count": orders_cnt
    }

    return {
        "access_token": token,
        "refresh_token": issue_refresh(db, user["_id"]) if not is_admin and role == "customer" else None,
        "token_type": "bearer",
        "role": role,
        "is_admin": is_admin,
        "redirect_url": "/admin/dashboard" if is_admin else None,
        "user": user_out
    }


@router.post("/register")
def register(request: RegisterRequest):
    """Register new user endpoint (supports direct signup or email OTP verification)"""
    from app.security import get_password_hash
    from datetime import datetime

    if not request.name or not request.name.strip():
        raise HTTPException(status_code=400, detail="Please enter your Full Name. Name is mandatory.")

    db = get_database()
    users = db["users"]
    otps = db["otps"]

    # Check if user already exists
    existing_user = users.find_one({"email": request.email.strip().lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

    # Verify OTP if provided
    if request.otp and request.otp.strip():
        otp_record = otps.find_one({"email": request.email.strip().lower(), "otp": request.otp.strip()})
        if not otp_record:
            raise HTTPException(status_code=400, detail="Invalid verification OTP code.")

        now_utc = datetime.now(timezone.utc)
        exp = otp_record.get("expires_at")
        if isinstance(exp, datetime):
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now_utc:
                raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

        # Delete used OTP record
        otps.delete_one({"_id": otp_record["_id"]})

    now_utc = datetime.now(timezone.utc)
    today_ist = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")

    phone_clean = normalize_indian_phone(request.phone) if request.phone else None
    if phone_clean:
        existing_phone = users.find_one({"phone": phone_clean})
        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail="An account with this mobile number already exists. Please log in with your email or mobile number."
            )

    # Create new user
    user_data = {
        "email": request.email.strip().lower(),
        "name": request.name.strip(),
        "phone": phone_clean or "",
        "password_hash": get_password_hash(request.password),
        "role": "customer",
        "is_admin": False,
        "is_email_verified": True,
        "auth_provider": "email_password",
        "token_version": 1,
        "created_at": now_utc,
        "joined_date": today_ist,
        "last_login": today_ist,
        "orders_count": 0,
        "coins_balance": 0,
        "coins_earned_total": 0,
        "coins_spent_total": 0,
        "addresses": []
    }

    result = users.insert_one(user_data)

    # Create access token
    token = create_access_token({
        "sub": str(result.inserted_id),
        "email": request.email.strip().lower(),
        "role": "customer",
        "token_version": 1
    })

    # Prepare user response
    user_out = {
        "id": str(result.inserted_id),
        "email": request.email.strip().lower(),
        "name": request.name.strip(),
        "phone": phone_clean or "",
        "role": "customer"
    }

    return {
        "access_token": token,
        "refresh_token": issue_refresh(db, result.inserted_id),
        "token_type": "bearer",
        "user": user_out
    }


# ══════════════════════════════════════════════════════════════════════════
#  Google Sign-In (customer login only — never issues admin access)
#
#  Flow:
#   1. Frontend sends the browser to  GET /auth/google/login
#   2. Google shows its consent screen, then redirects the browser to
#      GOOGLE_REDIRECT_URI (this API's  GET /auth/google/callback)
#      with a `code` query param.
#   3. This API exchanges that code for the user's Google profile,
#      finds-or-creates a "customer" account, then redirects the
#      browser to  {FRONTEND_URL}/auth/google/success?token=<jwt>
#   4. The frontend reads `token` from the URL and logs the user in.
# ══════════════════════════════════════════════════════════════════════════

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


ALLOWED_FRONTEND_ORIGINS = {
    "https://naripehnawa.com",
    "https://www.naripehnawa.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:2300",
}


@router.get("/google/login")
def google_login(origin: Optional[str] = None):
    """Redirects the browser to Google's OAuth consent screen."""
    if not google_client_id:
        raise HTTPException(
            status_code=500,
            detail="Google login is not configured (missing GOOGLE_CLIENT_ID)",
        )

    # Determine safe origin to preserve through OAuth state
    default_origin = (frontend_url or "https://naripehnawa.com").rstrip("/")
    target_origin = default_origin
    if origin and origin.rstrip("/") in ALLOWED_FRONTEND_ORIGINS:
        target_origin = origin.rstrip("/")

    state_data = json.dumps({"origin": target_origin})
    state_param = f"web_{base64.urlsafe_b64encode(state_data.encode()).decode()}"

    params = {
        "client_id": google_client_id,
        "redirect_uri": google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
        "state": state_param,
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
def google_callback(code: Optional[str] = None, error: Optional[str] = None, state: Optional[str] = None):
    """Handles Google's redirect back, logs the user in (or auto-creates
    a new "customer" account), then redirects to the frontend with a
    ready-to-use access token. Google sign-in can NEVER log in or create
    an admin account — admins must still use the password login."""

    if state and state.startswith("mobile_"):
        return google_mobile.callback(state, code, error)

    # Resolve target frontend URL from OAuth state parameter
    target_frontend = (frontend_url or "https://naripehnawa.com").rstrip("/")
    if state and state.startswith("web_"):
        try:
            raw_json = base64.urlsafe_b64decode(state[4:].encode()).decode()
            data = json.loads(raw_json)
            req_origin = data.get("origin", "").rstrip("/")
            if req_origin in ALLOWED_FRONTEND_ORIGINS:
                target_frontend = req_origin
        except Exception:
            pass

    def fail(reason: str):
        return RedirectResponse(f"{target_frontend}/auth/google/success?error={reason}")

    if error or not code:
        return fail("google_auth_cancelled")

    # 1) Exchange the authorization code for tokens
    token_res = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "redirect_uri": google_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if not token_res.ok:
        return fail("google_token_exchange_failed")
    google_access_token = token_res.json().get("access_token")

    # 2) Fetch the user's Google profile
    profile_res = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {google_access_token}"},
        timeout=10,
    )
    if not profile_res.ok:
        return fail("google_profile_fetch_failed")
    profile = profile_res.json()

    email = profile.get("email")
    if not email:
        return fail("google_email_missing")
    name = profile.get("name") or email.split("@")[0]
    picture = profile.get("picture")
    google_id = profile.get("sub")

    db = get_database()
    users = db["users"]
    user = users.find_one({"email": email})

    now_utc = datetime.now(timezone.utc)
    today_ist = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")

    if user:
        # Never let Google sign-in touch an admin account
        if user.get("role") == "admin" or user.get("is_admin"):
            return fail("admin_must_use_password_login")

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "google_id": google_id,
                    "avatar": picture,
                    "last_login": today_ist,
                }
            },
        )
    else:
        # Auto-create a brand-new "customer" account — role is hardcoded
        # so a Google sign-in can never produce an admin user.
        new_user = {
            "email": email,
            "name": name,
            "role": "customer",
            "is_admin": False,
            "status": "active",
            "auth_provider": "google",
            "google_id": google_id,
            "avatar": picture,
            "joined_date": today_ist,
            "last_login": today_ist,
            "orders_count": 0,
            "coins_balance": 0,
            "coins_earned_total": 0,
            "coins_spent_total": 0,
            "addresses": [],
            "created_at": now_utc
        }
        result = users.insert_one(new_user)
        user = users.find_one({"_id": result.inserted_id})

    # Check if this email is a registered merchant seller
    seller = db["sellers"].find_one({"email": email})
    user_role = "seller" if seller else user.get("role", "customer")
    seller_id = str(seller["_id"]) if seller else str(user["_id"])

    token = create_access_token(
        {
            "sub": seller_id,
            "email": user["email"],
            "role": user_role,
            "is_seller": bool(seller),
            "token_version": (seller or user).get("token_version", 1),
        }
    )

    return RedirectResponse(f"{target_frontend}/auth/google/success?token={token}")


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    """Logout endpoint - clears user session"""
    # In a stateless JWT setup, logout is handled client-side by removing the token
    # This endpoint can be used for logging purposes or token blacklisting in the future

    if authorization:
        # Here you could add logic to blacklist the token if needed
        # For now, we just return success
        pass

    return {
        "message": "Successfully logged out",
        "success": True
    }
