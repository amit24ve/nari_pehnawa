from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.database import get_database
from app.security import require_admin
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/reels", tags=["WatchAndBuyReels"])


class ReelBase(BaseModel):
    title: str
    video_url: str
    thumbnail: str
    price: float
    original_price: Optional[float] = None
    product_link: Optional[str] = None
    views: Optional[str] = "1.2L"
    likes: Optional[int] = 1200
    order: int = 0
    is_active: bool = True


class ReelCreate(ReelBase):
    pass


class ReelUpdate(ReelBase):
    pass


class ReelOut(ReelBase):
    id: str

    class Config:
        populate_by_name = True


def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


def get_default_reels():
    return [
        {
            "title": "Blush Glow Anarkali Kurta Set",
            "video_url": "https://res.cloudinary.com/demo/video/upload/v1687258384/samples/dance-2.mp4",
            "thumbnail": "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600",
            "price": 4500.0,
            "original_price": 5400.0,
            "product_link": "/category/anarkali-kurtis",
            "views": "2.4L",
            "likes": 14200,
            "order": 1,
            "is_active": True
        },
        {
            "title": "Chikankari Handcrafted Silk Kurti",
            "video_url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
            "thumbnail": "https://images.pexels.com/photos/2802024/pexels-photo-2802024.jpeg?auto=compress&cs=tinysrgb&w=600",
            "price": 3800.0,
            "original_price": 4600.0,
            "product_link": "/category/chikankari-kurtis",
            "views": "1.8L",
            "likes": 9800,
            "order": 2,
            "is_active": True
        },
        {
            "title": "Maroon Mirror Work Anarkali Suit",
            "video_url": "https://res.cloudinary.com/demo/video/upload/v1687258385/samples/sea-turtle.mp4",
            "thumbnail": "https://images.pexels.com/photos/3622618/pexels-photo-3622618.jpeg?auto=compress&cs=tinysrgb&w=600",
            "price": 5200.0,
            "original_price": 6200.0,
            "product_link": "/category/embroidered-kurtis",
            "views": "3.1L",
            "likes": 21500,
            "order": 3,
            "is_active": True
        },
        {
            "title": "Palazzo Set - Festive Teal & Gold",
            "video_url": "https://res.cloudinary.com/demo/video/upload/v1687258382/samples/cld-sample-video.mp4",
            "thumbnail": "https://images.pexels.com/photos/4210854/pexels-photo-4210854.jpeg?auto=compress&cs=tinysrgb&w=600",
            "price": 2999.0,
            "original_price": 3800.0,
            "product_link": "/category/palazzo-set-kurtis",
            "views": "1.2L",
            "likes": 8300,
            "order": 4,
            "is_active": True
        }
    ]


@router.get("/", response_model=List[ReelOut])
@cache_response(expire_seconds=300)
def get_reels(request: Request, active_only: bool = True):
    db = get_database()
    query = {"is_active": True} if active_only else {}
    collection = db["watch_buy_reels"]
    reels = list(collection.find(query).sort("order", 1))
    if not reels or (len(reels) > 0 and "googleapis.com" in reels[0].get("video_url", "")):
        # Reset and seed valid working MP4 URLs
        collection.delete_many({})
        defaults = get_default_reels()
        for d in defaults:
            d["created_at"] = datetime.now()
        collection.insert_many(defaults)
        reels = list(collection.find(query).sort("order", 1))
    return [_fmt(r) for r in reels]


@router.post("/", response_model=ReelOut, status_code=201)
def create_reel(data: ReelCreate, _admin=Depends(require_admin)):
    db = get_database()
    doc = data.model_dump()
    doc["created_at"] = datetime.now()
    result = db["watch_buy_reels"].insert_one(doc)
    doc["_id"] = result.inserted_id
    clear_api_cache()
    return _fmt(doc)


@router.put("/{reel_id}", response_model=ReelOut)
def update_reel(reel_id: str, data: ReelUpdate, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(reel_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reel id")

    update = data.model_dump()
    update["updated_at"] = datetime.now()
    result = db["watch_buy_reels"].find_one_and_update(
        {"_id": oid}, {"$set": update}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Reel not found")
    clear_api_cache()
    return _fmt(result)


@router.delete("/{reel_id}")
def delete_reel(reel_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(reel_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reel id")
    result = db["watch_buy_reels"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reel not found")
    clear_api_cache()
    return {"success": True}


@router.patch("/{reel_id}/toggle")
def toggle_reel(reel_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(reel_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reel id")
    doc = db["watch_buy_reels"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Reel not found")
    new_state = not doc.get("is_active", True)
    db["watch_buy_reels"].update_one({"_id": oid}, {"$set": {"is_active": new_state}})
    clear_api_cache()
    return {"success": True, "is_active": new_state}
