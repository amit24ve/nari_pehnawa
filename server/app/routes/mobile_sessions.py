from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.database import get_database
from app.services.mobile_session_service import revoke_refresh, rotate_refresh

router = APIRouter(prefix="/auth/mobile", tags=["Auth"])
NO_STORE = {"Cache-Control": "no-store", "Pragma": "no-cache"}


class RefreshPayload(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=256)


@router.post("/refresh")
def refresh(payload: RefreshPayload):
    return JSONResponse(rotate_refresh(get_database(), payload.refresh_token), headers=NO_STORE)


@router.post("/logout")
def logout(payload: RefreshPayload):
    revoke_refresh(get_database(), payload.refresh_token)
    return JSONResponse({"ok": True}, headers=NO_STORE)
