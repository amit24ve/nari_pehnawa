from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.database import get_database
from app.database.schemas.address import Address, AddressCreate, AddressUpdate
from app.security import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("/", response_model=List[Address])
def get_user_addresses(current_user: dict = Depends(get_current_user)):
    """Get all addresses for the current user"""
    db = get_database()
    addresses_collection = db["addresses"]
    try:
        user_id = current_user.get("id")
        addresses = list(addresses_collection.find({"user_id": user_id}))
        
        result = []
        for address in addresses:
            address["id"] = str(address["_id"])
            address.pop("_id", None)
            result.append(address)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{address_id}", response_model=Address)
def get_address(address_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific address by ID"""
    db = get_database()
    addresses_collection = db["addresses"]
    try:
        address = addresses_collection.find_one({"_id": ObjectId(address_id)})
        
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # Check if address belongs to current user
        if address.get("user_id") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized to access this address")
        
        address["id"] = str(address["_id"])
        address.pop("_id", None)
        return address
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Address, status_code=201)
def create_address(address: AddressCreate, current_user: dict = Depends(get_current_user)):
    """Create a new address for the current user"""
    db = get_database()
    addresses_collection = db["addresses"]
    try:
        user_id = current_user.get("id")
        address_data = address.model_dump()
        address_data["user_id"] = user_id
        
        # If this is set as default, unset other defaults
        if address_data.get("is_default", False):
            addresses_collection.update_many(
                {"user_id": user_id},
                {"$set": {"is_default": False}}
            )
        
        result = addresses_collection.insert_one(address_data)
        address_data["id"] = str(result.inserted_id)
        address_data.pop("_id", None)
        
        return address_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{address_id}", response_model=Address)
def update_address(
    address_id: str, 
    address_update: AddressUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update an address"""
    db = get_database()
    addresses_collection = db["addresses"]
    try:
        # Check if address exists and belongs to user
        existing_address = addresses_collection.find_one({"_id": ObjectId(address_id)})
        if not existing_address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        if existing_address.get("user_id") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized to update this address")
        
        # Prepare update data
        update_data = {k: v for k, v in address_update.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # If setting as default, unset other defaults
        if update_data.get("is_default", False):
            addresses_collection.update_many(
                {"user_id": current_user.get("id"), "_id": {"$ne": ObjectId(address_id)}},
                {"$set": {"is_default": False}}
            )
        
        # Update address
        addresses_collection.update_one(
            {"_id": ObjectId(address_id)},
            {"$set": update_data}
        )
        
        # Get updated address
        updated_address = addresses_collection.find_one({"_id": ObjectId(address_id)})
        updated_address["id"] = str(updated_address["_id"])
        updated_address.pop("_id", None)
        
        return updated_address
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{address_id}")
def delete_address(address_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an address"""
    db = get_database()
    addresses_collection = db["addresses"]
    try:
        # Check if address exists and belongs to user
        existing_address = addresses_collection.find_one({"_id": ObjectId(address_id)})
        if not existing_address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        if existing_address.get("user_id") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized to delete this address")
        
        # Delete address
        result = addresses_collection.delete_one({"_id": ObjectId(address_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Address not found")
        
        return {"message": "Address deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{address_id}/set-default")
def set_default_address(address_id: str, current_user: dict = Depends(get_current_user)):
    """Set an address as default"""
    db = get_database()
    addresses_collection = db["addresses"]
    try:
        user_id = current_user.get("id")
        
        # Check if address exists and belongs to user
        existing_address = addresses_collection.find_one({"_id": ObjectId(address_id)})
        if not existing_address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        if existing_address.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this address")
        
        # Unset all defaults for this user
        addresses_collection.update_many(
            {"user_id": user_id},
            {"$set": {"is_default": False}}
        )
        
        # Set this address as default
        addresses_collection.update_one(
            {"_id": ObjectId(address_id)},
            {"$set": {"is_default": True}}
        )
        
        return {"message": "Default address updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
