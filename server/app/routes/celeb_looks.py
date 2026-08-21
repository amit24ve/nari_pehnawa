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


def get_default_celeb_looks():
    return [
        {
            "name": "Haldi Georgette Anarkali Suit Set",
            "price": 4500.0,
            "image": "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600",
            "tag": "Festive Favorite",
            "link": "/category/anarkali-kurtis",
            "order": 1,
            "is_active": True
        },
        {
            "name": "Damini Cotton Printed Suit Set",
            "price": 3200.0,
            "image": "https://images.pexels.com/photos/2802024/pexels-photo-2802024.jpeg?auto=compress&cs=tinysrgb&w=600",
            "tag": "Celebrity Pick",
            "link": "/category/chikankari-kurtis",
            "order": 2,
            "is_active": True
        },
        {
            "name": "Orange Bandhej Cotton Suit Set",
            "price": 3800.0,
            "image": "https://images.pexels.com/photos/3622618/pexels-photo-3622618.jpeg?auto=compress&cs=tinysrgb&w=600",
            "tag": "Bollywood Style",
            "link": "/category/printed-kurtis",
            "order": 3,
            "is_active": True
        },
        {
            "name": "Urvi Silk Embroidered Suit Set",
            "price": 5200.0,
            "image": "https://images.pexels.com/photos/4210854/pexels-photo-4210854.jpeg?auto=compress&cs=tinysrgb&w=600",
            "tag": "Trending Now",
            "link": "/category/embroidered-kurtis",
            "order": 4,
            "is_active": True
        }
    ]


@router.get("/", response_model=List[CelebLookOut])
@cache_response(expire_seconds=300)
def get_celeb_looks(request: Request, active_only: bool = True):
    db = get_database()
    query = {"is_active": True} if active_only else {}
    collection = db["celeb_approved_looks"]
    looks = list(collection.find(query).sort("order", 1))
    if not looks:
        defaults = get_default_celeb_looks()
        for d in defaults:
            d["created_at"] = datetime.now()
        collection.insert_many(defaults)
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
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid look id")

    update = data.model_dump()
    update["updated_at"] = datetime.now()
    result = db["celeb_approved_looks"].find_one_and_update(
        {"_id": oid}, {"$set": update}, return_document=True
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
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid look id")
    result = db["celeb_approved_looks"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Celeb look not found")
    clear_api_cache()
    return {"success": True}


@router.patch("/{look_id}/toggle")
def toggle_celeb_look(look_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(look_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid look id")
    doc = db["celeb_approved_looks"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Celeb look not found")
    new_state = not doc.get("is_active", True)
    db["celeb_approved_looks"].update_one({"_id": oid}, {"$set": {"is_active": new_state}})
    clear_api_cache()
    return {"success": True, "is_active": new_state}
