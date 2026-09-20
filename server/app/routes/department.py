from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.database.schemas.department import Department, DepartmentCreate, DepartmentUpdate
from app.database import get_database
from app.security import require_admin
from app.utils.cache import cache_response, clear_api_cache

router = APIRouter(prefix="/departments", tags=["Departments"])

DEFAULT_DEPARTMENTS = [
    {"name": "Clothing", "icon": "👗", "slug": "clothing", "description": "Women's Ethnic & Western Wear", "display_order": 1, "is_active": True},
    {"name": "Jewellery", "icon": "✨", "slug": "jewellery", "description": "Necklaces, Earrings, Bangles & Accessories", "display_order": 2, "is_active": True},
    {"name": "Footwear", "icon": "👠", "slug": "footwear", "description": "Juttis, Heels, Flats & Daily Footwear", "display_order": 3, "is_active": True},
    {"name": "Accessories", "icon": "👜", "slug": "accessories", "description": "Bags, Clutches & Fashion Accents", "display_order": 4, "is_active": True},
]


def _ensure_default_departments(db):
    dept_col = db["departments"]
    if dept_col.count_documents({}) == 0:
        now = datetime.now()
        for d in DEFAULT_DEPARTMENTS:
            doc = {**d, "created_at": now, "updated_at": now}
            dept_col.insert_one(doc)


def _fmt(doc: dict, db=None) -> dict:
    d_id = str(doc.pop("_id"))
    doc["id"] = d_id
    doc["_id"] = d_id
    dept_name = doc.get("name", "")
    if db is not None and dept_name:
        # Compute category count
        doc["category_count"] = db["categories"].count_documents({
            "department": {"$regex": f"^{dept_name}$", "$options": "i"}
        })
        # Compute product count (either by product.department or category's department)
        doc["product_count"] = db["products"].count_documents({
            "department": {"$regex": f"^{dept_name}$", "$options": "i"}
        })
    else:
        doc.setdefault("category_count", 0)
        doc.setdefault("product_count", 0)
    return doc


@router.get("/", response_model=List[Department])
def get_departments():
    """List all active departments with computed category and product counts"""
    db = get_database()
    _ensure_default_departments(db)
    dept_col = db["departments"]
    
    # Also sync any distinct departments already stored in categories or products
    existing_names = set(dept_col.distinct("name"))
    cat_depts = db["categories"].distinct("department")
    for cd in cat_depts:
        if cd and cd.strip() and cd.strip() not in existing_names:
            dept_col.insert_one({
                "name": cd.strip(),
                "icon": "📁",
                "slug": cd.strip().lower().replace(" ", "-"),
                "description": "",
                "display_order": 10,
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            })
            existing_names.add(cd.strip())

    cursor = dept_col.find().sort("display_order", 1)
    results = [_fmt(d, db=db) for d in cursor]
    return results


@router.post("/", response_model=Department, status_code=201)
def create_department(data: DepartmentCreate, _admin=Depends(require_admin)):
    """Create a new department and seed it into the database"""
    db = get_database()
    dept_col = db["departments"]
    name_clean = data.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Department name is required")

    existing = dept_col.find_one({"name": {"$regex": f"^{name_clean}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail=f"Department '{name_clean}' already exists")

    doc = data.model_dump()
    doc["name"] = name_clean
    if not doc.get("slug"):
        doc["slug"] = name_clean.lower().replace(" ", "-")
    doc["created_at"] = datetime.now()
    doc["updated_at"] = datetime.now()
    res = dept_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    clear_api_cache()
    return _fmt(doc, db=db)


@router.put("/{dept_id}", response_model=Department)
def update_department(dept_id: str, data: DepartmentUpdate, _admin=Depends(require_admin)):
    """Update a department name or icon, and CASCADE rename to all categories and products"""
    db = get_database()
    dept_col = db["departments"]
    try:
        oid = ObjectId(dept_id)
        filter_q = {"$or": [{"_id": oid}, {"id": dept_id}]}
    except Exception:
        filter_q = {"id": dept_id}

    curr = dept_col.find_one(filter_q)
    if not curr:
        raise HTTPException(status_code=404, detail="Department not found")

    old_name = curr.get("name")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    new_name = update_data.get("name", "").strip() if "name" in update_data else None

    if new_name and new_name.lower() != old_name.lower():
        # Check collision with another department
        collision = dept_col.find_one({
            "_id": {"$ne": curr["_id"]},
            "name": {"$regex": f"^{new_name}$", "$options": "i"}
        })
        if collision:
            raise HTTPException(status_code=400, detail=f"Another department named '{new_name}' already exists")
        update_data["name"] = new_name
        if "slug" not in update_data or not update_data["slug"]:
            update_data["slug"] = new_name.lower().replace(" ", "-")

    update_data["updated_at"] = datetime.now()
    updated = dept_col.find_one_and_update(filter_q, {"$set": update_data}, return_document=True)

    # CASCADE UPDATE to all Categories and Products if renamed!
    if new_name and old_name and new_name != old_name:
        db["categories"].update_many(
            {"department": {"$regex": f"^{old_name}$", "$options": "i"}},
            {"$set": {"department": new_name}}
        )
        db["products"].update_many(
            {"department": {"$regex": f"^{old_name}$", "$options": "i"}},
            {"$set": {"department": new_name}}
        )

    clear_api_cache()
    return _fmt(updated, db=db)


@router.delete("/{dept_id}")
def delete_department(dept_id: str, _admin=Depends(require_admin)):
    """Delete a department (reassigns linked categories to 'Clothing' if necessary)"""
    db = get_database()
    dept_col = db["departments"]
    try:
        oid = ObjectId(dept_id)
        filter_q = {"$or": [{"_id": oid}, {"id": dept_id}]}
    except Exception:
        filter_q = {"id": dept_id}

    curr = dept_col.find_one(filter_q)
    if not curr:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_name = curr.get("name")
    # Reassign existing categories to Clothing if deleted
    db["categories"].update_many(
        {"department": dept_name},
        {"$set": {"department": "Clothing"}}
    )
    db["products"].update_many(
        {"department": dept_name},
        {"$set": {"department": "Clothing"}}
    )

    dept_col.delete_one(filter_q)
    clear_api_cache()
    return {"success": True, "message": f"Department '{dept_name}' deleted successfully"}
