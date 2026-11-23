import os
import uuid
import io
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from PIL import Image, ImageOps

from app.database import get_database
from app.security import require_admin
from app.utils.cache import clear_api_cache

router = APIRouter(prefix="/owner", tags=["Owner & Founder Profile"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif"
}

DEFAULT_OWNER = {
    "name": "Pooja Verma",
    "role": "Founder & Creative Director",
    "tagline": "Traditional Ka Tadka • Handcrafted Luxury Ethnic Wear",
    "quote": "My dream has always been to bring the regal elegance of authentic Indian handlooms into everyday life — handcrafted with integrity, honest pricing, and genuine pride in our heritage.",
    "image": "/pooja-verma.jpg",
    "origin": "Deoria & Sultanpur, Uttar Pradesh (Purvanchal Handloom Belt)",
    "education": "Bachelor of Arts (B.A.), Sultanpur University",
    "craft_expertise": "Direct Handloom Sourcing & Pure Cotton Quality Testing",
    "core_mission": "Artisan Empowerment, True Indian Fits & Accessible Luxury",
    "story_title": "The Journey of Nari Pehnawa",
    "story_subtitle": "From the Generational Looms of Purvanchal to Wardrobes Nationwide",
    "story_paragraphs": [
        "Nari Pehnawa was born out of a simple yet transformative dream: to make genuine, royal Indian ethnic fashion accessible, comfortable, and celebratory for every woman across the country. Founded by Pooja Verma, the brand stands as an authentic testament to woman-led entrepreneurship and grassroots handloom preservation.",
        "Growing up in Deoria, Uttar Pradesh, and later completing her higher education in Sultanpur, Pooja recognized a recurring void in the ethnic wear market. Boutiques charged exorbitant prices, while commercial mass-market labels frequently compromised on pure cotton breathability, fabric longevity, and realistic silhouette fits.",
        "Determined to build an independent brand grounded in integrity, Pooja bypassed corporate middlemen and traveled directly to traditional artisan weaving clusters across Uttar Pradesh. She studied thread counts, yarn densities, vegetable dyes, and lock-stitch tailoring directly alongside generational master weavers.",
        "Today, Nari Pehnawa connects rural artisan excellence with modern Indian wardrobes nationwide. Every single kurti, suit, and festive ensemble carries Pooja's personal seal of quality, honest pricing, and genuine pride in Indian handloom traditions."
    ],
    "vision_title": "Our Creative Philosophy",
    "vision_quote": "To deliver heirloom-grade, breathable, and regal Indian ethnic wear into every household — straight from artisan looms with complete transparency and fair pricing.",
    "brand_values": [
        {
            "title": "Direct Loom Sourcing",
            "desc": "Hand-selecting fabrics directly from artisan clusters across Uttar Pradesh to ensure pure cotton breathability, vivid natural dyes, and heirloom texture."
        },
        {
            "title": "True Indian Fit Margins",
            "desc": "Generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian body contours, ensuring freedom of movement and graceful drape."
        },
        {
            "title": "Accessible Luxury",
            "desc": "Eliminating multi-tier distributor markups so that authentic royal craftsmanship remains within honest, transparent reach."
        },
        {
            "title": "Artisan Empowerment",
            "desc": "Partnering directly with local women tailors and multigenerational artisan families, celebrating sustainable Indian handcraft."
        }
    ]
}


class BrandValueItem(BaseModel):
    title: str = Field(..., description="Value or Pillar title")
    desc: str = Field(..., description="Description of the value")


class OwnerProfileUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    tagline: Optional[str] = None
    quote: Optional[str] = None
    image: Optional[str] = None
    origin: Optional[str] = None
    education: Optional[str] = None
    craft_expertise: Optional[str] = None
    core_mission: Optional[str] = None
    story_title: Optional[str] = None
    story_subtitle: Optional[str] = None
    story_paragraphs: Optional[List[str]] = None
    vision_title: Optional[str] = None
    vision_quote: Optional[str] = None
    brand_values: Optional[List[BrandValueItem]] = None


@router.get("/")
def get_owner_profile():
    """
    Public endpoint: Get the single primary owner/founder profile.
    If none saved in database yet, returns default initial profile.
    """
    db = get_database()
    record = db["owner_profile"].find_one({"_id": "primary_owner"})
    if not record:
        return {**DEFAULT_OWNER, "id": "primary_owner"}
    
    # Strip MongoDB internal _id
    record["id"] = str(record.pop("_id", "primary_owner"))
    return record


@router.put("/")
def update_owner_profile(
    payload: OwnerProfileUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Admin endpoint: Update the primary owner/founder profile.
    """
    db = get_database()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    # Convert brand_values pydantic objects to dicts if needed
    if "brand_values" in update_data and update_data["brand_values"] is not None:
        update_data["brand_values"] = [
            bv if isinstance(bv, dict) else bv.model_dump()
            for bv in update_data["brand_values"]
        ]
        
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Upsert the single primary owner document
    db["owner_profile"].update_one(
        {"_id": "primary_owner"},
        {"$set": update_data, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    clear_api_cache()
    
    saved = db["owner_profile"].find_one({"_id": "primary_owner"})
    if saved:
        saved["id"] = str(saved.pop("_id", "primary_owner"))
        return saved
    return {**DEFAULT_OWNER, **update_data, "id": "primary_owner"}


@router.post("/upload-image")
async def upload_owner_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """
    Admin endpoint: Upload and optimize owner profile photograph.
    Saves image, converts to optimized WebP, and updates owner profile in DB.
    """
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: JPEG, PNG, WebP, AVIF."
        )

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large (max 20 MB).")

    try:
        img = Image.open(io.BytesIO(content))
        img = ImageOps.exif_transpose(img)

        # High-res portrait optimization (up to 2000px max dimension)
        max_dim = 2000
        if img.width > max_dim or img.height > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        unique_id = uuid.uuid4().hex
        filename = f"owner_{unique_id}.webp"
        save_path = UPLOAD_DIR / filename

        # Convert RGBA to RGB for webp if needed
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        img.save(str(save_path), "WEBP", quality=88, method=6)
        image_url = f"/api/uploads/{filename}"

        # Update in DB
        db = get_database()
        db["owner_profile"].update_one(
            {"_id": "primary_owner"},
            {
                "$set": {
                    "image": image_url,
                    "updated_at": datetime.now(timezone.utc)
                },
                "$setOnInsert": {**DEFAULT_OWNER, "created_at": datetime.now(timezone.utc)}
            },
            upsert=True
        )

        clear_api_cache()
        return {"success": True, "image": image_url, "filename": filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
