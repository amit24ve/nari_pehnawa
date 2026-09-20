from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Header, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from app.database import get_database
from jose import jwt
from app.security import SECRET_KEY, ALGORITHM, get_current_user, require_admin
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/reels", tags=["WatchAndBuyReels"])


class ReelConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            try:
                self.active_connections.remove(websocket)
            except ValueError:
                pass

    async def broadcast_like(self, reel_id: str, likes: int):
        message = {"type": "reel_like", "reel_id": reel_id, "likes": likes}
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)


reel_ws_manager = ReelConnectionManager()


def _get_optional_user(request: Request) -> Optional[dict]:
    """Extract user payload if valid bearer token is present without throwing 401"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1].strip()
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return {"id": user_id, "email": payload.get("email"), "role": payload.get("role", "customer")}
    except Exception:
        return None
    return None


class ReelBase(BaseModel):
    title: str
    video_url: str
    thumbnail: Optional[str] = ""
    price: Optional[float] = 0.0
    original_price: Optional[float] = None
    product_link: Optional[str] = None
    views: Optional[str] = "0"
    likes: Optional[int] = 0
    order: Optional[int] = 0
    is_active: bool = True


class ReelCreate(ReelBase):
    pass


class ReelUpdate(BaseModel):
    title: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    product_link: Optional[str] = None
    views: Optional[str] = None
    likes: Optional[int] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


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

    # Calculate real-time total likes including organic likes
    try:
        pipeline = [{"$group": {"_id": "$reel_id", "count": {"$sum": 1}}}]
        like_counts = {str(doc["_id"]): doc["count"] for doc in db["reel_likes"].aggregate(pipeline)}
    except Exception:
        like_counts = {}

    for r in reels:
        rid = str(r["_id"])
        base_likes = max(0, int(r.get("likes") or 0))
        r["likes"] = base_likes + like_counts.get(rid, 0)

    return [_fmt(r) for r in reels]


def _reel_or_404(db, reel_id: str) -> ObjectId:
    try:
        oid = ObjectId(reel_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reel id")
    if not db["watch_buy_reels"].find_one({"_id": oid, "is_active": True}):
        raise HTTPException(status_code=404, detail="Reel not found")
    return oid


def _engagement(db, reel_id: str, user_id: Optional[str] = None, visitor_id: Optional[str] = None) -> dict:
    reel = db["watch_buy_reels"].find_one({"_id": ObjectId(reel_id)}) or {}
    organic_likes = db["reel_likes"].count_documents({"reel_id": reel_id})
    base_likes = max(0, int(reel.get("likes") or 0))

    liked = False
    queries = []
    if user_id:
        queries.append({"user_id": user_id})
    if visitor_id:
        queries.append({"visitor_id": visitor_id})
    if queries:
        liked = bool(db["reel_likes"].find_one({"reel_id": reel_id, "$or": queries}))

    return {
        "reel_id": reel_id,
        "likes": base_likes + organic_likes,
        "comments": db["reel_comments"].count_documents({"reel_id": reel_id}),
        "liked": liked,
    }


@router.get("/{reel_id}/engagement")
def get_reel_engagement(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
):
    db = get_database()
    _reel_or_404(db, reel_id)
    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    visitor_id = x_visitor_id.strip() if x_visitor_id else None
    return _engagement(db, reel_id, user_id, visitor_id)


@router.get("/{reel_id}/engagement/me")
def get_my_reel_engagement(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
):
    db = get_database()
    _reel_or_404(db, reel_id)
    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    visitor_id = x_visitor_id.strip() if x_visitor_id else None
    return _engagement(db, reel_id, user_id, visitor_id)


@router.get("/likes-sync")
def get_reels_likes_sync():
    """Lightweight real-time sync endpoint returning current likes map for all active reels."""
    db = get_database()
    reels = list(db["watch_buy_reels"].find({"is_active": True}, {"_id": 1, "likes": 1}))
    try:
        pipeline = [{"$group": {"_id": "$reel_id", "count": {"$sum": 1}}}]
        organic_map = {str(doc["_id"]): doc["count"] for doc in db["reel_likes"].aggregate(pipeline)}
    except Exception:
        organic_map = {}

    likes_map = {}
    for r in reels:
        rid = str(r["_id"])
        base_likes = max(0, int(r.get("likes") or 0))
        likes_map[rid] = base_likes + organic_map.get(rid, 0)
    return likes_map


@router.websocket("/ws")
async def reel_websocket_endpoint(websocket: WebSocket):
    """Real-time WebSocket endpoint for instant live like updates across devices."""
    await reel_ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        reel_ws_manager.disconnect(websocket)


@router.post("/{reel_id}/like")
async def toggle_reel_like(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
):
    db = get_database()
    _reel_or_404(db, reel_id)

    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    visitor_id = x_visitor_id.strip() if x_visitor_id else None

    if not user_id and not visitor_id:
        client_ip = request.client.host if request.client else "unknown"
        visitor_id = f"ip_{client_ip}"

    queries = []
    if user_id:
        queries.append({"user_id": user_id})
    if visitor_id:
        queries.append({"visitor_id": visitor_id})

    existing = db["reel_likes"].find_one({"reel_id": reel_id, "$or": queries}) if queries else None

    if existing:
        db["reel_likes"].delete_one({"_id": existing["_id"]})
        liked = False
    else:
        doc = {
            "reel_id": reel_id,
            "created_at": datetime.now()
        }
        if user_id:
            doc["user_id"] = user_id
        if visitor_id:
            doc["visitor_id"] = visitor_id
        db["reel_likes"].insert_one(doc)
        liked = True

    # Invalidate cached GET /reels so subsequent requests receive the new like count
    try:
        clear_api_cache()
    except Exception:
        pass

    engagement = _engagement(db, reel_id, user_id, visitor_id)

    # Broadcast to all live connected devices/phones in real-time
    try:
        await reel_ws_manager.broadcast_like(reel_id, engagement["likes"])
    except Exception:
        pass

    return {**engagement, "liked": liked}


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
    if not doc.get("thumbnail"):
        doc["thumbnail"] = "/placeholder-reel.webp"
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

    update = {k: v for k, v in data.model_dump().items() if v is not None}
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
