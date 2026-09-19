from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from app.database import get_database
from app.database.schemas.wishlist import WishlistItem, WishlistItemCreate, WishlistItemWithProduct
from app.security import get_current_user
from bson import ObjectId
from datetime import datetime
from app.utils.cache import clear_api_cache

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


def _prod_query(pid: str):
    conds = [{"_id": pid}, {"id": pid}]
    if ObjectId.is_valid(pid):
        conds.insert(0, {"_id": ObjectId(pid)})
    return {"$or": conds}


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
                product_obj_id = ObjectId(item["product_id"]) if isinstance(item["product_id"], str) and ObjectId.is_valid(item["product_id"]) else item["product_id"]
                product = products_collection.find_one(_prod_query(str(item["product_id"])))
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
            product = products_collection.find_one(_prod_query(pid))
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
                # Increment product wishlist count
                products_collection.update_one(
                    _prod_query(pid),
                    {"$inc": {"wishlist_count": 1}}
                )
                added_count += 1
        except Exception:
            continue
            
    if added_count > 0:
        clear_api_cache()
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
        product = products_collection.find_one(_prod_query(item.product_id))
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
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
        
        # Increment wishlist_count on product
        products_collection.update_one(
            _prod_query(item.product_id),
            {"$inc": {"wishlist_count": 1}}
        )
        clear_api_cache()
        
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
    products_collection = db["products"]
    
    try:
        user_id = current_user.get("id")
        
        # Delete wishlist item
        result = wishlist_collection.delete_one({
            "user_id": user_id,
            "product_id": product_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found in wishlist")
        
        # Decrement wishlist_count on product
        updated = products_collection.find_one_and_update(
            _prod_query(product_id),
            {"$inc": {"wishlist_count": -1}},
            return_document=True
        )
        if updated and updated.get("wishlist_count", 0) < 0:
            products_collection.update_one(_prod_query(product_id), {"$set": {"wishlist_count": 0}})
        clear_api_cache()
        
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
