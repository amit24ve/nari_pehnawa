from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from app.database import get_database
from app.database.schemas.wishlist import WishlistItem, WishlistItemCreate, WishlistItemWithProduct
from app.security import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


class MergeWishlistRequest(BaseModel):
    product_ids: List[str]


@router.get("/", response_model=List[WishlistItemWithProduct])
def get_wishlist(current_user: dict = Depends(get_current_user)):
    """Get all wishlist items for the current user"""
    db = get_database()
    wishlist_collection = db["wishlist"]
    products_collection = db["products"]
    
    try:
        user_id = current_user.get("id")
        wishlist_items = list(wishlist_collection.find({"user_id": user_id}))
        
        result = []
        for item in wishlist_items:
            item["id"] = str(item["_id"])
            item.pop("_id", None)
            
            # Get product details
            try:
                product_obj_id = ObjectId(item["product_id"]) if isinstance(item["product_id"], str) else item["product_id"]
                product = products_collection.find_one({"_id": product_obj_id})
                if product:
                    product["id"] = str(product["_id"])
                    product.pop("_id", None)
                    item["product"] = product
                else:
                    item["product"] = None
            except Exception:
                item["product"] = None
            
            result.append(item)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/merge")
def merge_wishlist(request: MergeWishlistRequest, current_user: dict = Depends(get_current_user)):
    """Merge guest wishlist items with user wishlist"""
    db = get_database()
    wishlist_collection = db["wishlist"]
    products_collection = db["products"]
    user_id = current_user.get("id")
    
    added_count = 0
    for pid in request.product_ids:
        try:
            # Check if product exists in database
            product_obj_id = ObjectId(pid)
            product = products_collection.find_one({"_id": product_obj_id})
            if not product:
                continue
            
            # Check if already in user wishlist
            existing = wishlist_collection.find_one({
                "user_id": user_id,
                "product_id": pid
            })
            if not existing:
                wishlist_collection.insert_one({
                    "user_id": user_id,
                    "product_id": pid,
                    "added_at": datetime.now().isoformat()
                })
                added_count += 1
        except Exception:
            continue
            
    return {"success": True, "added_count": added_count}


@router.post("/", response_model=WishlistItem, status_code=201)
def add_to_wishlist(item: WishlistItemCreate, current_user: dict = Depends(get_current_user)):
    """Add a product to wishlist"""
    db = get_database()
    wishlist_collection = db["wishlist"]
    products_collection = db["products"]
    
    try:
        user_id = current_user.get("id")
        
        # Check if product exists
        try:
            product_obj_id = ObjectId(item.product_id)
            product = products_collection.find_one({"_id": product_obj_id})
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid product ID")
        
        # Check if item already in wishlist
        existing = wishlist_collection.find_one({
            "user_id": user_id,
            "product_id": item.product_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Product already in wishlist")
        
        # Add to wishlist
        wishlist_data = {
            "user_id": user_id,
            "product_id": item.product_id,
            "added_at": datetime.now().isoformat()
        }
        
        result = wishlist_collection.insert_one(wishlist_data)
        wishlist_data["id"] = str(result.inserted_id)
        wishlist_data.pop("_id", None)
        
        return wishlist_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a product from wishlist"""
    db = get_database()
    wishlist_collection = db["wishlist"]
    
    try:
        user_id = current_user.get("id")
        
        # Delete wishlist item
        result = wishlist_collection.delete_one({
            "user_id": user_id,
            "product_id": product_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found in wishlist")
        
        return {"message": "Product removed from wishlist successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
def clear_wishlist(current_user: dict = Depends(get_current_user)):
    """Clear all wishlist items for the current user"""
    db = get_database()
    wishlist_collection = db["wishlist"]
    
    try:
        user_id = current_user.get("id")
        result = wishlist_collection.delete_many({"user_id": user_id})
        
        return {
            "message": f"Wishlist cleared successfully",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{product_id}")
def check_in_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    """Check if a product is in the wishlist"""
    db = get_database()
    wishlist_collection = db["wishlist"]
    
    try:
        user_id = current_user.get("id")
        item = wishlist_collection.find_one({
            "user_id": user_id,
            "product_id": product_id
        })
        
        return {"in_wishlist": item is not None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
