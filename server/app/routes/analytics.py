from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from pydantic import BaseModel
import re
import httpx
from bson import ObjectId

from app.database import get_database
from app.security import require_admin
from app.database.schemas.analytics_models import (
    GeoData, DeviceData, UtmParameters, TrafficData, PerformanceData, SecurityData,
    VisitorCreate, SessionCreate, PageViewCreate, ClickHeatmapCreate, CustomEventCreate,
    FormIntelligenceCreate, ConversionCreate, AIInsightCreate
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Global WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except Exception:
                try:
                    self.active_connections.remove(connection)
                except ValueError:
                    pass

manager = ConnectionManager()

# Helper: Clean MongoDB Document for JSON
def clean_db_doc(doc):
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# User-Agent Parser
def parse_user_agent(ua_string: str) -> dict:
    if not ua_string:
        return {
            "browser": "Unknown",
            "browser_version": "Unknown",
            "os": "Unknown",
            "device_type": "Desktop"
        }
    
    device_type = "Desktop"
    if re.search(r"Mobi|Android|iPhone|iPad", ua_string, re.IGNORECASE):
        if re.search(r"iPad|Tablet", ua_string, re.IGNORECASE):
            device_type = "Tablet"
        else:
            device_type = "Mobile"
            
    os_name = "Unknown"
    if "Windows" in ua_string:
        os_name = "Windows"
    elif "Android" in ua_string:
        os_name = "Android"
    elif "iPhone" in ua_string or "iPad" in ua_string:
        os_name = "iOS"
    elif "Macintosh" in ua_string or "Mac OS" in ua_string:
        os_name = "macOS"
    elif "Linux" in ua_string:
        os_name = "Linux"
        
    browser_name = "Unknown"
    browser_version = "Unknown"
    
    if "Edg/" in ua_string:
        browser_name = "Edge"
        match = re.search(r"Edg/([0-9\.]+)", ua_string)
        if match:
            browser_version = match.group(1)
    elif "Chrome/" in ua_string or "Chromium/" in ua_string:
        browser_name = "Chrome"
        match = re.search(r"(?:Chrome|Chromium)/([0-9\.]+)", ua_string)
        if match:
            browser_version = match.group(1)
    elif "Firefox/" in ua_string:
        browser_name = "Firefox"
        match = re.search(r"Firefox/([0-9\.]+)", ua_string)
        if match:
            browser_version = match.group(1)
    elif "Safari/" in ua_string and "Chrome/" not in ua_string:
        browser_name = "Safari"
        match = re.search(r"Version/([0-9\.]+)", ua_string)
        if match:
            browser_version = match.group(1)
            
    return {
        "browser": browser_name,
        "browser_version": browser_version,
        "os": os_name,
        "device_type": device_type
    }

# Geolocation Lookup
async def get_geolocation(ip: str) -> dict:
    if not ip or ip in ("127.0.0.1", "localhost", "::1", "testclient"):
        return {
            "country": "India",
            "state": "Maharashtra",
            "city": "Mumbai",
            "postal_code": "400001",
            "timezone": "Asia/Kolkata",
            "isp": "Reliance Jio Infocomm",
            "network_type": "WiFi",
            "lat": 19.076,
            "lon": 72.8777,
            "ip": "127.0.0.1",
            "vpn_detected": False
        }
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"http://ip-api.com/json/{ip}")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "country": data.get("country", "Unknown"),
                        "state": data.get("regionName", "Unknown"),
                        "city": data.get("city", "Unknown"),
                        "postal_code": data.get("zip", "Unknown"),
                        "timezone": data.get("timezone", "Unknown"),
                        "isp": data.get("isp", "Unknown"),
                        "network_type": "Cellular" if data.get("mobile") else "Broadband",
                        "lat": data.get("lat", 0.0),
                        "lon": data.get("lon", 0.0),
                        "ip": ip,
                        "vpn_detected": data.get("proxy", False)
                    }
    except Exception as e:
        print(f"Error fetching geolocation for {ip}: {e}")
    return {
        "country": "Unknown",
        "state": "Unknown",
        "city": "Unknown",
        "postal_code": "Unknown",
        "timezone": "Unknown",
        "isp": "Unknown",
        "network_type": "Unknown",
        "lat": 0.0,
        "lon": 0.0,
        "ip": ip,
        "vpn_detected": False
    }

