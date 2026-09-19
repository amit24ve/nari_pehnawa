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


@router.get("/can-review/{product_id}")
def can_user_review_product(product_id: str, current_user: Optional[dict] = Depends(get_optional_current_user)):
    """Check if the current user is eligible to write a review for this product"""
    if not current_user:
        return {"can_review": False, "reason": "not_logged_in"}

    db = get_database()
    user_id = str(current_user.get("id") or current_user.get("_id") or "")
    user_email = current_user.get("email") or ""

    if current_user.get("role") == "admin":
        return {"can_review": True, "reason": "admin"}

    has_purchased = check_user_purchased_product(db, user_id, user_email, product_id)
    if not has_purchased:
        return {"can_review": False, "reason": "not_purchased"}

    return {"can_review": True}


@router.post("/", response_model=Review, status_code=201)
def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a new review (pending admin approval; only verified purchasers can review)"""
    db = get_database()
    reviews_collection = db["reviews"]

    user_id = str(current_user.get("id") or current_user.get("_id") or "")
    user_email = current_user.get("email") or ""

    # Verify that the user has purchased the item (admin can bypass)
    if current_user.get("role") != "admin":
        has_purchased = check_user_purchased_product(db, user_id, user_email, review.product_id)
        if not has_purchased:
            raise HTTPException(
                status_code=403,
                detail="Only verified buyers who have purchased this product can leave a review."
            )

    try:
        review_data = review.model_dump()
        user_record = db["users"].find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else db["users"].find_one({"id": user_id})
        user_name = review_data.get("user_name") or (user_record.get("name") if user_record else None) or current_user.get("name") or "Verified Buyer"

        review_data["user_id"] = user_id
        review_data["user_name"] = user_name
        review_data["user_email"] = user_email
        review_data["verified_purchase"] = True
        review_data["status"] = "pending"  # Requires Admin Approval to appear publicly
        review_data["images"] = []  # No customer photo uploads
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
                {"product_name": {"$regex": search, "$options": "i"}},
                {"comment": {"$regex": search, "$options": "i"}}
            ]
        
        reviews = list(reviews_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
        for review in reviews:
            review["_id"] = str(review["_id"])
            if "user_name" not in review or not review["user_name"]:
                review["user_name"] = review.get("reviewer_name") or "Anonymous"
            if "user_id" not in review or not review["user_id"]:
                review["user_id"] = "unknown"
            if "product_id" not in review or not review["product_id"]:
                review["product_id"] = "unknown"
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
        for review in reviews:
            review["_id"] = str(review["_id"])
            if "user_name" not in review or not review["user_name"]:
                review["user_name"] = review.get("reviewer_name") or "Anonymous"
            if "user_id" not in review or not review["user_id"]:
                review["user_id"] = "unknown"
            if "product_id" not in review or not review["product_id"]:
                review["product_id"] = product_id
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
        review["_id"] = str(review["_id"])
        if "user_name" not in review or not review["user_name"]:
            review["user_name"] = review.get("reviewer_name") or "Anonymous"
        if "user_id" not in review or not review["user_id"]:
            review["user_id"] = "unknown"
        if "product_id" not in review or not review["product_id"]:
            review["product_id"] = "unknown"
        return review
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
        result["_id"] = str(result["_id"])
        return result
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

        result["_id"] = str(result["_id"])
        return result
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

        result["_id"] = str(result["_id"])
        return result
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
