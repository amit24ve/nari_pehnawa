from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from app.database import get_database
from app.security import get_current_user, require_admin
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


class ReelCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=500)


def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/", response_model=List[ReelOut])
@cache_response(expire_seconds=300)
def get_reels(request: Request, active_only: bool = True):
    db = get_database()
    query = {"is_active": True} if active_only else {}
    collection = db["watch_buy_reels"]
    reels = list(collection.find(query).sort("order", 1))
    return [_fmt(r) for r in reels]


def _reel_or_404(db, reel_id: str) -> ObjectId:
    try:
        oid = ObjectId(reel_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reel id")
    if not db["watch_buy_reels"].find_one({"_id": oid, "is_active": True}):
        raise HTTPException(status_code=404, detail="Reel not found")
    return oid


def _engagement(db, reel_id: str, user_id: Optional[str] = None) -> dict:
    reel = db["watch_buy_reels"].find_one({"_id": ObjectId(reel_id)}) or {}
    organic_likes = db["reel_likes"].count_documents({"reel_id": reel_id})
    return {
        "reel_id": reel_id,
        "likes": max(0, int(reel.get("likes") or 0)) + organic_likes,
        "comments": db["reel_comments"].count_documents({"reel_id": reel_id}),
        "liked": bool(user_id and db["reel_likes"].find_one({"reel_id": reel_id, "user_id": user_id})),
    }


@router.get("/{reel_id}/engagement")
def get_reel_engagement(reel_id: str):
    db = get_database()
    _reel_or_404(db, reel_id)
    return _engagement(db, reel_id)


@router.get("/{reel_id}/engagement/me")
def get_my_reel_engagement(reel_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    _reel_or_404(db, reel_id)
    return _engagement(db, reel_id, str(current_user.get("id")))


@router.post("/{reel_id}/like")
def toggle_reel_like(reel_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    _reel_or_404(db, reel_id)
    user_id = str(current_user.get("id"))
    query = {"reel_id": reel_id, "user_id": user_id}
    existing = db["reel_likes"].find_one(query)
    if existing:
        db["reel_likes"].delete_one({"_id": existing["_id"]})
        liked = False
    else:
        db["reel_likes"].update_one(
            query,
            {"$setOnInsert": {**query, "created_at": datetime.now()}},
            upsert=True,
        )
        liked = True
    return {**_engagement(db, reel_id, user_id), "liked": liked}


@router.get("/{reel_id}/comments")
def get_reel_comments(reel_id: str, skip: int = 0, limit: int = 50):
    db = get_database()
    _reel_or_404(db, reel_id)
    limit = min(max(limit, 1), 100)
    rows = list(db["reel_comments"].find({"reel_id": reel_id}).sort("created_at", -1).skip(max(skip, 0)).limit(limit))
    return [{
        "id": str(row["_id"]),
        "user_name": row.get("user_name") or "Nari shopper",
        "comment": row.get("comment") or "",
        "created_at": row.get("created_at"),
    } for row in rows]


@router.post("/{reel_id}/comments", status_code=201)
def create_reel_comment(reel_id: str, data: ReelCommentCreate, current_user=Depends(get_current_user)):
    db = get_database()
    _reel_or_404(db, reel_id)
    comment = " ".join(data.comment.strip().split())
    if not comment:
        raise HTTPException(status_code=422, detail="Comment cannot be empty")
    doc = {
        "reel_id": reel_id,
        "user_id": str(current_user.get("id")),
        "user_name": current_user.get("name") or "Nari shopper",
        "comment": comment,
        "created_at": datetime.now(),
    }
    result = db["reel_comments"].insert_one(doc)
    return {"id": str(result.inserted_id), **{k: doc[k] for k in ("user_name", "comment", "created_at")}}


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
        filter_q = {"$or": [{"_id": oid}, {"id": reel_id}]}
    except Exception:
        filter_q = {"id": reel_id}

    update = data.model_dump()
    update["updated_at"] = datetime.now()
    result = db["watch_buy_reels"].find_one_and_update(
        filter_q, {"$set": update}, return_document=True
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
        filter_q = {"$or": [{"_id": oid}, {"id": reel_id}]}
    except Exception:
        filter_q = {"id": reel_id}
    result = db["watch_buy_reels"].delete_one(filter_q)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reel not found")
    clear_api_cache()
    return {"success": True}


@router.patch("/{reel_id}/toggle")
def toggle_reel(reel_id: str, _admin=Depends(require_admin)):
    db = get_database()
    try:
        oid = ObjectId(reel_id)
        filter_q = {"$or": [{"_id": oid}, {"id": reel_id}]}
    except Exception:
        filter_q = {"id": reel_id}
    doc = db["watch_buy_reels"].find_one(filter_q)
    if not doc:
        raise HTTPException(status_code=404, detail="Reel not found")
    new_state = not doc.get("is_active", True)
    db["watch_buy_reels"].update_one(filter_q, {"$set": {"is_active": new_state}})
    clear_api_cache()
    return {"success": True, "is_active": new_state}
