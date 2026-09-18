from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.database import get_database
from app.security import require_admin
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/celeb-looks", tags=["CelebApprovedLooks"])


class CelebLookBase(BaseModel):
    name: str
    image: str
    price: float
    tag: str = "Celebrity Favorite"
    link: str = "/category/anarkali-kurtis"
    order: int = 0
    is_active: bool = True


class CelebLookCreate(CelebLookBase):
    pass


class CelebLookUpdate(CelebLookBase):
    pass


class CelebLookOut(CelebLookBase):
    id: str

    class Config:
        populate_by_name = True


def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/", response_model=List[CelebLookOut])
@cache_response(expire_seconds=300)
def get_celeb_looks(request: Request, active_only: bool = True):
    db = get_database()
    query = {"is_active": True} if active_only else {}
    collection = db["celeb_approved_looks"]
    looks = list(collection.find(query).sort("order", 1))
    return [_fmt(l) for l in looks]


@router.post("/", response_model=CelebLookOut, status_code=201)
def create_celeb_look(data: CelebLookCreate, _admin=Depends(require_admin)):
    db = get_database()
    doc = data.model_dump()
    doc["created_at"] = datetime.now()
    result = db["celeb_approved_looks"].insert_one(doc)
    doc["_id"] = result.inserted_id
    clear_api_cache()
    return _fmt(doc)


@router.put("/{look_id}", response_model=CelebLookOut)
def update_celeb_look(look_id: str, data: CelebLookUpdate, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(look_id)
        filter_q = {"$or": [{"_id": oid}, {"id": look_id}]}
    except Exception:
        filter_q = {"id": look_id}

    update = data.model_dump()
    update["updated_at"] = datetime.now()
    result = db["celeb_approved_looks"].find_one_and_update(
        filter_q, {"$set": update}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Celeb look not found")
    clear_api_cache()
    return _fmt(result)


@router.delete("/{look_id}")
def delete_celeb_look(look_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(look_id)
        filter_q = {"$or": [{"_id": oid}, {"id": look_id}]}
    except Exception:
        filter_q = {"id": look_id}
    result = db["celeb_approved_looks"].delete_one(filter_q)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Celeb look not found")
    clear_api_cache()
    return {"success": True}


@router.patch("/{look_id}/toggle")
def toggle_celeb_look(look_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(look_id)
        filter_q = {"$or": [{"_id": oid}, {"id": look_id}]}
    except Exception:
        filter_q = {"id": look_id}
    doc = db["celeb_approved_looks"].find_one(filter_q)
    if not doc:
        raise HTTPException(status_code=404, detail="Celeb look not found")
    new_state = not doc.get("is_active", True)
    db["celeb_approved_looks"].update_one(filter_q, {"$set": {"is_active": new_state}})
    clear_api_cache()
    return {"is_active": new_state}
