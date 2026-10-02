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


def _extract_identity(
    request: Request,
    x_visitor_id: Optional[str] = None,
    x_guest_id: Optional[str] = None
) -> tuple[Optional[str], Optional[str]]:
    """Returns (user_id, visitor_id) from token, headers, query, or client fallback."""
    user = _get_optional_user(request)
    user_id = str(user.get("id")) if user else None

    visitor_id = None
    if x_visitor_id and x_visitor_id.strip():
        visitor_id = x_visitor_id.strip()
    elif x_guest_id and x_guest_id.strip():
        visitor_id = x_guest_id.strip()
    else:
        v_hdr = (
            request.headers.get("x-visitor-id")
            or request.headers.get("x-guest-id")
            or request.headers.get("X-Visitor-Id")
            or request.headers.get("X-Guest-Id")
        )
        if v_hdr and v_hdr.strip():
            visitor_id = v_hdr.strip()
        else:
            v_param = request.query_params.get("visitor_id") or request.query_params.get("guest_id")
            if v_param and v_param.strip():
                visitor_id = v_param.strip()
            elif not user_id:
                client_ip = request.client.host if request.client else "unknown"
                visitor_id = f"ip_{client_ip}"

    return user_id, visitor_id


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
    liked: Optional[bool] = False
    registered_likes: Optional[int] = 0
    guest_likes: Optional[int] = 0

    class Config:
        populate_by_name = True


class ReelLikePayload(BaseModel):
    action: Optional[str] = None  # "like", "unlike", or None/empty for toggle
    visitor_id: Optional[str] = None
    guest_id: Optional[str] = None


class ReelCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=500)


