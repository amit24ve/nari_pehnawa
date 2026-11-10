import os
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Updated to fix bcrypt version compatibility
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=12)
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET", "change_this_secret_for_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 365 * 10  # 10 years (persistent session until manual logout)


def verify_password(plain_password, hashed_password):
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Hash a password for storage"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create a JWT access token with issued-at (iat) timestamp"""
    to_encode = data.copy()
    now_utc = datetime.utcnow()
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    if "iat" not in to_encode:
        to_encode["iat"] = int(now_utc.timestamp())
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify JWT token and return payload"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Get current user from token payload, validating session & password version against database"""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )

    from app.database import get_database
    from bson import ObjectId

    db = get_database()
    user = None

    try:
        user = db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None

    if not user:
        user = db["users"].find_one({"id": str(user_id)})

    if not user:
        # Check sellers collection if not found in users
        try:
            user = db["sellers"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None

    if not user and payload.get("email"):
        user = db["users"].find_one({"email": payload.get("email")})
        if not user:
            user = db["sellers"].find_one({"email": payload.get("email")})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Account not found or session revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Check if account is inactive or banned
    if user.get("status") in ["inactive", "suspended", "banned", "blocked"] or user.get("is_active") is False:
        raise HTTPException(
            status_code=401,
            detail="Account is inactive or suspended. Please contact support.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 1. Validate token_version
    user_token_version = user.get("token_version")
    token_version = payload.get("token_version")
    if user_token_version is not None:
        if token_version is None or int(token_version) < int(user_token_version):
            raise HTTPException(
                status_code=401,
                detail="Session expired: Your password was changed. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"}
            )

    # 2. Validate password_changed_at timestamp
    pwd_changed_at = user.get("password_changed_at")
    if pwd_changed_at:
        token_iat = payload.get("iat")
        if isinstance(pwd_changed_at, datetime):
            pwd_ts = pwd_changed_at.timestamp()
        else:
            try:
                pwd_ts = float(pwd_changed_at)
            except Exception:
                pwd_ts = 0.0

        if not token_iat or float(token_iat) < (pwd_ts - 2):  # 2-second leeway
            raise HTTPException(
                status_code=401,
                detail="Session expired: Your password was changed. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"}
            )

    role = user.get("role") or payload.get("role", "customer")
    is_admin = bool(role in ("admin", "super_admin") or user.get("is_admin"))

    return {
        "id": str(user["_id"]),
        "email": user.get("email") or payload.get("email"),
        "role": role,
        "is_admin": is_admin
    }


optional_security = HTTPBearer(auto_error=False)


def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(optional_security)) -> Optional[dict]:
    """Get current user if token provided and valid, else return None without throwing 401"""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = verify_token(credentials)
        return get_current_user(payload)
    except Exception:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    if current_user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_seller(current_user: dict = Depends(get_current_user)) -> dict:
    """Require seller, admin or super_admin role"""
    if current_user.get("role") not in ("seller", "admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Seller access required")
    return current_user


def require_admin_or_seller(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin or seller role"""
    if current_user.get("role") not in ("admin", "super_admin", "seller"):
        raise HTTPException(status_code=403, detail="Admin or Seller access required")
    return current_user

