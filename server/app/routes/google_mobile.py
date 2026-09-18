"""APK-only OAuth broker. No Google secret or bearer token leaves in a URL."""
import base64
import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.config import google_client_id, google_client_secret, google_redirect_uri
from app.database import get_database
from app.security import create_access_token

router = APIRouter(prefix="/google/mobile", tags=["Auth"])
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
CALLBACK = "naaripehnawa://oauth/google"
NO_CACHE = {"Cache-Control": "no-store", "Pragma": "no-cache", "Referrer-Policy": "no-referrer"}
logger = logging.getLogger(__name__)


def digest(value):
    return base64.urlsafe_b64encode(hashlib.sha256(value.encode("ascii")).digest()).decode().rstrip("=")


class StartRequest(BaseModel):
    state: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")
    code_challenge: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")


class ExchangeRequest(BaseModel):
    state: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")
    code: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")
    code_verifier: str = Field(pattern=r"^[A-Za-z0-9._~-]{43,128}$")


class ResumeRequest(BaseModel):
    state: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")
    code_verifier: str = Field(pattern=r"^[A-Za-z0-9._~-]{43,128}$")


def collection():
    return get_database()["mobile_google_flows"]


@router.on_event("startup")
def ensure_indexes():
    collection().create_index("expires_at", expireAfterSeconds=0)
    collection().create_index([("client_hash", 1), ("expires_at", 1)])


