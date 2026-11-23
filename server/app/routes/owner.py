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
    "role": "Founder",
    "tagline": "Traditional Ka Tadka • Handcrafted Luxury Ethnic Wear",
    "quote": "My dream has always been to bring the royal elegance of authentic Indian handlooms into everyday life — handcrafted for women, by women, with uncompromised fabric purity, honest pricing, and genuine trust.",
    "image": "/pooja-verma.jpg",
    "origin": "Deoria & Sultanpur, Uttar Pradesh (Traditional Purvanchal Handloom & Artisan Heartland)",
    "education": "Bachelor of Arts (B.A.) • Rishi Raj Mahavidyalaya, Katka, Sultanpur (Dr. Ram Manohar Lohia Avadh University, RMLAU)",
    "craft_expertise": "Direct Artisan Loom Sourcing, 100% Breathable Pure Cotton & Thread Count Density Testing",
    "core_mission": "Women Self-Reliance, Fair Artisan Livelihoods & Heirloom Handcrafted Luxury at Honest Pricing",
    "story_title": "The Journey of Nari Pehnawa",
    "story_subtitle": "From Generational Weaving Looms to Wardrobes Across India",
    "story_paragraphs": [
        "Nari Pehnawa was born out of a profound dream: to bring genuine, royal Indian ethnic wear into everyday wardrobes with uncompromising authenticity, pure fabric comfort, and honest pricing. Founded by Pooja Verma, the brand represents woman-led entrepreneurship rooted firmly in the rich cultural soil of Purvanchal, Uttar Pradesh.",
        "Having grown up in Deoria and completed her Bachelor of Arts from Rishi Raj Mahavidyalaya, Katka, Sultanpur (affiliated to Dr. Ram Manohar Lohia Avadh University - RMLAU), Pooja observed a critical dilemma in the ethnic wear space. Commercial fast-fashion was flooding wardrobes with synthetic polyester blends and rigid fits, while high-end designer boutiques charged exorbitant prices that ordinary families could not afford.",
        "Refusing to accept compromises on comfort and authenticity, Pooja journeyed directly to traditional handloom artisan clusters across Uttar Pradesh. Working closely alongside generational master weavers and tailors, she personally inspected yarn densities, thread counts, vegetable dye stability, and reinforced lock-stitch seams to ensure lasting durability and effortless drape.",
        "What started as a passionate mission has grown into a beloved ethnic label trusted by women nationwide. Today, Nari Pehnawa connects skilled rural artisans directly to modern households, ensuring fair livelihoods for craft families and heirloom-grade ethnic wear for every customer.",
        "Every single kurti, suit set, and handcrafted ensemble carries Pooja's personal seal of quality, honest pricing, and genuine devotion to Indian handloom pride."
    ],
    "trust_title": "The Pillars of Trust | प्रामाणिकता और विश्वास",
    "trust_subtitle": "Every thread, every silhouette, and every promise backed by our personal founder commitment.",
    "trust_items": [
        {
            "title": "100% Pure Breathable Fabric Guarantee",
            "desc": "Hand-tested for breathability, pure cotton density, and color-fastness with zero skin-irritating synthetics. Fabrics crafted to breathe with you all day."
        },
        {
            "title": "Direct-From-Loom Fair Honest Pricing",
            "desc": "We completely eliminate middleman broker markups. Every single rupee goes directly into artisan craft density and premium fabric quality."
        },
        {
            "title": "Generous 2-3 Inch Tailored Alteration Margins",
            "desc": "Every ensemble features generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian women's body silhouettes."
        },
        {
            "title": "Transparent Doorstep Experience",
            "desc": "Real product photographs with no deceptive lighting or filters, honest fabric weight disclosures, and dedicated founder-backed customer support."
        },
        {
            "title": "Fair Artisan Wages & Women Empowerment",
            "desc": "Providing sustainable year-round employment to rural women tailors and multigenerational handloom artisan families across Uttar Pradesh."
        }
    ],
    "vision_title": "Our Guiding Promise",
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


class TrustItem(BaseModel):
    title: str = Field(..., description="Trust pillar title")
    desc: str = Field(..., description="Trust pillar description")


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
    trust_title: Optional[str] = None
    trust_subtitle: Optional[str] = None
    trust_items: Optional[List[TrustItem]] = None
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
    
    # Ensure default fields exist if DB has older schema
    merged = {**DEFAULT_OWNER, **record}
    return merged


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

    # Convert trust_items pydantic objects to dicts if needed
    if "trust_items" in update_data and update_data["trust_items"] is not None:
        update_data["trust_items"] = [
            ti if isinstance(ti, dict) else ti.model_dump()
            for ti in update_data["trust_items"]
        ]
        
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Prepare $setOnInsert without any fields that exist in $set to prevent MongoDB conflict code 40
    insert_defaults = {
        k: v for k, v in DEFAULT_OWNER.items()
        if k not in update_data and k != "created_at"
    }
    insert_defaults["created_at"] = datetime.now(timezone.utc)

    # Upsert the single primary owner document
    db["owner_profile"].update_one(
        {"_id": "primary_owner"},
        {
            "$set": update_data,
            "$setOnInsert": insert_defaults
        },
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

        # Update in DB with safe $setOnInsert (excluding 'image' and 'updated_at' to prevent MongoDB conflict code 40)
        insert_defaults = {
            k: v for k, v in DEFAULT_OWNER.items()
            if k not in ("image", "updated_at")
        }
        insert_defaults["created_at"] = datetime.now(timezone.utc)

        db = get_database()
        db["owner_profile"].update_one(
            {"_id": "primary_owner"},
            {
                "$set": {
                    "image": image_url,
                    "updated_at": datetime.now(timezone.utc)
                },
                "$setOnInsert": insert_defaults
            },
            upsert=True
        )

        clear_api_cache()
        return {"success": True, "image": image_url, "filename": filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