# Auto Archiver
def archive_old_data(db):
    try:
        ninety_days_ago = datetime.now() - timedelta(days=90)
        db["pageviews"].delete_many({"entered_at": {"$lt": ninety_days_ago}})
        db["events"].delete_many({"created_at": {"$lt": ninety_days_ago}})
        db["clicks"].delete_many({"timestamp": {"$lt": ninety_days_ago}})
        db["scrolls"].delete_many({"timestamp": {"$lt": ninety_days_ago}})
    except Exception as e:
        print("Data archiving error:", e)

# Ensure Indexes Created
_indexes_created = False
def _ensure_indexes(db):
    global _indexes_created
    if _indexes_created:
        return
    db["visitors"].create_index("visitor_id", unique=True)
    db["visitors"].create_index("user_id")
    db["sessions"].create_index("session_id", unique=True)
    db["sessions"].create_index("visitor_id")
    db["pageviews"].create_index("visitor_id")
    db["pageviews"].create_index("session_id")
    db["events"].create_index("visitor_id")
    db["events"].create_index("session_id")
    db["clicks"].create_index("session_id")
    db["scrolls"].create_index("session_id")
    _indexes_created = True

# Request Payloads
class SessionStartRequest(BaseModel):
    visitor_id: str
    session_id: str
    user_id: Optional[str] = None
    referrer: Optional[str] = None
    traffic_source: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    landing_page: Optional[str] = None
    screen_resolution: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None

class TrackRequest(BaseModel):
    visitor_id: str
    session_id: str
    path: str
    title: Optional[str] = None
    referrer: Optional[str] = None
    time_spent: Optional[int] = 0
    scroll_percentage: Optional[float] = 0.0

class EventRequest(BaseModel):
    visitor_id: str
    session_id: str
    event_type: str
    event_data: Dict[str, Any] = {}
    path: str

class ClickHeatmapRequest(BaseModel):
    visitor_id: str
    session_id: str
    path: str
    x: float
    y: float
    target_tag: Optional[str] = None
    target_text: Optional[str] = None

class ScrollHeatmapRequest(BaseModel):
    visitor_id: str
    session_id: str
    path: str
    max_scroll: float

class PerformanceRequest(BaseModel):
    visitor_id: str
    session_id: str
    path: str
    page_load_time: Optional[float] = None
    api_response_time: Optional[float] = None
    error_log: Optional[Dict[str, Any]] = None

class SecurityRequest(BaseModel):
    visitor_id: str
    session_id: str
    alert_type: str
    details: Dict[str, Any] = {}

class MergeRequest(BaseModel):
    visitor_id: str
    user_id: str
    login_status: str

# API Endpoints

