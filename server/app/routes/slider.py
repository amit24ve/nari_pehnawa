"""
Hero Slider API — CRUD for homepage banner slides.
Slides are stored in MongoDB `hero_slides` collection.
Public GET is unauthenticated so HeroSection can fetch without a token.
All write operations require admin.
"""
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database import get_database
from app.security import require_admin

router = APIRouter(prefix="/slider", tags=["Slider"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class SlideBase(BaseModel):
    image: str
    alt: str = ""
    title: Optional[str] = None
    subtitle: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order: int = 0
    is_active: bool = True


class SlideCreate(SlideBase):
    pass


class SlideUpdate(SlideBase):
    pass


class SlideOut(SlideBase):
    id: str

    class Config:
        populate_by_name = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[SlideOut])
def get_slides(active_only: bool = True):
    """Public — fetch all slides ordered by `order` field."""
    db = get_database()
    query = {"is_active": True} if active_only else {}
    slides = list(db["hero_slides"].find(query).sort("order", 1))
    return [_fmt(s) for s in slides]


@router.post("/", response_model=SlideOut, status_code=201)
def create_slide(data: SlideCreate, _admin=Depends(require_admin)):
    db = get_database()
    doc = data.model_dump()
    doc["created_at"] = datetime.now()
    result = db["hero_slides"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _fmt(doc)


@router.put("/{slide_id}", response_model=SlideOut)
def update_slide(slide_id: str, data: SlideUpdate, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(slide_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid slide id")

    update = data.model_dump()
    update["updated_at"] = datetime.now()
    result = db["hero_slides"].find_one_and_update(
        {"_id": oid}, {"$set": update}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Slide not found")
    return _fmt(result)


@router.delete("/{slide_id}")
def delete_slide(slide_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(slide_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid slide id")
    result = db["hero_slides"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slide not found")
    return {"success": True}


@router.patch("/{slide_id}/toggle")
def toggle_slide(slide_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(slide_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid slide id")
    doc = db["hero_slides"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Slide not found")
    new_state = not doc.get("is_active", True)
    db["hero_slides"].update_one({"_id": oid}, {"$set": {"is_active": new_state}})
    return {"success": True, "is_active": new_state}
