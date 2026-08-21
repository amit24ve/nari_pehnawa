from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from app.database.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.database import get_database
from app.security import require_admin
from bson import ObjectId
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=Category, status_code=201)
def create_category(category: CategoryCreate, current_user: dict = Depends(require_admin)):
    """Create a new category (Admin only)"""
    db = get_database()
    categories_collection = db["categories"]
    try:
        category_data = category.model_dump()
        result = categories_collection.insert_one(category_data)
        category_data["_id"] = str(result.inserted_id)
        clear_api_cache()
        return category_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Category])
@cache_response(expire_seconds=300)
def get_categories(request: Request, is_active: Optional[bool] = None):
    db = get_database()
    categories_collection = db["categories"]
    try:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        cursor = categories_collection.find(query).sort("display_order", 1)
        categories = list(cursor)
        for category in categories:
            category["_id"] = str(category["_id"])
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{category_id}", response_model=Category)
@cache_response(expire_seconds=300)
def get_category(category_id: str, request: Request):
    """Get a specific category by ID"""
    db = get_database()
    categories_collection = db["categories"]
    try:
        category = categories_collection.find_one({"_id": ObjectId(category_id)})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        category["_id"] = str(category["_id"])
        return category
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{category_id}", response_model=Category)
def update_category(category_id: str, category: CategoryUpdate, current_user: dict = Depends(require_admin)):
    """Update a category (Admin only)"""
    db = get_database()
    categories_collection = db["categories"]
    try:
        update_data = {k: v for k, v in category.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = categories_collection.find_one_and_update(
            {"_id": ObjectId(category_id)},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Category not found")
        result["_id"] = str(result["_id"])
        clear_api_cache()
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{category_id}")
def delete_category(category_id: str, current_user: dict = Depends(require_admin)):
    """Delete a category (Admin only)"""
    db = get_database()
    categories_collection = db["categories"]
    try:
        result = categories_collection.delete_one({"_id": ObjectId(category_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        clear_api_cache()
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
