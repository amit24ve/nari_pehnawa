from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.database import get_database
from app.security import require_admin
from app.utils.cache import clear_api_cache

router = APIRouter(prefix="/announcements", tags=["Top Bar Announcements & Welcome Modal"])


class AnnouncementCreate(BaseModel):
    text: str = Field(..., description="Main announcement offer text")
    sub_text: Optional[str] = Field("", description="Optional short subtext or coupon code")
    link: Optional[str] = Field("", description="Optional click destination URL")
    badge: Optional[str] = Field("OFFER", description="Optional badge like NEW, SALE, OFFER")
    icon: Optional[str] = Field("✨", description="Emoji or icon representation")
    is_active: bool = Field(True, description="Whether announcement is currently visible")
    display_order: int = Field(0, description="Display order for sorting")
    bg_color: Optional[str] = Field("", description="Optional custom background color override")
    text_color: Optional[str] = Field("", description="Optional custom text color override")


class AnnouncementUpdate(BaseModel):
    text: Optional[str] = None
    sub_text: Optional[str] = None
    link: Optional[str] = None
    badge: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None


class WelcomeOfferModalConfig(BaseModel):
    is_enabled: bool = True
    template_type: str = Field("festive-royal", description="festive-royal | new-launch | flash-sale | welcome-gift | free-shipping")
    banner_image: str = "/nari_post_banner.jpg"
    title: str = "Grand Festive Season Sale"
    subtitle: str = "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear"
    coupon_code: str = "FESTIVE10"
    discount_badge: str = "FLAT 10% OFF"
    button_text: str = "EXPLORE COLLECTION"
    button_link: str = "/new-arrivals"
    show_on_mobile: bool = True
    delay_seconds: int = 3


def _format_announcement(doc: dict) -> dict:
    if not doc:
        return {}
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/topbar-settings")
def get_topbar_settings():
    """Get master top bar settings (is_enabled)"""
    db = get_database()
    cfg = db["admin_settings"].find_one({"key": "topbar_settings"})
    if not cfg:
        return {"is_enabled": True}
    return {"is_enabled": bool(cfg.get("is_enabled", True))}


@router.put("/topbar-settings")
def update_topbar_settings(
    payload: dict,
    current_user: dict = Depends(require_admin),
):
    """Admin endpoint: Toggle master top bar enabled/paused status"""
    db = get_database()
    is_enabled = bool(payload.get("is_enabled", True))
    db["admin_settings"].update_one(
        {"key": "topbar_settings"},
        {"$set": {"key": "topbar_settings", "is_enabled": is_enabled, "updated_at": datetime.now()}},
        upsert=True
    )
    clear_api_cache()
    return {"success": True, "is_enabled": is_enabled}


@router.get("/")
def get_active_announcements():
    """Public endpoint: Get active top bar announcements sorted by display order. Returns empty list if top bar is paused."""
    db = get_database()
    
    # Check master topbar setting
    topbar_cfg = db["admin_settings"].find_one({"key": "topbar_settings"})
    if topbar_cfg and not topbar_cfg.get("is_enabled", True):
        return []

    items = list(
        db["announcements"]
        .find({"is_active": True})
        .sort("display_order", 1)
    )
    return [_format_announcement(item) for item in items]


@router.get("/all")
def get_all_announcements(current_user: dict = Depends(require_admin)):
    """Admin endpoint: Get all announcements (active & inactive)"""
    db = get_database()
    items = list(db["announcements"].find({}).sort("display_order", 1))
    return [_format_announcement(item) for item in items]


@router.post("/")
def create_announcement(data: AnnouncementCreate, current_user: dict = Depends(require_admin)):
    """Admin endpoint: Create a new top bar announcement"""
    db = get_database()
    doc = data.dict()
    doc["created_at"] = datetime.now()
    doc["updated_at"] = datetime.now()
    doc["created_by"] = current_user.get("email", "admin")

    res = db["announcements"].insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    clear_api_cache()
    return {"success": True, "message": "Announcement created successfully!", "data": doc}