@router.post("/session")
async def start_session(payload: SessionStartRequest, request: Request, bg_tasks: BackgroundTasks):
    db = get_database()
    _ensure_indexes(db)
    
    # Archive old data (older than 90 days) in background
    bg_tasks.add_task(archive_old_data, db)

    # Get IP Address
    x_forwarded_for = request.headers.get("x-forwarded-for")
    ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else (request.headers.get("x-real-ip") or (request.client.host if request.client else ""))
    
    ua = request.headers.get("user-agent", "")
    geo_info = await get_geolocation(ip)
    device_info = parse_user_agent(ua)

    if payload.screen_resolution:
        device_info["screen_resolution"] = payload.screen_resolution
    device_info["language"] = payload.language or request.headers.get("accept-language", "").split(",")[0]
    device_info["timezone"] = payload.timezone or "Unknown"

    login_status = "Guest"
    if payload.user_id:
        login_status = "Registered User"
    elif request.headers.get("Authorization"):
        login_status = "Logged User"

    # Upsert Visitor record
    visitor_exists = db["visitors"].find_one({"visitor_id": payload.visitor_id})
    returning = False
    if visitor_exists:
        returning = True
        db["visitors"].update_one(
            {"visitor_id": payload.visitor_id},
            {
                "$set": {
                    "last_seen": datetime.now(),
                    "user_id": payload.user_id or visitor_exists.get("user_id"),
                    "login_status": login_status,
                    "geo": geo_info
                },
                "$inc": {"total_visits": 1}
            }
        )
    else:
        db["visitors"].insert_one({
            "visitor_id": payload.visitor_id,
            "user_id": payload.user_id,
            "first_seen": datetime.now(),
            "last_seen": datetime.now(),
            "total_visits": 1,
            "login_status": login_status,
            "geo": geo_info,
            "device": device_info,
            "security": {
                "suspicious_requests": [],
                "login_attempts": 0,
                "bot_detected": "bot" in ua.lower() or "crawler" in ua.lower(),
                "vpn_detected": geo_info.get("vpn_detected", False)
            },
            "product_clicks": {},
            "recently_viewed_products": [],
            "search_history": []
        })

    # Track session duration of previous sessions
    prev_session_duration = 0
    last_session = db["sessions"].find_one({"visitor_id": payload.visitor_id}, sort=[("start_time", -1)])
    if last_session:
        prev_session_duration = last_session.get("duration", 0)

    # Insert Session record
    db["sessions"].update_one(
        {"session_id": payload.session_id},
        {"$setOnInsert": {
            "session_id": payload.session_id,
            "visitor_id": payload.visitor_id,
            "user_id": payload.user_id,
            "start_time": datetime.now(),
            "end_time": None,
            "duration": 0,
            "previous_session_duration": prev_session_duration,
            "bounce": True,
            "returning_visitor": returning,
            "new_visitor": not returning,
            "traffic": {
                "source": payload.traffic_source or "Direct",
                "referrer": payload.referrer,
                "utm_parameters": {
                    "source": payload.utm_source,
                    "medium": payload.utm_medium,
                    "campaign": payload.utm_campaign,
                    "term": payload.utm_term,
                    "content": payload.utm_content
                },
                "keyword": payload.utm_term
            },
            "landing_page": payload.landing_page or "/",
            "exit_page": payload.landing_page or "/",
            "performance": {
                "page_load_time": None,
                "api_response_time": None,
                "slow_pages": [],
                "errors": [],
                "crash_logs": []
            },
            "cart_value": 0.0,
            "added_products": [],
            "removed_products": [],
            "abandoned_cart": False
        }},
        upsert=True
    )

    # Broadcast Live Activity to WebSocket
    live_event = {
        "type": "session_start",
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "geo": geo_info,
        "device": device_info,
        "path": payload.landing_page or "/",
        "timestamp": datetime.now().isoformat(),
        "returning": returning
    }
    await manager.broadcast(live_event)

    return {"success": True, "returning": returning}

@router.post("/track")
async def track_pageview(payload: TrackRequest):
    if payload.path.startswith("/admin"):
        return {"success": False, "reason": "admin paths are not tracked"}
        
    db = get_database()
    
    # Update previous pageviews if time_spent was passed
    if payload.time_spent and payload.time_spent > 0:
        db["pageviews"].update_many(
            {"session_id": payload.session_id, "visitor_id": payload.visitor_id, "exited_at": None},
            {"$set": {
                "exited_at": datetime.now(),
                "time_spent": payload.time_spent,
                "scroll_percentage": payload.scroll_percentage
            }}
        )

    # Insert new pageview
    db["pageviews"].insert_one({
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "path": payload.path,
        "title": payload.title,
        "referrer": payload.referrer,
        "entered_at": datetime.now(),
        "exited_at": None,
        "time_spent": 0,
        "scroll_percentage": 0.0
    })

    # Update session duration and exit page
    session = db["sessions"].find_one({"session_id": payload.session_id})
    if session:
        start_time = session.get("start_time", datetime.now())
        duration = int((datetime.now() - start_time).total_seconds())
        
        pv_count = db["pageviews"].count_documents({"session_id": payload.session_id})
        bounce = pv_count <= 1
        
        db["sessions"].update_one(
            {"session_id": payload.session_id},
            {
                "$set": {
                    "end_time": datetime.now(),
                    "duration": max(duration, 0),
                    "exit_page": payload.path,
                    "bounce": bounce
                }
            }
        )

    # Broadcast live update
    live_event = {
        "type": "pageview",
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "path": payload.path,
        "title": payload.title,
        "timestamp": datetime.now().isoformat()
    }
    await manager.broadcast(live_event)

    return {"success": True}

