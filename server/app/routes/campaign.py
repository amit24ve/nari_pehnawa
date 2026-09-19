"""
Campaign Showcase & Voting API
Powers the interactive 4-card promotional campaign banner matching the design.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from jose import jwt
from pydantic import BaseModel

from app.database import get_database
from app.security import require_admin, get_current_user, SECRET_KEY, ALGORITHM
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/campaign", tags=["Campaign"])

DEFAULT_TAGS = ["Special Pick", "Festive Favorite", "Budget Buy", "Daily Essential"]


def _get_optional_user_id(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


class SlotConfig(BaseModel):
    slot_id: int
    tag: str = "Special Pick"
    product_id: Optional[str] = None
    custom_image: Optional[str] = None
    votes: int = 0
    rating: float = 4.8


class CampaignUpdate(BaseModel):
    is_active: bool = True
    title: str = "Up to"
    discount_text: str = "30% OFF"
    subtitle: str = "on first order • Only on Nari Pehnawa"
    badge_text: str = ""
    cta_text: str = "Explore Deals"
    cta_link: str = "/category/sale"
    left_image: Optional[str] = ""
    full_banner_image: Optional[str] = ""
    banner_height: int = 320
    text_color: Optional[str] = "#111827"
    slots: List[SlotConfig] = []


class VoteRequest(BaseModel):
    slot_id: int
    product_id: Optional[str] = None


def _ensure_default_campaign(db) -> dict:
    doc = db["campaign_showcase"].find_one({"key": "active_campaign"})
    if not doc:
        # Grab first 4 products to pre-populate
        sample_products = list(db["products"].find({}, {"_id": 1}).limit(4))
        slots = []
        for i in range(4):
            pid = str(sample_products[i]["_id"]) if i < len(sample_products) else None
            slots.append({
                "slot_id": i,
                "tag": DEFAULT_TAGS[i],
                "product_id": pid,
                "custom_image": "",
                "votes": (4 - i) * 35 + 42, # Realistic initial votes
                "rating": round(4.7 + (0.1 * (i % 3)), 1)
            })

        default_doc = {
            "key": "active_campaign",
            "is_active": True,
            "title": "Up to",
            "discount_text": "35% OFF",
            "subtitle": "on first order • *Only on Nari Pehnawa",
            "badge_text": "SPECIAL FESTIVE OFFER",
            "cta_text": "Explore Deals",
            "cta_link": "/category/sale",
            "left_image": "",
            "full_banner_image": "",
            "banner_height": 320,
            "slots": slots,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        db["campaign_showcase"].insert_one(default_doc)
        return default_doc
    return doc


@router.get("/active")
def get_active_campaign(request: Request):
    """Public endpoint to get the active campaign with populated products and votes."""
    db = get_database()
    campaign = _ensure_default_campaign(db)

    if not campaign.get("is_active", True):
        return {"is_active": False}

    slots = campaign.get("slots", [])

    # Check optional logged-in user
    user_id = _get_optional_user_id(request)
    user_voted_slot = None
    if user_id:
        existing_vote = db["campaign_votes"].find_one({"user_id": str(user_id)})
        if existing_vote:
            user_voted_slot = existing_vote.get("slot_id")

    populated_slots = []
    for s in slots:
        pid = s.get("product_id")
        product_data = None
        if pid:
            try:
                prod = db["products"].find_one({"_id": ObjectId(pid)})
                if prod:
                    product_data = {
                        "id": str(prod["_id"]),
                        "name": prod.get("name", ""),
                        "price": prod.get("price", 0),
                        "original_price": prod.get("original_price"),
                        "discount": prod.get("discount", 0),
                        "image": prod.get("image") or (prod.get("images", [""])[0] if prod.get("images") else ""),
                        "category": prod.get("category", ""),
                        "rating": prod.get("rating", 4.8),
                        "review_count": prod.get("review_count", 0),
                    }
            except Exception:
                pass

        # Fallback if product was deleted or none selected
        if not product_data:
            fallback_prod = db["products"].find_one()
            if fallback_prod:
                product_data = {
                    "id": str(fallback_prod["_id"]),
                    "name": fallback_prod.get("name", "Designer Kurti"),
                    "price": fallback_prod.get("price", 499),
                    "original_price": fallback_prod.get("original_price", 999),
                    "discount": fallback_prod.get("discount", 50),
                    "image": fallback_prod.get("image", ""),
                    "category": fallback_prod.get("category", "Kurtis"),
                    "rating": 4.9,
                    "review_count": 12,
                }

        populated_slots.append({
            "slot_id": s.get("slot_id"),
            "tag": s.get("tag", DEFAULT_TAGS[s.get("slot_id", 0)]),
            "product": product_data,
            "custom_image": s.get("custom_image", ""),
            "votes": s.get("votes", 0),
            "rating": s.get("rating", 4.8),
            "is_top_voted": False,
        })

    return {
        "is_active": True,
        "title": campaign.get("title", "Up to"),
        "discount_text": campaign.get("discount_text", "30% OFF"),
        "subtitle": campaign.get("subtitle", "on first order • Only on Nari Pehnawa"),
        "badge_text": campaign.get("badge_text", ""),
        "cta_text": campaign.get("cta_text", "Explore Deals"),
        "cta_link": campaign.get("cta_link", "/category/sale"),
        "left_image": campaign.get("left_image", ""),
        "full_banner_image": campaign.get("full_banner_image", ""),
        "banner_height": campaign.get("banner_height", 320),
        "text_color": campaign.get("text_color", "#111827"),
        "user_voted_slot": user_voted_slot,
        "slots": populated_slots,
    }


@router.post("/vote")
def vote_campaign_product(
    data: VoteRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Voting endpoint: Requires user login. Enforces exactly ONE choice among the 4 slots."""
    db = get_database()
    campaign = _ensure_default_campaign(db)
    user_id = str(current_user["id"])
    new_slot_id = data.slot_id

    slots = campaign.get("slots", [])
    slot_map = {s.get("slot_id"): idx for idx, s in enumerate(slots)}
    if new_slot_id not in slot_map:
        raise HTTPException(status_code=404, detail="Slot not found")

    existing_vote = db["campaign_votes"].find_one({"user_id": user_id})

    if existing_vote:
        old_slot_id = existing_vote.get("slot_id")
        if old_slot_id == new_slot_id:
            return {
                "success": True,
                "user_voted_slot": new_slot_id,
                "already_voted": True,
                "slots": slots,
            }

        # User switched vote: decrement old slot, increment new slot
        if old_slot_id in slot_map:
            old_idx = slot_map[old_slot_id]
            slots[old_idx]["votes"] = max(0, slots[old_idx].get("votes", 1) - 1)

        new_idx = slot_map[new_slot_id]
        slots[new_idx]["votes"] = slots[new_idx].get("votes", 0) + 1

        db["campaign_votes"].update_one(
            {"_id": existing_vote["_id"]},
            {"$set": {"slot_id": new_slot_id, "updated_at": datetime.now()}}
        )
    else:
        # First vote by this user
        new_idx = slot_map[new_slot_id]
        slots[new_idx]["votes"] = slots[new_idx].get("votes", 0) + 1

        db["campaign_votes"].insert_one({
            "user_id": user_id,
            "slot_id": new_slot_id,
            "product_id": data.product_id,
            "created_at": datetime.now(),
        })

    # Save updated slots back to campaign_showcase
    db["campaign_showcase"].update_one(
        {"key": "active_campaign"},
        {"$set": {"slots": slots, "updated_at": datetime.now()}}
    )

    return {
        "success": True,
        "user_voted_slot": new_slot_id,
        "slots": slots,
    }


