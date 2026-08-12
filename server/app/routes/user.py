from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.database.schemas.user import User, UserCreate, UserUpdate, PasswordChange, UserSettings
from app.database import get_database
from app.security import get_password_hash, get_current_user, require_admin, verify_password
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=User, status_code=201)
def create_user(user: UserCreate):
    """Create a new user with hashed password"""
    db = get_database()
    users_collection = db["users"]
    try:
        existing_user = users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        user_data = user.model_dump(exclude={"password"})
        user_data["password_hash"] = get_password_hash(user.password)
        user_data["joined_date"] = datetime.now().strftime("%Y-%m-%d")
        user_data["orders_count"] = 0
        
        result = users_collection.insert_one(user_data)
        user_data["id"] = str(result.inserted_id)
        user_data.pop("_id", None)
        user_data.pop("password_hash", None)
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[User])
def get_users(
    skip: int = Query(0, ge=0), 
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """Get all users with pagination and filters (Admin only)"""
    db = get_database()
    users_collection = db["users"]
    orders_collection = db["orders"]
    try:
        query = {}
        if role:
            query["role"] = role
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = users_collection.find(query).skip(skip).limit(limit)
        users = list(cursor)
        for user in users:
            user["id"] = str(user["_id"])
            # Get order count for each user
            user["orders_count"] = orders_collection.count_documents({"user_id": user["id"]})
            user.pop("_id", None)
            user.pop("password_hash", None)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Current User (me) Routes - Must be before /{user_id} =====
@router.get("/me", response_model=User)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user's profile"""
    db = get_database()
    users_collection = db["users"]
    orders_collection = db["orders"]
    try:
        user_id = current_user.get("id")
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user["id"] = str(user["_id"])
        user["orders_count"] = orders_collection.count_documents({"user_id": user_id})
        user.pop("_id", None)
        user.pop("password_hash", None)
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me", response_model=User)
def update_current_user_profile_v2(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update current authenticated user's profile"""
    db = get_database()
    users_collection = db["users"]
    try:
        user_id = current_user.get("id")
        
        # Prepare update data (exclude None values and restricted fields)
        update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
        
        # Remove fields that users shouldn't be able to update themselves
        update_data.pop("role", None)
        update_data.pop("is_admin", None)
        update_data.pop("status", None)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Check if email is being changed and if it's already taken
        if "email" in update_data:
            existing = users_collection.find_one({
                "email": update_data["email"],
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
        
        # Update user
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Get updated user
        updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
        updated_user["id"] = str(updated_user["_id"])
        updated_user.pop("_id", None)
        updated_user.pop("password_hash", None)
        
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Other User Routes =====
@router.get("/{user_id}", response_model=User)
def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific user by ID (Authenticated users only)"""
    db = get_database()
    users_collection = db["users"]
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/email/{email}", response_model=User)
def get_user_by_email(email: str):
    """Get a user by email address"""
    db = get_database()
    users_collection = db["users"]
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}", response_model=User)
def update_user(user_id: str, user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update user information (User can update own profile, Admin can update any)"""
    db = get_database()
    users_collection = db["users"]
    try:
        # Check if user exists
        existing_user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update data (exclude None values)
        update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update user
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Get updated user
        updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
        updated_user["id"] = str(updated_user["_id"])
        updated_user.pop("_id", None)
        updated_user.pop("password_hash", None)
        
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}")
def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Delete a user (Admin only)"""
    db = get_database()
    users_collection = db["users"]
    try:
        result = users_collection.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/change-password")
def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change current user's password"""
    db = get_database()
    users_collection = db["users"]
    try:
        user_id = current_user.get("id")
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not verify_password(password_data.current_password, user.get("password_hash")):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash and update new password
        new_password_hash = get_password_hash(password_data.new_password)
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password_hash": new_password_hash}}
        )
        
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/settings")
def get_user_settings(current_user: dict = Depends(get_current_user)):
    """Get current user's settings"""
    db = get_database()
    users_collection = db["users"]
    try:
        user_id = current_user.get("id")
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return settings or defaults
        settings = user.get("settings", {
            "notifications": {
                "orderUpdates": True,
                "promotions": False,
                "newsletter": True,
                "sms": False
            },
            "privacy": {
                "showProfile": True,
                "showOrders": False
            }
        })
        
        return settings
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me/settings")
def update_user_settings(settings: UserSettings, current_user: dict = Depends(get_current_user)):
    """Update current user's settings"""
    db = get_database()
    users_collection = db["users"]
    try:
        user_id = current_user.get("id")
        
        # Prepare settings data
        settings_data = {}
        if settings.notifications is not None:
            settings_data["settings.notifications"] = settings.notifications
        if settings.privacy is not None:
            settings_data["settings.privacy"] = settings.privacy
        
        if not settings_data:
            raise HTTPException(status_code=400, detail="No settings to update")
        
        # Update settings
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": settings_data}
        )
        
        return {"message": "Settings updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