@router.post("/event")
async def track_event(payload: EventRequest):
    db = get_database()
    
    # Save Event
    db["events"].insert_one({
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "event_type": payload.event_type,
        "event_data": payload.event_data,
        "path": payload.path,
        "created_at": datetime.now()
    })

    # Handle Search Keywords
    if payload.event_type == "search":
        q = payload.event_data.get("query")
        if q:
            db["visitors"].update_one(
                {"visitor_id": payload.visitor_id},
                {"$push": {"search_history": {"$each": [q], "$slice": -20}}}
            )

    # Handle Product View Clicks
    if payload.event_type == "product_click":
        pid = payload.event_data.get("product_id")
        if pid:
            db["visitors"].update_one(
                {"visitor_id": payload.visitor_id},
                {
                    "$inc": {f"product_clicks.{pid}": 1},
                    "$push": {"recently_viewed_products": {"$each": [pid], "$slice": -5}}
                }
            )

    # Handle Cart Operations & Value tracking
    if payload.event_type == "cart_add":
        pid = payload.event_data.get("product_id")
        price = float(payload.event_data.get("price", 0.0))
        qty = int(payload.event_data.get("quantity", 1))
        
        db["sessions"].update_one(
            {"session_id": payload.session_id},
            {
                "$push": {"added_products": pid},
                "$inc": {"cart_value": price * qty},
                "$set": {"abandoned_cart": True}
            }
        )

    if payload.event_type == "cart_remove":
        pid = payload.event_data.get("product_id")
        price = float(payload.event_data.get("price", 0.0))
        qty = int(payload.event_data.get("quantity", 1))
        
        db["sessions"].update_one(
            {"session_id": payload.session_id},
            {
                "$push": {"removed_products": pid},
                "$inc": {"cart_value": -price * qty}
            }
        )

    # Conversions
    if payload.event_type in ("purchase", "checkout_complete", "conversion"):
        revenue = float(payload.event_data.get("revenue", 0.0))
        db["conversions"].insert_one({
            "visitor_id": payload.visitor_id,
            "session_id": payload.session_id,
            "conversion_type": payload.event_type,
            "revenue": revenue,
            "details": payload.event_data,
            "created_at": datetime.now()
        })
        
        # Checkout successful -> no longer an abandoned cart
        db["sessions"].update_one(
            {"session_id": payload.session_id},
            {"$set": {"abandoned_cart": False}}
        )

    # Broadcast event to WebSocket
    live_event = {
        "type": "event",
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "event_type": payload.event_type,
        "event_data": payload.event_data,
        "path": payload.path,
        "timestamp": datetime.now().isoformat()
    }
    await manager.broadcast(live_event)

    return {"success": True}

@router.post("/heatmap/click")
async def track_heatmap_click(payload: ClickHeatmapRequest):
    db = get_database()
    db["clicks"].insert_one({
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "path": payload.path,
        "x": payload.x,
        "y": payload.y,
        "target_tag": payload.target_tag,
        "target_text": payload.target_text,
        "timestamp": datetime.now()
    })
    return {"success": True}

@router.post("/heatmap/scroll")
async def track_heatmap_scroll(payload: ScrollHeatmapRequest):
    db = get_database()
    db["scrolls"].insert_one({
        "visitor_id": payload.visitor_id,
        "session_id": payload.session_id,
        "path": payload.path,
        "max_scroll": payload.max_scroll,
        "timestamp": datetime.now()
    })
    return {"success": True}

@router.post("/performance")
async def track_performance(payload: PerformanceRequest):
    db = get_database()
    
    update_query = {}
    if payload.page_load_time is not None:
        update_query["performance.page_load_time"] = payload.page_load_time
    if payload.api_response_time is not None:
        update_query["performance.api_response_time"] = payload.api_response_time
        
    if payload.error_log:
        update_query["performance.errors"] = payload.error_log
        
    if update_query:
        db["sessions"].update_one(
            {"session_id": payload.session_id},
            {"$set": update_query}
        )
    return {"success": True}

