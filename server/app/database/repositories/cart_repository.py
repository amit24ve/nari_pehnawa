from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from datetime import datetime
from bson import ObjectId


class CartRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["carts"]

    async def create(self, cart_data: dict) -> dict:
        cart_data["created_at"] = datetime.now()
        cart_data["updated_at"] = datetime.now()
        cart_data["total_amount"] = 0.0
        cart_data["total_items"] = 0
        result = await self.collection.insert_one(cart_data)
        cart_data["_id"] = str(result.inserted_id)
        return cart_data

    async def get_by_user_id(self, user_id: str) -> Optional[dict]:
        cart = await self.collection.find_one({"user_id": user_id})
        if cart:
            cart["_id"] = str(cart["_id"])
        return cart

    async def update(self, user_id: str, cart_data: dict) -> Optional[dict]:
        cart_data["updated_at"] = datetime.now()
        
        # Calculate totals
        total_amount = sum(item.get("price", 0) * item.get("quantity", 0) for item in cart_data.get("items", []))
        total_items = sum(item.get("quantity", 0) for item in cart_data.get("items", []))
        
        cart_data["total_amount"] = total_amount
        cart_data["total_items"] = total_items
        
        result = await self.collection.find_one_and_update(
            {"user_id": user_id},
            {"$set": cart_data},
            return_document=True,
            upsert=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def add_item(self, user_id: str, item: dict) -> Optional[dict]:
        item["added_at"] = datetime.now()
        
        # Check if cart exists
        cart = await self.get_by_user_id(user_id)
        
        if cart:
            # Check if item already exists
            existing_items = cart.get("items", [])
            item_exists = False
            
            for existing_item in existing_items:
                if (existing_item["product_id"] == item["product_id"] and 
                    existing_item["size"] == item["size"] and 
                    existing_item.get("color") == item.get("color")):
                    existing_item["quantity"] += item["quantity"]
                    item_exists = True
                    break
            
            if not item_exists:
                existing_items.append(item)
            
            return await self.update(user_id, {"items": existing_items})
        else:
            # Create new cart
            return await self.create({
                "user_id": user_id,
                "items": [item]
            })

    async def remove_item(self, user_id: str, product_id: str, size: str, color: Optional[str] = None) -> Optional[dict]:
        cart = await self.get_by_user_id(user_id)
        
        if cart:
            items = cart.get("items", [])
            items = [
                item for item in items
                if not (item["product_id"] == product_id and 
                       item["size"] == size and 
                       item.get("color") == color)
            ]
            
            return await self.update(user_id, {"items": items})
        
        return None

    async def update_item_quantity(self, user_id: str, product_id: str, size: str, quantity: int, color: Optional[str] = None) -> Optional[dict]:
        cart = await self.get_by_user_id(user_id)
        
        if cart:
            items = cart.get("items", [])
            
            for item in items:
                if (item["product_id"] == product_id and 
                    item["size"] == size and 
                    item.get("color") == color):
                    item["quantity"] = quantity
                    break
            
            return await self.update(user_id, {"items": items})
        
        return None

    async def clear(self, user_id: str) -> Optional[dict]:
        return await self.update(user_id, {"items": []})

    async def delete(self, user_id: str) -> bool:
        result = await self.collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0
