from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.database import get_database
from app.database.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.security import get_current_user, require_admin
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=Review, status_code=201)
def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a new review"""
    db = get_database()
    reviews_collection = db["reviews"]
    try:
        review_data = review.model_dump()
        review_data["status"] = "pending"
        review_data["created_at"] = datetime.now()
        review_data["updated_at"] = datetime.now()
        review_data["helpful_count"] = 0
        
        result = reviews_collection.insert_one(review_data)
        review_data["_id"] = str(result.inserted_id)
        return review_data
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
        result = reviews_collection.delete_one({"_id": ObjectId(review_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"message": "Review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
