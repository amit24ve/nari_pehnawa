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

    async def broadcast_view(self, reel_id: str, views: str):
        message = {"type": "reel_view", "reel_id": reel_id, "views": views}
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
    base_likes: Optional[int] = 0
    base_like_count: Optional[int] = 0
    guest_likes: Optional[int] = 0
    user_likes: Optional[int] = 0
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
    base_likes: Optional[int] = None
    base_like_count: Optional[int] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class ReelOut(ReelBase):
    id: str
    liked: Optional[bool] = False

    class Config:
        populate_by_name = True


class ReelLikePayload(BaseModel):
    action: Optional[str] = None  # "like", "unlike", or None/empty for toggle


class ReelCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=500)


def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


def _get_reel_likes_data(db, reel_doc: dict) -> dict:
    """
    Calculates the exact like breakdown and combined total for a reel without losing existing admin/base counts.
    Base like count is preserved as base_like_count.
    Total Likes = base_like_count + unique active likes in reel_likes collection.
    """
    reel_id = str(reel_doc.get("_id") or reel_doc.get("id"))
    
    # Base Like Count (Admin starting count)
    base_like_count = reel_doc.get("base_like_count")
    if base_like_count is None:
        base_like_count = reel_doc.get("base_likes")
    if base_like_count is None:
        base_like_count = int(reel_doc.get("likes") or 0)
    base_like_count = max(0, int(base_like_count))

    # Query active likes in reel_likes collection
    guest_likes_count = db["reel_likes"].count_documents({
        "reel_id": reel_id,
        "$or": [
            {"user_id": None},
            {"user_id": {"$exists": False}},
            {"is_registered": False}
        ]
    })

    user_likes_count = db["reel_likes"].count_documents({
        "reel_id": reel_id,
        "user_id": {"$ne": None, "$exists": True},
        "is_registered": {"$ne": False}
    })

    total_active_likes = db["reel_likes"].count_documents({"reel_id": reel_id})
    total_likes = base_like_count + total_active_likes

    return {
        "base_likes": base_like_count,
        "base_like_count": base_like_count,
        "guest_likes": guest_likes_count,
        "user_likes": user_likes_count,
        "total_likes": total_likes,
        "active_likes": total_active_likes
    }


@router.get("/", response_model=List[ReelOut])
def get_reels(
    request: Request,
    active_only: bool = True,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id")
):
    db = get_database()
    query = {"is_active": True} if active_only else {}
    collection = db["watch_buy_reels"]
    reels = list(collection.find(query).sort("order", 1))

    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    guest_id = (x_guest_id or x_visitor_id or "").strip() or None

    user_liked_reels = set()
    queries = []
    if user_id:
        queries.append({"user_id": user_id})
    if guest_id:
        queries.append({"guest_id": guest_id})
        queries.append({"visitor_id": guest_id})
    if queries:
        likes_docs = list(db["reel_likes"].find({"$or": queries}, {"reel_id": 1}))
        user_liked_reels = {str(d.get("reel_id")) for d in likes_docs if d.get("reel_id")}

    out = []
    for r in reels:
        rid = str(r["_id"])
        likes_info = _get_reel_likes_data(db, r)
        r["likes"] = likes_info["total_likes"]
        r["base_likes"] = likes_info["base_likes"]
        r["base_like_count"] = likes_info["base_like_count"]
        r["guest_likes"] = likes_info["guest_likes"]
        r["user_likes"] = likes_info["user_likes"]
        r["views"] = str(r.get("views") or "0")
        r["liked"] = (rid in user_liked_reels)
        out.append(_fmt(r))

    return out


