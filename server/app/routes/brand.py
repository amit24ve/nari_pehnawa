from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.database.schemas.brand import Brand, BrandCreate, BrandUpdate
from app.database import get_database
from app.security import require_admin
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/brands", tags=["Brands"])


def _ensure_default_brands(brands_collection):
    """Seed default brand if collection is empty"""
    if brands_collection.count_documents({}) == 0:
        default_brand = {
            "name": "Nari Pehnawa",
            "slug": "nari-pehnawa",
            "country": "India",
            "description": "Authentic Handcrafted Ethnic Wear",
            "status": "Active",
            "is_active": True,
            "display_order": 1,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        brands_collection.insert_one(default_brand)


@router.get("/", response_model=List[Brand])
@cache_response(expire_seconds=300)
def get_public_brands(request: Request, is_active: Optional[bool] = True):
    """List all active brands for the public storefront"""
    db = get_database()
    brands_collection = db["brands"]
    _ensure_default_brands(brands_collection)
    try:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
            query["status"] = "Active"
        cursor = brands_collection.find(query).sort("display_order", 1)
        brands = []
        for b in cursor:
            b["id"] = str(b["_id"])
            b["_id"] = str(b["_id"])
            brands.append(b)
        return brands
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/all", response_model=List[Brand])
def get_all_brands_admin(current_user: dict = Depends(require_admin)):
    """List all brands (active and inactive) for admin management"""
    db = get_database()
    brands_collection = db["brands"]
    _ensure_default_brands(brands_collection)
    try:
        cursor = brands_collection.find().sort("display_order", 1)
        brands = []
        for b in cursor:
            b["id"] = str(b["_id"])
            b["_id"] = str(b["_id"])
            brands.append(b)
        return brands
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Brand, status_code=201)
def create_brand(brand: BrandCreate, current_user: dict = Depends(require_admin)):
    """Create a new brand (Admin only)"""
    db = get_database()
    brands_collection = db["brands"]
    try:
        data = brand.model_dump()
        if not data.get("slug"):
            data["slug"] = data["name"].lower().strip().replace(" ", "-")
        data["status"] = data.get("status") or ("Active" if data.get("is_active", True) else "Inactive")
        data["is_active"] = (data["status"] == "Active")
        data["created_at"] = datetime.now()
        data["updated_at"] = datetime.now()

        # Check duplicate
        if brands_collection.find_one({"name": {"$regex": f"^{data['name']}$", "$options": "i"}}):
            raise HTTPException(status_code=400, detail="Brand with this name already exists")

        result = brands_collection.insert_one(data)
        data["id"] = str(result.inserted_id)
        data["_id"] = str(result.inserted_id)
        clear_api_cache()
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{brand_id}", response_model=Brand)
def get_brand(brand_id: str):
    """Get single brand details"""
    db = get_database()
    brands_collection = db["brands"]
    try:
        brand = brands_collection.find_one({"_id": ObjectId(brand_id)})
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        brand["id"] = str(brand["_id"])
        brand["_id"] = str(brand["_id"])
        return brand
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{brand_id}", response_model=Brand)
def update_brand(brand_id: str, brand_update: BrandUpdate, current_user: dict = Depends(require_admin)):
    """Update a brand (Admin only)"""
    db = get_database()
    brands_collection = db["brands"]
    try:
        update_data = {k: v for k, v in brand_update.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        if "status" in update_data:
            update_data["is_active"] = (update_data["status"] == "Active")
        elif "is_active" in update_data:
            update_data["status"] = "Active" if update_data["is_active"] else "Inactive"

        if "name" in update_data and not update_data.get("slug"):
            update_data["slug"] = update_data["name"].lower().strip().replace(" ", "-")

        update_data["updated_at"] = datetime.now()

        res = brands_collection.find_one_and_update(
            {"_id": ObjectId(brand_id)},
            {"$set": update_data},
            return_document=True
        )
        if not res:
            raise HTTPException(status_code=404, detail="Brand not found")

        res["id"] = str(res["_id"])
        res["_id"] = str(res["_id"])
        clear_api_cache()
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{brand_id}")
def delete_brand(brand_id: str, current_user: dict = Depends(require_admin)):
    """Delete a brand (Admin only)"""
    db = get_database()
    brands_collection = db["brands"]
    try:
        res = brands_collection.delete_one({"_id": ObjectId(brand_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Brand not found")
        clear_api_cache()
        return {"message": "Brand deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
