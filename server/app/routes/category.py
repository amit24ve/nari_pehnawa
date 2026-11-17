import re
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from app.database.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.database import get_database
from app.security import require_admin
from bson import ObjectId
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/categories", tags=["Categories"])


def _format_category(cat: dict) -> dict:
    cat["_id"] = str(cat["_id"])
    cat.setdefault("department", "Women")
    if not cat.get("department") or cat.get("department") == "Clothing":
        cat["department"] = "Women"
    if "sub_categories" not in cat or not isinstance(cat["sub_categories"], list):
        cat["sub_categories"] = []
    cat.setdefault("category_type", "regular")
    return cat


@router.post("/", response_model=Category, status_code=201)
def create_category(category: CategoryCreate, current_user: dict = Depends(require_admin)):
    """Create a new category (Admin only)"""
    db = get_database()
    categories_collection = db["categories"]
    try:
        category_data = category.model_dump()
        category_data["department"] = category_data.get("department") or "Women"
        if not category_data.get("sub_categories"):
            category_data["sub_categories"] = []
        if not category_data.get("category_type"):
            category_data["category_type"] = "regular"
        result = categories_collection.insert_one(category_data)
        category_data["_id"] = str(result.inserted_id)
        clear_api_cache()
        return _format_category(category_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Category])
@cache_response(expire_seconds=300)
def get_categories(request: Request, is_active: Optional[bool] = None, department: Optional[str] = None):
    db = get_database()
    categories_collection = db["categories"]
    try:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        if department:
            dept_lower = department.strip().lower()
            if dept_lower in ["clothing", "women"]:
                dept_clause = [
                    {"department": {"$in": ["Women", "women", "Clothing", "clothing", "Women's Wear"]}},
                    {"department": {"$exists": False}},
                    {"department": None},
                    {"department": ""}
                ]
                if "$or" in query:
                    query = {"$and": [query, {"$or": dept_clause}]}
                else:
                    query["$or"] = dept_clause
            else:
                dept_regex = {"$regex": f"^{re.escape(department)}$", "$options": "i"}
                query["department"] = dept_regex
        cursor = categories_collection.find(query).sort("display_order", 1)
        categories = list(cursor)
        return [_format_category(c) for c in categories]
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
        return _format_category(category)
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
        clear_api_cache()
        return _format_category(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{category_id}/subcategories")
def get_category_subcategories(category_id: str):
    """Get sub-categories for a specific category"""
    db = get_database()
    cat = db["categories"].find_one({"_id": ObjectId(category_id)})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"category": cat.get("name"), "sub_categories": cat.get("sub_categories", [])}


@router.post("/{category_id}/subcategories")
def add_subcategory(category_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    """Add one or more sub-categories to an existing category"""
    db = get_database()
    raw_name = payload.get("name")
    raw_list = payload.get("names") or payload.get("sub_categories")

    clean_names = []
    if raw_list and isinstance(raw_list, list):
        for item in raw_list:
            clean = str(item).strip()
            if clean and clean not in clean_names:
                clean_names.append(clean)
    elif raw_name:
        parts = [p.strip() for p in str(raw_name).split(",") if p.strip()]
        for p in parts:
            if p not in clean_names:
                clean_names.append(p)

    if not clean_names:
        raise HTTPException(status_code=400, detail="Sub-category name is required")

    res = db["categories"].find_one_and_update(
        {"_id": ObjectId(category_id)},
        {"$addToSet": {"sub_categories": {"$each": clean_names}}},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Category not found")
    clear_api_cache()
    return _format_category(res)


@router.delete("/{category_id}/subcategories/{sub_name}")
def delete_subcategory(category_id: str, sub_name: str, current_user: dict = Depends(require_admin)):
    """Remove a sub-category from an existing category"""
    db = get_database()
    clean_name = sub_name.strip()
    res = db["categories"].find_one_and_update(
        {"_id": ObjectId(category_id)},
        {"$pull": {"sub_categories": clean_name}},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Category not found")
    clear_api_cache()
    return _format_category(res)


@router.put("/{category_id}/subcategories")
def set_subcategories(category_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    """Replace all sub-categories for a category"""
    db = get_database()
    sub_list = payload.get("sub_categories", [])
    if not isinstance(sub_list, list):
        raise HTTPException(status_code=400, detail="sub_categories must be a list of strings")
    clean_list = [str(s).strip() for s in sub_list if str(s).strip()]
    res = db["categories"].find_one_and_update(
        {"_id": ObjectId(category_id)},
        {"$set": {"sub_categories": clean_list}},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Category not found")
    clear_api_cache()
    return _format_category(res)


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
