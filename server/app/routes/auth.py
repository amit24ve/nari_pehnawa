from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from app.database import get_database
from app.security import verify_password, create_access_token
from typing import Optional
from datetime import datetime
from urllib.parse import urlencode
import requests

from app.config import (
    google_client_id,
    google_client_secret,
    google_redirect_uri,
    frontend_url,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SendOTPRequest(BaseModel):
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    otp: str


class ForgotPasswordSendOTPRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


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
    expires_at = datetime.now() + timedelta(minutes=10)

    # Store OTP in DB
    otps = db["otps"]
    otps.delete_many({"email": request.email})
    otps.insert_one({
        "email": request.email,
        "otp": otp_code,
        "expires_at": expires_at,
        "created_at": datetime.now()
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
    """Send reset password OTP to email"""
    import random
    from datetime import datetime, timedelta
    from app.services.notification_service import NotificationService

    db = get_database()
    users = db["users"]

    # Check if user exists
    user = users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now() + timedelta(minutes=10)

    # Store OTP in DB
    otps = db["otps"]
    otps.delete_many({"email": request.email})
    otps.insert_one({
        "email": request.email,
        "otp": otp_code,
        "expires_at": expires_at,
        "created_at": datetime.now()
    })

    # Send Email via NotificationService
    notif = NotificationService(db)
    subject = "Reset Your Nari Pehnawa Password"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #8B0000; margin: 0;">Nari Pehnawa</h2>
            <p style="color: #666; font-size: 14px;">Password Reset Verification Code</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Your password reset verification code is:</p>
            <h1 style="color: #8B0000; letter-spacing: 5px; margin: 0; font-size: 32px;">{otp_code}</h1>
            <p style="margin: 10px 0 0 0; color: #888; font-size: 12px;">Valid for 10 minutes</p>
        </div>
        <p style="color: #555; font-size: 13px; line-height: 1.5;">Please enter this code on the password reset screen to verify your email and set a new password.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 11px; text-align: center;">If you did not request to reset your password, please ignore this email.</p>
    </div>
    """
    sent = notif.send_custom_email(
        to_email=request.email,
        subject=subject,
        body=html_body,
        is_html=True,
        event_name="password_reset_otp_sent"
    )

    return {
        "success": True,
        "message": f"Verification code sent to {request.email}"
    }


@router.post("/forgot-password/reset")
def forgot_password_reset(request: ForgotPasswordResetRequest):
    """Verify OTP and reset password"""
    from app.security import get_password_hash
    from datetime import datetime

    db = get_database()
    users = db["users"]
    otps = db["otps"]

    # Verify user exists
    user = users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    # Verify OTP
    otp_record = otps.find_one({"email": request.email, "otp": request.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if otp_record.get("expires_at") and otp_record.get("expires_at") < datetime.now():
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    # OTP is valid — delete used OTP record
    otps.delete_one({"_id": otp_record["_id"]})

    # Update password_hash
    users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": get_password_hash(request.new_password)}}
    )

    return {
        "success": True,
        "message": "Password has been successfully reset. You can now log in."
    }


@router.post("/login")
def login(request: LoginRequest):
    """Login endpoint - returns access token and user info"""
    db = get_database()
    users = db["users"]

    print(f"DEBUG: Login attempt for email: {request.email}")
    user = users.find_one({"email": request.email})
    if not user:
        print(f"DEBUG: User not found for email: {request.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(f"DEBUG: User found: {user.get('email')}")
    hashed = user.get("password_hash")
    print(f"DEBUG: Has password_hash: {hashed is not None}")

    if not hashed:
        print("DEBUG: No password hash found")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    pwd_valid = verify_password(request.password, hashed)
    print(f"DEBUG: Password valid: {pwd_valid}")

    if not pwd_valid:
        print("DEBUG: Password verification failed")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create access token
    token = create_access_token({
        "sub": str(user.get("_id")),
        "email": user.get("email"),
        "role": user.get("role", "customer")
    })

    # Prepare user response
    user_out = {
        "id": str(user.get('_id')),
        "email": user.get('email'),
        "name": user.get('name'),
        "role": user.get('role', 'customer')
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_out
    }


@router.post("/register")
def register(request: RegisterRequest):
    """Register new user endpoint with mandatory Email OTP verification"""
    from app.security import get_password_hash
    from datetime import datetime

    db = get_database()
    users = db["users"]
    otps = db["otps"]

    # Check if user already exists
    existing_user = users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Verify OTP
    otp_record = otps.find_one({"email": request.email, "otp": request.otp})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if otp_record.get("expires_at") and otp_record.get("expires_at") < datetime.now():
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    # OTP is valid — delete used OTP record
    otps.delete_one({"_id": otp_record["_id"]})

    # Create new user
    user_data = {
        "email": request.email,
        "name": request.name,
        "password_hash": get_password_hash(request.password),
        "role": "customer",
        "is_email_verified": True,
        "created_at": datetime.now(),
        "orders_count": 0
    }

    result = users.insert_one(user_data)

    # Create access token
    token = create_access_token({
        "sub": str(result.inserted_id),
        "email": request.email,
        "role": "customer"
    })

    # Prepare user response
    user_out = {
        "id": str(result.inserted_id),
        "email": request.email,
        "name": request.name,
        "role": "customer"
    }

    return {
        "access_token": token,
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


@router.get("/google/login")
def google_login():
    """Redirects the browser to Google's OAuth consent screen."""
    if not google_client_id:
        raise HTTPException(
            status_code=500,
            detail="Google login is not configured (missing GOOGLE_CLIENT_ID)",
        )

    params = {
        "client_id": google_client_id,
        "redirect_uri": google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
def google_callback(code: Optional[str] = None, error: Optional[str] = None):
    """Handles Google's redirect back, logs the user in (or auto-creates
    a new "customer" account), then redirects to the frontend with a
    ready-to-use access token. Google sign-in can NEVER log in or create
    an admin account — admins must still use the password login."""

    def fail(reason: str):
        return RedirectResponse(f"{frontend_url}/auth/google/success?error={reason}")

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
                    "last_login": datetime.now().strftime("%Y-%m-%d"),
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
            "joined_date": datetime.now().strftime("%Y-%m-%d"),
            "last_login": datetime.now().strftime("%Y-%m-%d"),
            "orders_count": 0,
        }
        result = users.insert_one(new_user)
        user = users.find_one({"_id": result.inserted_id})

    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": "customer",
        }
    )

    return RedirectResponse(f"{frontend_url}/auth/google/success?token={token}")


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
