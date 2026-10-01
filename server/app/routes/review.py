from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.database import get_database
from app.database.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.security import get_current_user, require_admin
from bson import ObjectId
from datetime import datetime

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.cache import clear_api_cache

router = APIRouter(prefix="/reviews", tags=["Reviews"])

optional_security = HTTPBearer(auto_error=False)

def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        from jose import jwt
        from app.security import SECRET_KEY, ALGORITHM
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return {"id": user_id, "email": payload.get("email"), "role": payload.get("role", "customer")}
    except Exception:
        pass
    return None


def check_user_purchased_product(db, user_id: str, email: Optional[str], product_id: str) -> bool:
    """Verify if user has actually purchased this product in any non-cancelled order"""
    conds = []
    if user_id and user_id != "unknown":
        conds.extend([{"user_id": user_id}, {"customer_id": user_id}])
    if email:
        conds.extend([{"user_email": email}, {"customer_email": email}, {"email": email}])
    if not conds:
        return False

    pid_str = str(product_id)
    prod_matches = [
        {"items.product_id": pid_str},
        {"items.id": pid_str},
        {"items._id": pid_str}
    ]
    if ObjectId.is_valid(pid_str):
        prod_matches.append({"items.product_id": ObjectId(pid_str)})

    query = {
        "$and": [
            {"$or": conds},
            {"status": {"$nin": ["cancelled", "payment_failed", "failed"]}},
            {"$or": prod_matches}
        ]
    }
    order = db["orders"].find_one(query)
    return bool(order)


def _enrich_reviews_with_user_info(db, reviews: list):
    if not reviews:
        return reviews
    
    # Collect all possible user identifiers
    user_id_objs = []
    user_id_strs = []
    user_emails = set()
    user_phones = set()

    for r in reviews:
        uid = str(r.get("user_id") or "").strip()
        if uid and uid != "unknown":
            user_id_strs.append(uid)
            if ObjectId.is_valid(uid):
                user_id_objs.append(ObjectId(uid))
        email = str(r.get("user_email") or r.get("email") or "").strip()
        if email:
            user_emails.add(email)
        phone = str(r.get("user_phone") or r.get("phone") or "").strip()
        if phone:
            user_phones.add(phone)

    # Fetch matching users in batch
    user_queries = []
    if user_id_objs:
        user_queries.append({"_id": {"$in": user_id_objs}})
    if user_id_strs:
        user_queries.append({"id": {"$in": user_id_strs}})
    if user_emails:
        user_queries.append({"email": {"$in": list(user_emails)}})
    if user_phones:
        user_queries.append({"phone": {"$in": list(user_phones)}})

    users_map_by_id = {}
    users_map_by_email = {}
    users_map_by_phone = {}

    if user_queries:
        users = list(db["users"].find({"$or": user_queries}))
        for u in users:
            uid_str = str(u["_id"])
            full_name = u.get("full_name") or u.get("name") or (u.get("email", "").split("@")[0] if u.get("email") else None) or (f"User {u.get('phone', '')[-4:]}" if u.get("phone") else "Customer")
            u_info = {
                "name": full_name,
                "full_name": full_name,
                "email": u.get("email") or "",
                "phone": u.get("phone") or "",
                "avatar": u.get("avatar") or ""
            }
            users_map_by_id[uid_str] = u_info
            if u.get("id"):
                users_map_by_id[str(u.get("id"))] = u_info
            if u.get("email"):
                users_map_by_email[u.get("email").lower()] = u_info
            if u.get("phone"):
                users_map_by_phone[str(u.get("phone"))] = u_info

    for r in reviews:
        r["_id"] = str(r["_id"])
        uid = str(r.get("user_id") or "").strip()
        email = str(r.get("user_email") or r.get("email") or "").strip().lower()
        phone = str(r.get("user_phone") or r.get("phone") or "").strip()

        matched_user = users_map_by_id.get(uid) or users_map_by_email.get(email) or users_map_by_phone.get(phone)
        if matched_user:
            r["user_name"] = matched_user["full_name"]
            r["reviewer_name"] = matched_user["full_name"]
            if not r.get("user_email") and matched_user.get("email"):
                r["user_email"] = matched_user["email"]
            if not r.get("user_phone") and matched_user.get("phone"):
                r["user_phone"] = matched_user["phone"]
            if not r.get("user_avatar") and matched_user.get("avatar"):
                r["user_avatar"] = matched_user["avatar"]
        else:
            if not r.get("user_name"):
                r["user_name"] = r.get("reviewer_name") or (email.split("@")[0] if email else "Customer")
            r["reviewer_name"] = r.get("user_name")

        if "user_id" not in r or not r["user_id"]:
            r["user_id"] = "unknown"
        if "product_id" not in r or not r["product_id"]:
            r["product_id"] = "unknown"

    return reviews


@router.get("/can-review/{product_id}")
def can_user_review_product(product_id: str, current_user: Optional[dict] = Depends(get_optional_current_user)):
    """Check if the current user is eligible to write a review for this product"""
    if not current_user:
        return {"can_review": False, "reason": "not_logged_in"}

    return {"can_review": True}