def _reel_or_404(db, reel_id: str) -> ObjectId:
    try:
        oid = ObjectId(reel_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reel id")
    if not db["watch_buy_reels"].find_one({"_id": oid, "is_active": True}):
        raise HTTPException(status_code=404, detail="Reel not found")
    return oid


def _engagement(db, reel_id: str, user_id: Optional[str] = None, visitor_id: Optional[str] = None, guest_id: Optional[str] = None) -> dict:
    oid = ObjectId(reel_id) if ObjectId.is_valid(reel_id) else reel_id
    reel = db["watch_buy_reels"].find_one({"_id": oid}) or {}
    likes_info = _get_reel_likes_data(db, reel)

    g_id = guest_id or visitor_id
    liked = False
    queries = []
    if user_id:
        queries.append({"user_id": str(user_id)})
    if g_id:
        queries.append({"guest_id": str(g_id)})
        queries.append({"visitor_id": str(g_id)})

    if queries:
        liked = bool(db["reel_likes"].find_one({"reel_id": str(reel_id), "$or": queries}))

    return {
        "reel_id": str(reel_id),
        "likes": likes_info["total_likes"],
        "base_likes": likes_info["base_likes"],
        "base_like_count": likes_info["base_like_count"],
        "guest_likes": likes_info["guest_likes"],
        "user_likes": likes_info["user_likes"],
        "views": str(reel.get("views") or "0"),
        "comments": db["reel_comments"].count_documents({"reel_id": str(reel_id)}),
        "liked": liked,
        "breakdown": {
            "total": likes_info["total_likes"],
            "base": likes_info["base_likes"],
            "guest": likes_info["guest_likes"],
            "user": likes_info["user_likes"]
        }
    }


@router.get("/{reel_id}/engagement")
def get_reel_engagement(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id")
):
    db = get_database()
    _reel_or_404(db, reel_id)
    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    guest_id = (x_guest_id or x_visitor_id or "").strip() or None
    return _engagement(db, reel_id, user_id, guest_id, guest_id)


@router.get("/{reel_id}/engagement/me")
def get_my_reel_engagement(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id")
):
    db = get_database()
    _reel_or_404(db, reel_id)
    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    guest_id = (x_guest_id or x_visitor_id or "").strip() or None
    return _engagement(db, reel_id, user_id, guest_id, guest_id)


@router.get("/{reel_id}/like-status")
def get_reel_like_status(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id")
):
    """Check like status and get total like count with breakdown for a reel"""
    db = get_database()
    _reel_or_404(db, reel_id)
    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    guest_id = (x_guest_id or x_visitor_id or "").strip() or None
    return _engagement(db, reel_id, user_id, guest_id, guest_id)


@router.get("/likes-sync")
def get_reels_likes_sync():
    """Lightweight real-time sync endpoint returning current total likes and views map for all active reels."""
    db = get_database()
    reels = list(db["watch_buy_reels"].find({"is_active": True}))

    likes_map = {}
    views_map = {}
    for r in reels:
        rid = str(r["_id"])
        likes_info = _get_reel_likes_data(db, r)
        likes_map[rid] = likes_info["total_likes"]
        views_map[rid] = str(r.get("views") or "0")
    return {"likes": likes_map, "views": views_map}


@router.websocket("/ws")
async def reel_websocket_endpoint(websocket: WebSocket):
    """Real-time WebSocket endpoint for instant live like updates across devices."""
    await reel_ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        reel_ws_manager.disconnect(websocket)


@router.post("/{reel_id}/view")
async def record_reel_view(reel_id: str):
    """Increment reel view count in MongoDB and broadcast to live viewers."""
    db = get_database()
    oid = _reel_or_404(db, reel_id)
    reel = db["watch_buy_reels"].find_one({"_id": oid}) or {}

    cur_views_str = str(reel.get("views") or "0")
    try:
        cur_num = int("".join([c for c in cur_views_str if c.isdigit()]) or "0")
    except Exception:
        cur_num = 0
    new_views_num = cur_num + 1
    new_views_str = str(new_views_num)

    db["watch_buy_reels"].update_one(
        {"_id": oid},
        {"$set": {"views": new_views_str}}
    )
    clear_api_cache()

    try:
        await reel_ws_manager.broadcast_view(reel_id, new_views_str)
    except Exception:
        pass

    return {"reel_id": reel_id, "views": new_views_str}


@router.post("/{reel_id}/like")
async def toggle_reel_like(
    reel_id: str,
    request: Request,
    payload: Optional[ReelLikePayload] = None,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id"),
):
    db = get_database()
    oid = _reel_or_404(db, reel_id)

    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None
    guest_id = (x_guest_id or x_visitor_id or "").strip() or None

    if not user_id and not guest_id:
        client_ip = request.client.host if request.client else "unknown"
        guest_id = f"ip_{client_ip}"

    user_info = None
    if user_id:
        try:
            from bson import ObjectId
            user_info = db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            pass

    queries = []
    if user_id:
        queries.append({"user_id": user_id})
    if guest_id:
        queries.append({"guest_id": guest_id})
        queries.append({"visitor_id": guest_id})

    existing = db["reel_likes"].find_one({"reel_id": reel_id, "$or": queries}) if queries else None

    action = payload.action.lower().strip() if (payload and payload.action) else None

    if action == "like":
        if not existing:
            doc = {
                "reel_id": reel_id,
                "created_at": datetime.now(),
                "is_registered": bool(user_id),
            }
            if user_id:
                doc["user_id"] = user_id
                doc["user_name"] = (user_info.get("full_name") or user_info.get("name") or user.get("name") or "Registered Customer") if (user_info or user) else "Registered Customer"
                doc["user_email"] = (user_info.get("email") or user.get("email")) if (user_info or user) else None
                doc["user_phone"] = (user_info.get("phone") or user.get("phone")) if (user_info or user) else None
            if guest_id:
                doc["guest_id"] = guest_id
                doc["visitor_id"] = guest_id
            db["reel_likes"].insert_one(doc)
        liked = True
    elif action == "unlike":
        if existing:
            db["reel_likes"].delete_one({"_id": existing["_id"]})
        liked = False
    else:
        # Default toggle
        if existing:
            db["reel_likes"].delete_one({"_id": existing["_id"]})
            liked = False
        else:
            doc = {
                "reel_id": reel_id,
                "created_at": datetime.now(),
                "is_registered": bool(user_id),
            }
            if user_id:
                doc["user_id"] = user_id
                doc["user_name"] = (user_info.get("full_name") or user_info.get("name") or user.get("name") or "Registered Customer") if (user_info or user) else "Registered Customer"
                doc["user_email"] = (user_info.get("email") or user.get("email")) if (user_info or user) else None
                doc["user_phone"] = (user_info.get("phone") or user.get("phone")) if (user_info or user) else None
            if guest_id:
                doc["guest_id"] = guest_id
                doc["visitor_id"] = guest_id
            db["reel_likes"].insert_one(doc)
            liked = True

    # Recalculate total likes without overwriting/decreasing base likes
    reel_doc = db["watch_buy_reels"].find_one({"_id": oid}) or {}
    likes_info = _get_reel_likes_data(db, reel_doc)

    db["watch_buy_reels"].update_one(
        {"_id": oid},
        {"$set": {
            "likes": likes_info["total_likes"],
            "base_like_count": likes_info["base_like_count"],
            "base_likes": likes_info["base_likes"]
        }}
    )

    clear_api_cache()

    # Broadcast to all live connected devices/phones in real-time
    try:
        await reel_ws_manager.broadcast_like(reel_id, likes_info["total_likes"])
    except Exception:
        pass

    engagement = _engagement(db, reel_id, user_id, guest_id, guest_id)
    return {**engagement, "liked": liked}


@router.delete("/{reel_id}/like")
async def remove_reel_like(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id")
):
    """Explicit endpoint to unlike a reel"""
    payload = ReelLikePayload(action="unlike")
    return await toggle_reel_like(reel_id, request, payload, x_visitor_id, x_guest_id)


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
    
    admin_likes = int(doc.get("likes") or 0)
    doc["base_like_count"] = admin_likes
    doc["base_likes"] = admin_likes
    doc["likes"] = admin_likes
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

    # If admin specified likes, update base_like_count and recalculate total
    if "likes" in update:
        new_base = max(0, int(update.pop("likes")))
        update["base_like_count"] = new_base
        update["base_likes"] = new_base
        user_likes_count = db["reel_likes"].count_documents({"reel_id": reel_id})
        update["likes"] = new_base + user_likes_count

    result = db["watch_buy_reels"].find_one_and_update(
        filter_q, {"$set": update}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    clear_api_cache()
    likes_info = _get_reel_likes_data(db, result)
    result["likes"] = likes_info["total_likes"]
    result["base_likes"] = likes_info["base_likes"]
    result["base_like_count"] = likes_info["base_like_count"]
    result["guest_likes"] = likes_info["guest_likes"]
    result["user_likes"] = likes_info["user_likes"]
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
    # Clean up associated likes
    db["reel_likes"].delete_many({"reel_id": reel_id})
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


@router.get("/{reel_id}/likers")
def get_reel_likers(reel_id: str, _admin=Depends(require_admin)):
    """Admin only: List all users who liked this reel, with profile details, breakdown & timestamp."""
    db = get_database()
    oid = _reel_or_404(db, reel_id)
    reel = db["watch_buy_reels"].find_one({"_id": oid}) or {}
    likes_info = _get_reel_likes_data(db, reel)

    likes = list(db["reel_likes"].find({"reel_id": reel_id}).sort("created_at", -1))

    # Fetch users in batch
    from bson import ObjectId
    user_ids = []
    for l in likes:
        uid = l.get("user_id")
        if uid and ObjectId.is_valid(uid):
            user_ids.append(ObjectId(uid))

    users_map = {}
    if user_ids:
        for u in db["users"].find({"_id": {"$in": user_ids}}):
            users_map[str(u["_id"])] = u

    results = []
    for l in likes:
        uid = l.get("user_id")
        u_info = users_map.get(uid, {}) if uid else {}
        name = l.get("user_name") or u_info.get("full_name") or u_info.get("name") or ("Registered Customer" if uid else "Guest Visitor")
        email = l.get("user_email") or u_info.get("email") or "—"
        phone = l.get("user_phone") or u_info.get("phone") or "—"
        created_at_dt = l.get("created_at")
        date_str = created_at_dt.strftime("%d %b %Y, %I:%M %p") if isinstance(created_at_dt, datetime) else str(created_at_dt or "N/A")

        results.append({
            "id": str(l["_id"]),
            "user_id": uid,
            "user_name": name,
            "user_email": email,
            "user_phone": phone,
            "guest_id": l.get("guest_id") or l.get("visitor_id"),
            "visitor_id": l.get("visitor_id") or l.get("guest_id"),
            "is_registered": bool(uid),
            "liked_at": date_str
        })

    return {
        "reel_id": reel_id,
        "total_likes": likes_info["total_likes"],
        "base_likes": likes_info["base_likes"],
        "base_like_count": likes_info["base_like_count"],
        "guest_likes": likes_info["guest_likes"],
        "user_likes": likes_info["user_likes"],
        "likers": results
    }