@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: str,
    data: AnnouncementUpdate,
    current_user: dict = Depends(require_admin),
):
    """Admin endpoint: Update an announcement by ID"""
    db = get_database()
    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement ID")

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    update_fields["updated_at"] = datetime.now()
    update_fields["updated_by"] = current_user.get("email", "admin")

    res = db["announcements"].find_one_and_update(
        {"_id": ObjectId(announcement_id)},
        {"$set": update_fields},
        return_document=True,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Announcement not found")

    clear_api_cache()
    return {"success": True, "message": "Announcement updated successfully!", "data": _format_announcement(res)}


@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: str, current_user: dict = Depends(require_admin)):
    """Admin endpoint: Delete an announcement by ID"""
    db = get_database()
    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement ID")

    res = db["announcements"].delete_one({"_id": ObjectId(announcement_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    clear_api_cache()
    return {"success": True, "message": "Announcement deleted successfully!"}


# ── WELCOME OFFER MODAL CONFIG (Sync with Top Bar & Banners) ──

@router.get("/welcome-modal")
def get_welcome_offer_modal_config():
    """Public endpoint: Get welcome offer modal configuration"""
    db = get_database()
    cfg = db["admin_settings"].find_one({"key": "welcome_offer_modal"})
    if not cfg:
        return {
            "is_enabled": True,
            "template_type": "festive-royal",
            "banner_image": "/nari_post_banner.jpg",
            "title": "Grand Festive Season Sale",
            "subtitle": "Flat 10% OFF on Handcrafted Designer Kurtis & Ethnic Wear",
            "coupon_code": "FESTIVE10",
            "discount_badge": "FLAT 10% OFF",
            "button_text": "EXPLORE COLLECTION",
            "button_link": "/new-arrivals",
            "show_on_mobile": True,
            "delay_seconds": 3,
        }
    cfg.pop("_id", None)
    cfg.setdefault("template_type", "festive-royal")
    return cfg


@router.put("/welcome-modal")
def update_welcome_offer_modal_config(
    data: WelcomeOfferModalConfig,
    current_user: dict = Depends(require_admin),
):
    """Admin endpoint: Update welcome offer modal configuration"""
    db = get_database()
    doc = data.dict()
    doc["key"] = "welcome_offer_modal"
    doc["updated_at"] = datetime.now()
    doc["updated_by"] = current_user.get("email", "admin")

    db["admin_settings"].update_one(
        {"key": "welcome_offer_modal"},
        {"$set": doc},
        upsert=True,
    )
    clear_api_cache()
    return {"success": True, "message": "Welcome offer modal updated successfully!", "config": doc}


# ── MYSTERY JEWELRY JAR LAUNCHING OFFER CONFIG ──

class MysteryJarOfferConfig(BaseModel):
    is_enabled: bool = True
    pill_text: str = Field("Free Mystery Jewellery Jar", description="Text on slider button")
    pill_subtext: str = Field("View Gift →", description="Subtext / link on slider button")
    image_url: str = Field("/mystery_jewelry_jar.jpg", description="Jar photo URL")
    title: str = Field("Free Mystery Jewellery Jar 🎁", description="Modal Title")
    overlay_text: str = Field("Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!", description="Text displayed directly on image")
    description: Optional[str] = Field("Receive this handcrafted luxury glass jar with red ribbon, filled with premium surprise jewelry inside with your delivery parcel!", description="Modal description")
    button_text: str = Field("Shop Now & Claim Gift", description="Button text")
    button_link: str = Field("/new-arrivals", description="Button link")


@router.get("/mystery-jar")
def get_mystery_jar_offer_config():
    """Public endpoint: Get mystery jewelry jar launching offer settings"""
    db = get_database()
    cfg = db["admin_settings"].find_one({"key": "mystery_jar_offer"})
    if not cfg:
        return {
            "is_enabled": True,
            "pill_text": "Free Mystery Jewellery Jar",
            "pill_subtext": "View Gift →",
            "image_url": "/mystery_jewelry_jar.jpg",
            "title": "Free Mystery Jewellery Jar 🎁",
            "overlay_text": "Top 5 Orders of the Day Get a Free Mystery Jewellery Jar!",
            "description": "Receive this handcrafted luxury glass jar with red ribbon, filled with premium surprise jewelry inside with your delivery parcel!",
            "button_text": "Shop Now & Claim Gift",
            "button_link": "/new-arrivals",
        }
    cfg.pop("_id", None)
    return cfg


@router.put("/mystery-jar")
def update_mystery_jar_offer_config(
    data: MysteryJarOfferConfig,
    current_user: dict = Depends(require_admin),
):
    """Admin endpoint: Update mystery jewelry jar launching offer settings"""
    db = get_database()
    doc = data.dict()
    doc["key"] = "mystery_jar_offer"
    doc["updated_at"] = datetime.now()
    doc["updated_by"] = current_user.get("email", "admin")

    db["admin_settings"].update_one(
        {"key": "mystery_jar_offer"},
        {"$set": doc},
        upsert=True,
    )
    clear_api_cache()
    return {"success": True, "message": "Mystery jar offer settings updated successfully!", "config": doc}