@router.get("/admin/config")
def get_admin_campaign_config(_admin=Depends(require_admin)):
    """Admin endpoint to retrieve campaign configuration, available products, and vote analytics."""
    db = get_database()
    campaign = _ensure_default_campaign(db)

    # Remove internal _id for clean JSON
    campaign_out = dict(campaign)
    campaign_out["id"] = str(campaign_out.pop("_id"))

    # Fetch product options for picker
    products = list(db["products"].find({}, {"name": 1, "price": 1, "image": 1, "category": 1}).sort("name", 1))
    for p in products:
        p["id"] = str(p.pop("_id"))

    return {
        "campaign": campaign_out,
        "products": products,
    }


@router.put("/admin/config")
def update_admin_campaign_config(data: CampaignUpdate, _admin=Depends(require_admin)):
    """Admin endpoint to update the campaign banner texts, product selections, tags, and images."""
    db = get_database()
    update_data = data.model_dump()
    update_data["updated_at"] = datetime.now()

    db["campaign_showcase"].update_one(
        {"key": "active_campaign"},
        {"$set": update_data},
        upsert=True
    )
    clear_api_cache()
    return {"success": True, "message": "Campaign updated successfully"}


@router.post("/admin/reset-votes")
def reset_campaign_votes(_admin=Depends(require_admin)):
    """Admin endpoint to reset votes for all campaign slots."""
    db = get_database()
    campaign = _ensure_default_campaign(db)
    slots = campaign.get("slots", [])
    for s in slots:
        s["votes"] = 0

    db["campaign_showcase"].update_one(
        {"key": "active_campaign"},
        {"$set": {"slots": slots, "updated_at": datetime.now()}}
    )
    db["campaign_votes"].delete_many({})
    clear_api_cache()
    return {"success": True, "message": "Votes reset to 0"}