@router.post("/security")
async def track_security(payload: SecurityRequest):
    db = get_database()
    
    db["visitors"].update_one(
        {"visitor_id": payload.visitor_id},
        {
            "$push": {"security.suspicious_requests": payload.details},
            "$set": {
                "security.bot_detected": payload.alert_type == "bot_detected",
                "security.vpn_detected": payload.alert_type == "vpn_detected"
            }
        }
    )
    return {"success": True}

@router.post("/merge")
async def merge_visitor(payload: MergeRequest):
    db = get_database()
    
    # 1. Update visitor credentials and status
    db["visitors"].update_one(
        {"visitor_id": payload.visitor_id},
        {"$set": {
            "user_id": payload.user_id,
            "login_status": payload.login_status
        }}
    )
    
    # 2. Link all visitor sessions to user ID
    db["sessions"].update_many(
        {"visitor_id": payload.visitor_id},
        {"$set": {"user_id": payload.user_id}}
    )
    
    return {"success": True}

# WebSockets Endpoint
@router.websocket("/live-ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Analytics Intelligence Dashboard Compiler

@router.get("/visitor-dashboard")
def get_visitor_intelligence_dashboard(
    date_range: str = "7d",
    country: Optional[str] = None,
    browser: Optional[str] = None,
    os: Optional[str] = None,
    device: Optional[str] = None,
    source: Optional[str] = None,
    visitor_type: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    db = get_database()
    
    # Date Filtering Helper
    now = datetime.now()
    session_filters = {}
    pageview_filters = {}
    event_filters = {}
    conversion_filters = {}

    if date_range != "all":
        if date_range == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif date_range == "24h":
            start_date = now - timedelta(hours=24)
        elif date_range == "yesterday":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
            now = now.replace(hour=23, minute=59, second=59, microsecond=999) - timedelta(days=1)
        elif date_range == "30d":
            start_date = now - timedelta(days=30)
        else: # Default 7d
            start_date = now - timedelta(days=7)
            
        session_filters["start_time"] = {"$gte": start_date, "$lte": now}
        pageview_filters["entered_at"] = {"$gte": start_date, "$lte": now}
        event_filters["created_at"] = {"$gte": start_date, "$lte": now}
        conversion_filters["created_at"] = {"$gte": start_date, "$lte": now}
    else:
        start_date = datetime.min
        session_filters["start_time"] = {"$lte": now}
        pageview_filters["entered_at"] = {"$lte": now}
        event_filters["created_at"] = {"$lte": now}
        conversion_filters["created_at"] = {"$lte": now}
    
    # Compile Visitor Query Filters
    visitor_ids = []
    
    if country or browser or os or device:
        v_filters = {}
        if country:
            v_filters["geo.country"] = country
        if browser:
            v_filters["device.browser"] = browser
        if os:
            v_filters["device.os"] = os
        if device:
            v_filters["device.device_type"] = device
            
        visitor_ids = db["visitors"].distinct("visitor_id", v_filters)
        session_filters["visitor_id"] = {"$in": visitor_ids}

    if source:
        session_filters["traffic.source"] = source
    if visitor_type:
        if visitor_type == "new":
            session_filters["new_visitor"] = True
        elif visitor_type == "returning":
            session_filters["returning_visitor"] = True

    # 1. Live Counters
    five_mins_ago = datetime.now() - timedelta(minutes=5)
    active_visitors = len(db["pageviews"].distinct("visitor_id", {"entered_at": {"$gte": five_mins_ago}}))

    # 2. Total Visitor Metrics
    total_sessions = db["sessions"].count_documents(session_filters)
    total_pageviews = db["pageviews"].count_documents(pageview_filters)
    total_visitors = len(db["sessions"].distinct("visitor_id", session_filters))

    # Returning vs New count
    new_visitors = db["sessions"].count_documents({**session_filters, "new_visitor": True})
    returning_visitors = db["sessions"].count_documents({**session_filters, "returning_visitor": True})

    # Bounce Rate
    bounce_sessions = db["sessions"].count_documents({**session_filters, "bounce": True})
    bounce_rate = round((bounce_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0.0

    # Avg Session Time & Pages per Visit
    sessions_cursor = list(db["sessions"].find(session_filters, {"duration": 1}))
    total_duration = sum(s.get("duration", 0) for s in sessions_cursor)
    avg_session_time = round(total_duration / total_sessions, 1) if total_sessions > 0 else 0.0
    avg_pages_per_visit = round(total_pageviews / total_sessions, 1) if total_sessions > 0 else 0.0

    # 3. Country / City Breakdowns
    v_ids = db["sessions"].distinct("visitor_id", session_filters)
    countries_cursor = db["visitors"].aggregate([
        {"$match": {"visitor_id": {"$in": v_ids}}},
        {"$group": {"_id": "$geo.country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    countries = [{"country": c["_id"] or "Unknown", "count": c["count"]} for c in countries_cursor]

    states_cursor = db["visitors"].aggregate([
        {"$match": {"visitor_id": {"$in": v_ids}}},
        {"$group": {"_id": "$geo.state", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    states = [{"state": s["_id"] or "Unknown", "count": s["count"]} for s in states_cursor]

    cities_cursor = db["visitors"].aggregate([
        {"$match": {"visitor_id": {"$in": v_ids}}},
        {"$group": {"_id": "$geo.city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    cities = [{"city": c["_id"] or "Unknown", "count": c["count"]} for c in cities_cursor]

    # 4. Device & Browser Breakdowns
    devices_cursor = db["visitors"].aggregate([
        {"$match": {"visitor_id": {"$in": v_ids}}},
        {"$group": {"_id": "$device.device_type", "count": {"$sum": 1}}}
    ])
    devices = [{"device_type": d["_id"] or "Desktop", "count": d["count"]} for d in devices_cursor]

    browsers_cursor = db["visitors"].aggregate([
        {"$match": {"visitor_id": {"$in": v_ids}}},
        {"$group": {"_id": "$device.browser", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    browsers = [{"browser": b["_id"] or "Unknown", "count": b["count"]} for b in browsers_cursor]

    os_cursor = db["visitors"].aggregate([
        {"$match": {"visitor_id": {"$in": v_ids}}},
        {"$group": {"_id": "$device.os", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    operating_systems = [{"os": o["_id"] or "Unknown", "count": o["count"]} for o in os_cursor]

    # 5. Traffic Sources
    sources_cursor = db["sessions"].aggregate([
        {"$match": session_filters},
        {"$group": {"_id": "$traffic.source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ])
    traffic_sources = [{"source": s["_id"] or "Direct", "count": s["count"]} for s in sources_cursor]

    # 6. Conversion Funnel
    funnel_prod_views = len(db["pageviews"].distinct("session_id", {**pageview_filters, "path": {"$regex": "^/product/"}}))
    funnel_cart_adds = len(db["events"].distinct("session_id", {**event_filters, "event_type": "cart_add"}))
    funnel_purchases = db["conversions"].count_documents(conversion_filters)
    
    funnel = [
        {"stage": "Total Sessions", "count": total_sessions},
        {"stage": "Product Clicks", "count": funnel_prod_views},
        {"stage": "Cart Additions", "count": funnel_cart_adds},
        {"stage": "Purchased Sales", "count": funnel_purchases}
    ]

    # 7. Visitor Journeys Table (with Searching/Pagination)
    search_filters = {}
    if search:
        search_filters = {"$or": [
            {"visitor_id": {"$regex": search, "$options": "i"}},
            {"geo.country": {"$regex": search, "$options": "i"}},
            {"geo.city": {"$regex": search, "$options": "i"}},
            {"device.browser": {"$regex": search, "$options": "i"}},
            {"device.os": {"$regex": search, "$options": "i"}}
        ]}

    # Filter visitor IDs based on search
    if search:
        searched_v_ids = db["visitors"].distinct("visitor_id", search_filters)
        session_filters["visitor_id"] = {"$in": searched_v_ids}

    # Fetch sessions
    total_filtered_sessions = db["sessions"].count_documents(session_filters)
    journeys_cursor = list(db["sessions"].find(session_filters).sort("start_time", -1).skip((page - 1) * limit).limit(limit))
    
    journeys = []
    for s in journeys_cursor:
        visitor = db["visitors"].find_one({"visitor_id": s["visitor_id"]})
        pvs = list(db["pageviews"].find({"session_id": s["session_id"]}).sort("entered_at", 1))
        
        journeys.append({
            "session_id": s["session_id"],
            "visitor_id": s["visitor_id"],
            "start_time": s["start_time"],
            "duration": s["duration"],
            "referrer": s.get("traffic", {}).get("referrer") or "Direct",
            "geo": visitor.get("geo") if visitor else None,
            "device": visitor.get("device") if visitor else None,
            "pages": [p["path"] for p in pvs],
            "bounce": s.get("bounce", True),
            "status": visitor.get("login_status", "Guest") if visitor else "Guest"
        })

    # 8. Charts: Hourly / Daily visitors
    charts = {
        "dates": [],
        "pageviews": [],
        "visitors": []
    }
    for i in range(date_range == "30d" and 30 or 7, -1, -1):
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        pv = db["pageviews"].count_documents({"entered_at": {"$gte": day_start, "$lt": day_end}})
        uv = len(db["sessions"].distinct("visitor_id", {"start_time": {"$gte": day_start, "$lt": day_end}}))
        
        charts["dates"].append(day_start.strftime("%Y-%m-%d"))
        charts["pageviews"].append(pv)
        charts["visitors"].append(uv)

    # 9. Top pages
    pages_cursor = db["pageviews"].aggregate([
        {"$match": pageview_filters},
        {"$group": {"_id": "$path", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    top_pages = [{"path": p["_id"], "count": p["count"]} for p in pages_cursor]

    # 10. Top products
    product_views_cursor = db["pageviews"].aggregate([
        {"$match": {**pageview_filters, "path": {"$regex": "^/product/"}}},
        {"$group": {"_id": "$path", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    top_products = []
    for p in product_views_cursor:
        path = p["_id"]
        prod_id = path.split("/")[-1]
        top_products.append({"product_id": prod_id, "path": path, "count": p["count"]})

    return {
        "active_visitors": active_visitors,
        "total_sessions": total_sessions,
        "total_pageviews": total_pageviews,
        "total_visitors": total_visitors,
        "new_visitors": new_visitors,
        "returning_visitors": returning_visitors,
        "bounce_rate": bounce_rate,
        "avg_session_time": avg_session_time,
        "avg_pages_per_visit": avg_pages_per_visit,
        "countries": countries,
        "states": states,
        "cities": cities,
        "devices": devices,
        "browsers": browsers,
        "operating_systems": operating_systems,
        "traffic_sources": traffic_sources,
        "funnel": funnel,
        "top_pages": top_pages,
        "top_products": top_products,
        "charts": charts,
        "journeys": journeys,
        "pagination": {
            "total": total_filtered_sessions,
            "page": page,
            "pages": (total_filtered_sessions + limit - 1) // limit
        }
    }

@router.get("/visitor/{visitor_id}")
def get_visitor_profile(visitor_id: str, current_user: dict = Depends(require_admin)):
    db = get_database()
    visitor = db["visitors"].find_one({"visitor_id": visitor_id})
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    sessions = list(db["sessions"].find({"visitor_id": visitor_id}).sort("start_time", -1))
    pageviews = list(db["pageviews"].find({"visitor_id": visitor_id}).sort("entered_at", -1))
    events = list(db["events"].find({"visitor_id": visitor_id}).sort("created_at", -1))
    clicks = list(db["clicks"].find({"visitor_id": visitor_id}).sort("timestamp", -1))
    scrolls = list(db["scrolls"].find({"visitor_id": visitor_id}).sort("timestamp", -1))

    return {
        "visitor": clean_db_doc(visitor),
        "sessions": [clean_db_doc(s) for s in sessions],
        "pageviews": [clean_db_doc(pv) for pv in pageviews],
        "events": [clean_db_doc(e) for e in events],
        "clicks": [clean_db_doc(c) for c in clicks],
        "scrolls": [clean_db_doc(sc) for sc in scrolls]
    }
