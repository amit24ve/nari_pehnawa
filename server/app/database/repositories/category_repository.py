from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class CategoryRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["categories"]

    async def create(self, category_data: dict) -> dict:
        category_data["created_at"] = datetime.now()
        category_data["updated_at"] = datetime.now()
        result = await self.collection.insert_one(category_data)
        category_data["_id"] = str(result.inserted_id)
        return category_data

    async def get_by_id(self, category_id: str) -> Optional[dict]:
        category = await self.collection.find_one({"_id": ObjectId(category_id)})
        if category:
            category["_id"] = str(category["_id"])
        return category

    async def get_all(self, is_active: Optional[bool] = None) -> List[dict]:
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        cursor = self.collection.find(query).sort("display_order", 1)
        categories = await cursor.to_list(length=100)
        
        for category in categories:
            category["_id"] = str(category["_id"])
        
        return categories

    async def update(self, category_id: str, category_data: dict) -> Optional[dict]:
        category_data["updated_at"] = datetime.now()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(category_id)},
            {"$set": category_data},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def delete(self, category_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(category_id)})
        return result.deleted_count > 0

    async def get_by_name(self, name: str) -> Optional[dict]:
        category = await self.collection.find_one({"name": {"$regex": name, "$options": "i"}})
        if category:
            category["_id"] = str(category["_id"])
        return category
