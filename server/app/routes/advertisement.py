"""
Advertisement API — CRUD for homepage advertisement strip cards.
Ads are stored in MongoDB `advertisements` collection.
Public GET is unauthenticated so AdvertisementStrip can fetch without a token.
All write operations require admin.
"""
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.database import get_database
from app.security import require_admin
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/advertisements", tags=["Advertisements"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class AdBase(BaseModel):
    image: str
    title: Optional[str] = "Festive Special Offer"
    subtitle: Optional[str] = ""
    badge: Optional[str] = "SPECIAL DEAL"
    link: Optional[str] = "/category/sale"
    order: int = 0
    is_active: bool = True
    accent_color: Optional[str] = "#D4AF37"


class AdCreate(AdBase):
    pass


class AdUpdate(AdBase):
    pass


class AdOut(AdBase):
    id: str

    class Config:
        populate_by_name = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[AdOut])
@cache_response(expire_seconds=120)
def get_ads(request: Request, active_only: bool = True):
    """Public — fetch all advertisements ordered by `order` field."""
    db = get_database()
    query = {"is_active": True} if active_only else {}
    ads = list(db["advertisements"].find(query).sort("order", 1))
    return [_fmt(a) for a in ads]


@router.post("/", response_model=AdOut, status_code=201)
def create_ad(data: AdCreate, _admin=Depends(require_admin)):
    db = get_database()
    doc = data.model_dump()
    doc["created_at"] = datetime.now()
    result = db["advertisements"].insert_one(doc)
    doc["_id"] = result.inserted_id
    clear_api_cache()
    return _fmt(doc)


@router.put("/{ad_id}", response_model=AdOut)
def update_ad(ad_id: str, data: AdUpdate, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(ad_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ad id")

    update = data.model_dump()
    update["updated_at"] = datetime.now()
    result = db["advertisements"].find_one_and_update(
        {"_id": oid}, {"$set": update}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    clear_api_cache()
    return _fmt(result)


@router.delete("/{ad_id}")
def delete_ad(ad_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(ad_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ad id")
    res = db["advertisements"].delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    clear_api_cache()
    return {"message": "Advertisement deleted successfully"}


@router.patch("/{ad_id}/toggle")
def toggle_ad(ad_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(ad_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ad id")
    ad = db["advertisements"].find_one({"_id": oid})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    new_active = not ad.get("is_active", True)
    db["advertisements"].update_one({"_id": oid}, {"$set": {"is_active": new_active}})
    clear_api_cache()
    return {"id": ad_id, "is_active": new_active}