@router.post("/start")
def start(body: StartRequest, request: Request):
    if not google_client_id or not google_client_secret:
        raise HTTPException(503, "Google sign-in is temporarily unavailable. Use email or try later.")
    now = datetime.utcnow()
    flows = collection()
    client_hash = digest(request.client.host if request.client else "unknown")
    if flows.count_documents({"client_hash": client_hash, "expires_at": {"$gt": now}}, limit=20) >= 20:
        raise HTTPException(429, "Too many sign-in attempts. Please try again later.")
    provider_state = "mobile_" + secrets.token_urlsafe(32)
    provider_verifier = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    flows.insert_one({
        "_id": digest(provider_state), "state": body.state,
        "challenge": body.code_challenge, "provider_verifier": provider_verifier,
        "nonce": nonce, "client_hash": client_hash, "status": "started",
        "expires_at": now + timedelta(minutes=10),
    })
    params = {
        "client_id": google_client_id, "redirect_uri": google_redirect_uri,
        "response_type": "code", "scope": "openid email profile",
        "access_type": "online", "prompt": "select_account", "state": provider_state,
        "nonce": nonce, "code_challenge": digest(provider_verifier), "code_challenge_method": "S256",
    }
    return JSONResponse({"authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params), "expires_in": 600}, headers=NO_CACHE)


def google_profile(code, flow):
    response = requests.post(TOKEN_URL, data={
        "client_id": google_client_id, "client_secret": google_client_secret,
        "redirect_uri": google_redirect_uri, "grant_type": "authorization_code",
        "code": code, "code_verifier": flow["provider_verifier"],
    }, timeout=10)
    response.raise_for_status()
    access_token = response.json().get("access_token")
    if not access_token:
        raise ValueError("Google token response did not contain an access token")
    # Use the same provider-backed profile endpoint as the working website flow.
    # The authorization code is bound to this client, redirect URI and PKCE verifier.
    profile_response = requests.get(
        USERINFO_URL,
        headers={"Authorization": "Bearer " + access_token},
        timeout=10,
    )
    profile_response.raise_for_status()
    profile = profile_response.json()
    if profile.get("email_verified") is not True or not profile.get("email") or not profile.get("sub"):
        raise ValueError("Verified email required")
    return profile


def customer(profile):
    users = get_database()["users"]
    email = profile["email"].strip().lower()
    subject = profile["sub"]
    user = users.find_one({"google_id": subject})
    if not user:
        email_query = {"email": {"$regex": "^" + re.escape(email) + "$", "$options": "i"}}
        if users.count_documents(email_query, limit=2) > 1:
            raise ValueError("Ambiguous existing email. Contact support.")
        user = users.find_one(email_query)
    if user:
        if user.get("role", "customer") != "customer" or user.get("is_admin") or user.get("status", "active") != "active" or user.get("is_active") is False:
            raise ValueError("Account is not eligible for customer Google login")
        if user.get("google_id") and user["google_id"] != subject:
            raise ValueError("Google account mismatch")
        # Google is not authoritative for non-Gmail addresses outside a managed Workspace.
        if not user.get("google_id") and not (email.endswith("@gmail.com") or profile.get("hd")):
            raise ValueError("Use email login to access this existing account")
        users.update_one({"_id": user["_id"]}, {"$set": {
            "google_id": subject, "avatar": profile.get("picture"), "is_email_verified": True,
            "last_login": datetime.utcnow().strftime("%Y-%m-%d"),
        }})
        return user
    record = {
        "email": email, "name": (profile.get("name") or email.split("@")[0])[:200],
        "role": "customer", "is_admin": False, "status": "active", "is_email_verified": True,
        "auth_provider": "google", "google_id": subject, "avatar": profile.get("picture"),
        "created_at": datetime.utcnow(), "joined_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "last_login": datetime.utcnow().strftime("%Y-%m-%d"), "orders_count": 0,
    }
    try:
        record["_id"] = users.insert_one(record).inserted_id
    except DuplicateKeyError:
        return customer(profile)
    return record


def return_to_app(state=None, code=None, error=None):
    # No auto-redirect dependency: Android browsers may require a user gesture to open an app.
    if state:
        query = {"state": state}
        query.update({"code": code} if code else {"error": error or "failed"})
        from html import escape
        encoded_query = urlencode(query)
        raw_link = CALLBACK + "?" + urlencode(query)
        intent_link = "intent://oauth/google?" + encoded_query + "#Intent;scheme=naaripehnawa;package=com.naaripehnawa.app;end"
        link = escape(raw_link, quote=True)
        intent = escape(intent_link, quote=True)
        script_intent = escape(intent_link)
        script_link = escape(raw_link)
        action = '<a id="return-link" href="' + intent + '">Return to Naari Pehnawa</a><p><a class="secondary" href="' + link + '">Open with direct app link</a></p><p class="hint">If the app does not open automatically, tap Return to Naari Pehnawa.</p><script>(function(){var intent="' + script_intent + '";var direct="' + script_link + '";function openApp(href){location.href=href}setTimeout(function(){openApp(intent)},100);setTimeout(function(){openApp(direct)},900);})();</script>'
    else:
        action = "<p>Return to the app and start Google sign-in again.</p>"
    message = "Your Google account is ready. Continue in the app." if code else "Google sign-in was cancelled or could not be completed."
    html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Naari Pehnawa</title><style>body{font:16px system-ui;background:#fff;color:#241820;margin:0;padding:64px 24px;text-align:center}h1{font-size:26px}p{line-height:1.6}a{display:inline-block;background:#760039;color:#fff;padding:16px 22px;border-radius:6px;text-decoration:none;margin-top:24px}.secondary{background:#fff;color:#760039;border:1px solid #e3c3d0;margin-top:8px}.hint{color:#6f6470;font-size:13px}</style></head><body><h1>Naari Pehnawa</h1><p>' + message + '</p>' + action + '</body></html>'
    return HTMLResponse(html, headers={**NO_CACHE, "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'", "X-Content-Type-Options": "nosniff"})


def callback(state, code=None, error=None):
    if not re.fullmatch(r"mobile_[A-Za-z0-9_-]{43}", state or ""):
        return return_to_app()
    flows = collection()
    flow = flows.find_one_and_update({"_id": digest(state), "status": "started", "expires_at": {"$gt": datetime.utcnow()}},
                                    {"$set": {"status": "verifying"}}, return_document=ReturnDocument.BEFORE)
    if not flow:
        return return_to_app()
    try:
        if error or not code:
            raise ValueError("Cancelled")
        user = customer(google_profile(code, flow))
        handoff = secrets.token_urlsafe(32)
        flows.update_one({"_id": flow["_id"]}, {"$set": {
            "status": "ready", "handoff_hash": digest(handoff), "user_id": user["_id"],
            "expires_at": datetime.utcnow() + timedelta(seconds=90),
        }, "$unset": {"provider_verifier": "", "nonce": ""}})
        return return_to_app(flow["state"], code=handoff)
    except Exception as exc:
        # Provider exceptions can contain authorization codes/tokens. Never echo or log them.
        logger.warning("Mobile Google callback failed at %s", type(exc).__name__)
        flows.update_one({"_id": flow["_id"]}, {"$set": {"status": "failed"}, "$unset": {"provider_verifier": "", "nonce": ""}})
        return return_to_app(flow["state"], error="cancelled" if error or not code else "failed")


@router.post("/exchange")
def exchange(body: ExchangeRequest):
    flow = collection().find_one_and_delete({
        "state": body.state, "status": "ready", "handoff_hash": digest(body.code),
        "challenge": digest(body.code_verifier), "expires_at": {"$gt": datetime.utcnow()},
    })
    if not flow:
        raise HTTPException(400, "Google sign-in expired or was already used. Please start again.")
    return session_response(flow)


@router.post("/resume")
def resume(body: ResumeRequest):
    now = datetime.utcnow()
    proof = digest(body.code_verifier)
    flow = collection().find_one({
        "state": body.state, "challenge": proof, "expires_at": {"$gt": now},
    })
    if not flow:
        raise HTTPException(400, "Google sign-in expired. Please start again.")
    if flow.get("status") in ("started", "verifying"):
        return JSONResponse({"status": "pending"}, headers=NO_CACHE)
    if flow.get("status") != "ready":
        collection().delete_one({"_id": flow["_id"], "challenge": proof})
        raise HTTPException(400, "Google sign-in could not be completed. Please try again.")
    flow = collection().find_one_and_delete({
        "_id": flow["_id"], "state": body.state, "status": "ready",
        "challenge": proof, "expires_at": {"$gt": now},
    })
    if not flow:
        raise HTTPException(400, "Google sign-in expired or was already used. Please start again.")
    return session_response(flow)


def session_response(flow):
    user = get_database()["users"].find_one({"_id": flow["user_id"]})
    if not user or user.get("role", "customer") != "customer" or user.get("is_admin") or user.get("status", "active") != "active" or user.get("is_active") is False:
        raise HTTPException(403, "This account cannot sign in. Please contact support.")
    token = create_access_token({"sub": str(user["_id"]), "email": user["email"], "role": "customer"})
    return JSONResponse({"access_token": token, "token_type": "bearer"}, headers=NO_CACHE)
