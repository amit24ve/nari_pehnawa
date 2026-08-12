from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class GeoData(BaseModel):
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    timezone: Optional[str] = None
    isp: Optional[str] = None
    network_type: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    ip: Optional[str] = None
    vpn_detected: Optional[bool] = False


class DeviceData(BaseModel):
    browser: Optional[str] = None
    browser_version: Optional[str] = None
    os: Optional[str] = None
    device_type: Optional[str] = None  # Mobile, Tablet, Desktop
    screen_resolution: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


class UtmParameters(BaseModel):
    source: Optional[str] = None
    medium: Optional[str] = None
    campaign: Optional[str] = None
    term: Optional[str] = None
    content: Optional[str] = None


class TrafficData(BaseModel):
    source: Optional[str] = "Direct"
    referrer: Optional[str] = None
    utm_parameters: Optional[UtmParameters] = None
    keyword: Optional[str] = None


class PerformanceData(BaseModel):
    page_load_time: Optional[float] = None
    api_response_time: Optional[float] = None
    slow_pages: List[str] = Field(default_factory=list)
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    crash_logs: List[Dict[str, Any]] = Field(default_factory=list)


class SecurityData(BaseModel):
    suspicious_requests: List[Dict[str, Any]] = Field(default_factory=list)
    login_attempts: int = 0
    bot_detected: bool = False
    vpn_detected: bool = False


class VisitorBase(BaseModel):
    visitor_id: str
    user_id: Optional[str] = None
    first_seen: datetime = Field(default_factory=datetime.now)
    last_seen: datetime = Field(default_factory=datetime.now)
    total_visits: int = 1
    login_status: str = "Guest"  # Guest, Logged User, Registered User
    geo: Optional[GeoData] = None
    device: Optional[DeviceData] = None
    security: Optional[SecurityData] = None
    product_clicks: Dict[str, int] = Field(default_factory=dict)
    recently_viewed_products: List[str] = Field(default_factory=list)
    search_history: List[str] = Field(default_factory=list)


class VisitorCreate(VisitorBase):
    pass


class Visitor(VisitorBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class SessionBase(BaseModel):
    session_id: str
    visitor_id: str
    user_id: Optional[str] = None
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    duration: int = 0
    previous_session_duration: int = 0
    bounce: bool = True
    returning_visitor: bool = False
    new_visitor: bool = True
    traffic: Optional[TrafficData] = None
    landing_page: Optional[str] = None
    exit_page: Optional[str] = None
    performance: Optional[PerformanceData] = None
    cart_value: float = 0.0
    added_products: List[str] = Field(default_factory=list)
    removed_products: List[str] = Field(default_factory=list)
    abandoned_cart: bool = False


class SessionCreate(SessionBase):
    pass


class Session(SessionBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class PageViewBase(BaseModel):
    visitor_id: str
    session_id: str
    path: str
    title: Optional[str] = None
    referrer: Optional[str] = None
    entered_at: datetime = Field(default_factory=datetime.now)
    exited_at: Optional[datetime] = None
    time_spent: int = 0
    scroll_percentage: float = 0.0


class PageViewCreate(PageViewBase):
    pass


class PageView(PageViewBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class ClickHeatmapBase(BaseModel):
    visitor_id: str
    session_id: str
    path: str
    x: float  # Percentage of element/screen width
    y: float  # Percentage of element/screen height
    target_tag: Optional[str] = None
    target_text: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class ClickHeatmapCreate(ClickHeatmapBase):
    pass


class ClickHeatmap(ClickHeatmapBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class CustomEventBase(BaseModel):
    visitor_id: str
    session_id: str
    event_type: str
    event_data: Dict[str, Any] = Field(default_factory=dict)
    path: str
    created_at: datetime = Field(default_factory=datetime.now)


class CustomEventCreate(CustomEventBase):
    pass


class CustomEvent(CustomEventBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class FormIntelligenceBase(BaseModel):
    visitor_id: str
    session_id: str
    form_id: str
    data: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)


class FormIntelligenceCreate(FormIntelligenceBase):
    pass


class FormIntelligence(FormIntelligenceBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class ConversionBase(BaseModel):
    visitor_id: str
    session_id: str
    conversion_type: str
    revenue: float = 0.0
    details: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)


class ConversionCreate(ConversionBase):
    pass


class Conversion(ConversionBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True


class AIInsightBase(BaseModel):
    type: str  # "daily", "weekly", "visitor_summary"
    target_id: str  # visitor_id or date string
    summary: str
    purchase_intent: str = "low"  # "high", "medium", "low"
    is_bot: bool = False
    intent_group: str = "unknown"
    classification: str = "unknown"
    recommendations: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)


class AIInsightCreate(AIInsightBase):
    pass


class AIInsight(AIInsightBase):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True