def _fmt(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


def migrate_guest_reel_likes(db, guest_id: str, user_id: str):
    """Migrate anonymous guest likes to user account upon login/register without duplicate records."""
    if not guest_id or not user_id:
        return {"migrated": 0}

    user = None
    if ObjectId.is_valid(user_id):
        user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        user = db["users"].find_one({"id": str(user_id)})

    user_name = (user.get("full_name") or user.get("name") or "Registered Customer") if user else "Registered Customer"
    user_email = user.get("email") if user else None
    user_phone = user.get("phone") if user else None

    guest_likes = list(db["reel_likes"].find({"$or": [{"visitor_id": guest_id}, {"guest_id": guest_id}]}))
    migrated_count = 0

    for gl in guest_likes:
        reel_id = gl.get("reel_id")
        if not reel_id:
            continue
        existing_user_like = db["reel_likes"].find_one({"reel_id": reel_id, "user_id": str(user_id)})
        if existing_user_like:
            db["reel_likes"].delete_one({"_id": gl["_id"]})
        else:
            db["reel_likes"].update_one(
                {"_id": gl["_id"]},
                {"$set": {
                    "user_id": str(user_id),
                    "user_name": user_name,
                    "user_email": user_email,
                    "user_phone": user_phone,
                    "is_registered": True
                }}
            )
            migrated_count += 1

        actual_cnt = db["reel_likes"].count_documents({"reel_id": reel_id})
        try:
            oid = ObjectId(reel_id) if ObjectId.is_valid(reel_id) else reel_id
            db["watch_buy_reels"].update_one({"$or": [{"_id": oid}, {"id": reel_id}]}, {"$set": {"likes": actual_cnt}})
        except Exception:
            pass

    return {"migrated": migrated_count}


@router.post("/migrate-guest-likes")
def migrate_guest_likes_endpoint(
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id"),
    current_user: dict = Depends(get_current_user)
):
    """Migrate guest likes to the currently authenticated user"""
    db = get_database()
    _, visitor_id = _extract_identity(request, x_visitor_id, x_guest_id)
    user_id = str(current_user.get("id"))
    return migrate_guest_reel_likes(db, visitor_id, user_id)


@router.get("/", response_model=List[ReelOut])
def get_reels(
    request: Request,
    active_only: bool = True,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id"),
):
    db = get_database()
    query = {"is_active": True} if active_only else {}
    collection = db["watch_buy_reels"]
    reels = list(collection.find(query).sort("order", 1))

    user_id, visitor_id = _extract_identity(request, x_visitor_id, x_guest_id)

    user_liked_reels = set()
    queries = []
    if user_id:
        queries.append({"user_id": str(user_id)})
    if visitor_id:
        queries.append({"visitor_id": visitor_id})
        queries.append({"guest_id": visitor_id})
    if queries:
        likes_docs = list(db["reel_likes"].find({"$or": queries}, {"reel_id": 1}))
        user_liked_reels = {str(d.get("reel_id")) for d in likes_docs if d.get("reel_id")}

    out = []
    for r in reels:
        rid = str(r["_id"])
        # Accurate real-time counts
        total_likes = max(0, int(r.get("likes") or 0))
        r["likes"] = total_likes
        r["views"] = str(r.get("views") or "0")
        r["liked"] = (rid in user_liked_reels)
        # Breakdown metrics for admin
        r["registered_likes"] = db["reel_likes"].count_documents({"reel_id": rid, "user_id": {"$exists": True, "$ne": None}})
        r["guest_likes"] = max(0, total_likes - r["registered_likes"])
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


def _engagement(db, reel_id: str, user_id: Optional[str] = None, visitor_id: Optional[str] = None) -> dict:
    reel = db["watch_buy_reels"].find_one({"_id": ObjectId(reel_id)}) or {}
    current_likes = max(0, int(reel.get("likes") or 0))

    liked = False
    queries = []
    if user_id:
        queries.append({"user_id": str(user_id)})
    if visitor_id:
        queries.append({"visitor_id": visitor_id})
        queries.append({"guest_id": visitor_id})
    if queries:
        liked = bool(db["reel_likes"].find_one({"reel_id": reel_id, "$or": queries}))

    return {
        "reel_id": reel_id,
        "likes": current_likes,
        "views": str(reel.get("views") or "0"),
        "comments": db["reel_comments"].count_documents({"reel_id": reel_id}),
        "liked": liked,
    }


@router.get("/{reel_id}/engagement")
def get_reel_engagement(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id"),
):
    db = get_database()
    _reel_or_404(db, reel_id)
    user_id, visitor_id = _extract_identity(request, x_visitor_id, x_guest_id)
    return _engagement(db, reel_id, user_id, visitor_id)


@router.get("/{reel_id}/engagement/me")
def get_my_reel_engagement(
    reel_id: str,
    request: Request,
    x_visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    x_guest_id: Optional[str] = Header(None, alias="X-Guest-Id"),
):
    db = get_database()
    _reel_or_404(db, reel_id)
    user_id, visitor_id = _extract_identity(request, x_visitor_id, x_guest_id)
    return _engagement(db, reel_id, user_id, visitor_id)


@router.get("/likes-sync")
def get_reels_likes_sync():
    """Lightweight real-time sync endpoint returning current likes and views map for all active reels."""
    db = get_database()
    reels = list(db["watch_buy_reels"].find({"is_active": True}, {"_id": 1, "likes": 1, "views": 1}))

    likes_map = {}
    views_map = {}
    for r in reels:
        rid = str(r["_id"])
        likes_map[rid] = max(0, int(r.get("likes") or 0))
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

    user_id, visitor_id = _extract_identity(request, x_visitor_id, x_guest_id)
    if not visitor_id and payload:
        visitor_id = payload.visitor_id or payload.guest_id

    user_info = None
    if user_id:
        try:
            user_info = db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            pass

    queries = []
    if user_id:
        queries.append({"user_id": str(user_id)})
    if visitor_id:
        queries.append({"visitor_id": visitor_id})
        queries.append({"guest_id": visitor_id})

    existing = db["reel_likes"].find_one({"reel_id": reel_id, "$or": queries}) if queries else None

    action = payload.action.lower().strip() if (payload and payload.action) else None

    user_name = (user_info.get("full_name") or user_info.get("name") or "Registered Customer") if user_info else "Registered Customer"
    user_email = user_info.get("email") if user_info else None
    user_phone = user_info.get("phone") if user_info else None

    if action == "like":
        if not existing:
            doc = {
                "reel_id": reel_id,
                "created_at": datetime.now(),
                "is_registered": bool(user_id)
            }
            if user_id:
                doc["user_id"] = str(user_id)
                doc["user_name"] = user_name
                doc["user_email"] = user_email
                doc["user_phone"] = user_phone
            if visitor_id:
                doc["visitor_id"] = visitor_id
                doc["guest_id"] = visitor_id
            try:
                db["reel_likes"].insert_one(doc)
            except Exception:
                pass  # Duplicate caught by unique index
        elif user_id and not existing.get("user_id"):
            # Upgrade guest record with registered user info
            db["reel_likes"].update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "user_id": str(user_id),
                    "user_name": user_name,
                    "user_email": user_email,
                    "user_phone": user_phone,
                    "is_registered": True
                }}
            )
        liked = True
    elif action == "unlike":
        if existing:
            db["reel_likes"].delete_one({"_id": existing["_id"]})
        liked = False
    else:
        # Default toggle behavior
        if existing:
            db["reel_likes"].delete_one({"_id": existing["_id"]})
            liked = False
        else:
            doc = {
                "reel_id": reel_id,
                "created_at": datetime.now(),
                "is_registered": bool(user_id)
            }
            if user_id:
                doc["user_id"] = str(user_id)
                doc["user_name"] = user_name
                doc["user_email"] = user_email
                doc["user_phone"] = user_phone
            if visitor_id:
                doc["visitor_id"] = visitor_id
                doc["guest_id"] = visitor_id
            try:
                db["reel_likes"].insert_one(doc)
            except Exception:
                pass
            liked = True

    # Real-time accurate recount from database collection
    actual_likes = db["reel_likes"].count_documents({"reel_id": reel_id})
    db["watch_buy_reels"].update_one(
        {"_id": oid},
        {"$set": {"likes": actual_likes}}
    )

    try:
        clear_api_cache()
    except Exception:
        pass

    engagement = _engagement(db, reel_id, user_id, visitor_id)
    engagement["likes"] = actual_likes
    engagement["liked"] = liked

    # Broadcast to all live connected devices/phones in real-time
    try:
        await reel_ws_manager.broadcast_like(reel_id, actual_likes)
    except Exception:
        pass

    return engagement


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


