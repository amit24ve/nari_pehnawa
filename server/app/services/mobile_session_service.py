"""Opaque, rotating refresh sessions for customer mobile app sign-in."""

from datetime import datetime, timedelta
import hashlib
import secrets

from bson import ObjectId
from fastapi import HTTPException

from app.security import create_access_token

SESSION_DAYS = 90


def _digest(token):
    return hashlib.sha256(token.encode("ascii")).hexdigest()


def ensure_indexes(db):
    db.mobile_refresh_sessions.create_index("token_hash", unique=True)
    db.mobile_refresh_sessions.create_index("expires_at", expireAfterSeconds=0)


def issue_refresh(db, user_id):
    ensure_indexes(db)
    token = secrets.token_urlsafe(48)
    now = datetime.utcnow()
    db.mobile_refresh_sessions.insert_one({
        "token_hash": _digest(token), "user_id": str(user_id),
        "created_at": now, "expires_at": now + timedelta(days=SESSION_DAYS),
    })
    return token


def rotate_refresh(db, token):
    now = datetime.utcnow()
    session = db.mobile_refresh_sessions.find_one_and_delete({
        "token_hash": _digest(token), "expires_at": {"$gt": now},
    })
    if not session:
        raise HTTPException(status_code=401, detail="Mobile session expired. Please sign in again.")
    try:
        user = db.users.find_one({"_id": ObjectId(session["user_id"])})
    except Exception:
        user = None
    if not user or user.get("role", "customer") != "customer" or user.get("is_active") is False or user.get("status", "active") != "active":
        raise HTTPException(status_code=401, detail="Account is unavailable. Please sign in again.")
    access = create_access_token({
        "sub": str(user["_id"]), "email": user.get("email"), "role": "customer",
    })
    return {"access_token": access, "refresh_token": issue_refresh(db, user["_id"]), "token_type": "bearer"}


def revoke_refresh(db, token):
    db.mobile_refresh_sessions.delete_one({"token_hash": _digest(token)})