@router.post("/", response_model=Review, status_code=201)
def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a new review (pending admin approval)"""
    db = get_database()
    reviews_collection = db["reviews"]

    user_id = str(current_user.get("id") or current_user.get("_id") or "")
    user_email = current_user.get("email") or ""

    has_purchased = check_user_purchased_product(db, user_id, user_email, review.product_id) if review.product_id else False

    try:
        review_data = review.model_dump()
        user_record = None
        if ObjectId.is_valid(user_id):
            user_record = db["users"].find_one({"_id": ObjectId(user_id)})
        elif user_id:
            user_record = db["users"].find_one({"id": user_id})
        if not user_record and user_email:
            user_record = db["users"].find_one({"email": user_email})

        full_user_name = None
        if user_record:
            full_user_name = user_record.get("full_name") or user_record.get("name")
        if not full_user_name:
            full_user_name = review_data.get("user_name") or current_user.get("name") or (user_email.split("@")[0] if user_email else None) or "Customer"

        review_data["user_id"] = user_id
        review_data["user_name"] = full_user_name
        review_data["reviewer_name"] = full_user_name
        review_data["user_email"] = user_email or (user_record.get("email") if user_record else "")
        review_data["user_phone"] = user_record.get("phone") if user_record else ""
        review_data["verified_purchase"] = bool(has_purchased or review_data.get("verified_purchase"))
        review_data["status"] = "pending"  # Requires Admin Approval to appear publicly
        review_data["images"] = review.images or []
        review_data["created_at"] = datetime.now()
        review_data["updated_at"] = datetime.now()
        review_data["helpful_count"] = 0

        result = reviews_collection.insert_one(review_data)
        review_data["_id"] = str(result.inserted_id)

        clear_api_cache()
        return review_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Review])
def get_all_reviews(
    skip: int = 0, 
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """Get all reviews with filters (Admin only)"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        query = {}
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"user_name": {"$regex": search, "$options": "i"}},
                {"reviewer_name": {"$regex": search, "$options": "i"}},
                {"product_name": {"$regex": search, "$options": "i"}},
                {"comment": {"$regex": search, "$options": "i"}}
            ]
        
        reviews = list(reviews_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
        _enrich_reviews_with_user_info(db, reviews)
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/product/{product_id}", response_model=List[Review])
def get_product_reviews(product_id: str, skip: int = 0, limit: int = 10):
    """Get reviews for a specific product (only approved reviews for public)"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        reviews = list(reviews_collection.find({
            "product_id": product_id,
            "status": "approved"
        }).skip(skip).limit(limit).sort("created_at", -1))
        _enrich_reviews_with_user_info(db, reviews)
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/product/{product_id}/stats")
def get_product_review_stats(product_id: str):
    """Get aggregated rating score, distribution (5, 4, 3, 2, 1 stars), and customer review images."""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        approved = list(reviews_collection.find({
            "product_id": product_id,
            "status": "approved"
        }))
        
        total_reviews = len(approved)
        distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        all_images = []
        
        for r in approved:
            rating_val = int(round(float(r.get("rating", 5))))
            rating_val = max(1, min(5, rating_val))
            distribution[rating_val] += 1
            imgs = r.get("images", []) or []
            for img in imgs:
                if img and img not in all_images:
                    all_images.append(img)
                    
        avg_rating = round(sum(r.get("rating", 5) for r in approved) / total_reviews, 1) if total_reviews > 0 else 0.0
        
        percentages = {}
        for star in [5, 4, 3, 2, 1]:
            percentages[star] = round((distribution[star] / total_reviews) * 100) if total_reviews > 0 else 0

        return {
            "product_id": product_id,
            "total_reviews": total_reviews,
            "average_rating": avg_rating,
            "distribution": distribution,
            "percentages": percentages,
            "images": all_images
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{review_id}", response_model=Review)
def get_review(review_id: str):
    """Get a specific review"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        review = reviews_collection.find_one({"_id": ObjectId(review_id)})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        enriched = _enrich_reviews_with_user_info(db, [review])
        return enriched[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{review_id}", response_model=Review)
def update_review(review_id: str, review_update: ReviewUpdate, current_user: dict = Depends(require_admin)):
    """Update a review (Admin only)"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        update_data = {k: v for k, v in review_update.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_data["updated_at"] = datetime.now()
        
        result = reviews_collection.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Review not found")
        enriched = _enrich_reviews_with_user_info(db, [result])
        return enriched[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _sync_product_rating(db, product_id: str):
    if not product_id or product_id == "unknown":
        return
    approved = list(db["reviews"].find({"product_id": str(product_id), "status": "approved"}))
    total_count = len(approved)
    avg_rating = round(sum(r.get("rating", 5) for r in approved) / total_count, 1) if total_count > 0 else 0.0
    conds = [{"_id": str(product_id)}, {"id": str(product_id)}]
    if ObjectId.is_valid(str(product_id)):
        conds.insert(0, {"_id": ObjectId(str(product_id))})
    db["products"].update_one({"$or": conds}, {
        "$set": {
            "rating": avg_rating,
            "review_count": total_count,
            "reviews_count": total_count,
            "total_reviews": total_count
        }
    })
    clear_api_cache()


@router.patch("/{review_id}/approve")
def approve_review(review_id: str, current_user: dict = Depends(require_admin)):
    """Approve a review (Admin only)"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        result = reviews_collection.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$set": {"status": "approved", "updated_at": datetime.now()}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Review not found")
        
        product_id = result.get("product_id")
        _sync_product_rating(db, product_id)

        enriched = _enrich_reviews_with_user_info(db, [result])
        return enriched[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{review_id}/reject")
def reject_review(review_id: str, current_user: dict = Depends(require_admin)):
    """Reject a review (Admin only)"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        result = reviews_collection.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$set": {"status": "rejected", "updated_at": datetime.now()}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Review not found")
        
        product_id = result.get("product_id")
        _sync_product_rating(db, product_id)

        enriched = _enrich_reviews_with_user_info(db, [result])
        return enriched[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{review_id}")
def delete_review(review_id: str, current_user: dict = Depends(require_admin)):
    """Delete a review (Admin only)"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        review_doc = reviews_collection.find_one({"_id": ObjectId(review_id)})
        result = reviews_collection.delete_one({"_id": ObjectId(review_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        
        if review_doc:
            _sync_product_rating(db, review_doc.get("product_id"))

        return {"message": "Review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