@router.get("/{reel_id}/likers")
def get_reel_likers(reel_id: str, _admin=Depends(require_admin)):
    """Admin only: List all users and guests who liked this reel, with profile details & timestamp."""
    db = get_database()
    _reel_or_404(db, reel_id)

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
    registered_count = 0
    guest_count = 0

    for l in likes:
        uid = l.get("user_id")
        u_info = users_map.get(uid, {}) if uid else {}
        name = l.get("user_name") or u_info.get("full_name") or u_info.get("name") or ("Registered Customer" if uid else "Guest Visitor")
        email = l.get("user_email") or u_info.get("email") or "—"
        phone = l.get("user_phone") or u_info.get("phone") or "—"
        created_at_dt = l.get("created_at")
        date_str = created_at_dt.strftime("%d %b %Y, %I:%M %p") if isinstance(created_at_dt, datetime) else str(created_at_dt or "N/A")

        is_reg = bool(uid)
        if is_reg:
            registered_count += 1
        else:
            guest_count += 1

        results.append({
            "id": str(l["_id"]),
            "user_id": uid,
            "user_name": name,
            "user_email": email,
            "user_phone": phone,
            "visitor_id": l.get("visitor_id") or l.get("guest_id"),
            "is_registered": is_reg,
            "liked_at": date_str
        })

    return {
        "reel_id": reel_id,
        "total_likes": len(results),
        "registered_likes": registered_count,
        "guest_likes": guest_count,
        "likers": results
    }
