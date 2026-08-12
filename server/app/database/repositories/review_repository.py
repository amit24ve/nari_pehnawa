from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class ReviewRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["reviews"]

    async def create(self, review_data: dict) -> dict:
        review_data["created_at"] = datetime.now()
        review_data["updated_at"] = datetime.now()
        review_data["helpful_count"] = 0
        result = await self.collection.insert_one(review_data)
        review_data["_id"] = str(result.inserted_id)
        return review_data

    async def get_by_id(self, review_id: str) -> Optional[dict]:
        review = await self.collection.find_one({"_id": ObjectId(review_id)})
        if review:
            review["_id"] = str(review["_id"])
        return review

    async def get_by_product_id(
        self,
        product_id: str,
        skip: int = 0,
        limit: int = 10,
        min_rating: Optional[float] = None
    ) -> List[dict]:
        query = {"product_id": product_id}
        
        if min_rating is not None:
            query["rating"] = {"$gte": min_rating}

        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        reviews = await cursor.to_list(length=limit)
        
        for review in reviews:
            review["_id"] = str(review["_id"])
        
        return reviews

    async def get_by_user_id(self, user_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        reviews = await cursor.to_list(length=limit)
        
        for review in reviews:
            review["_id"] = str(review["_id"])
        
        return reviews

    async def update(self, review_id: str, review_data: dict) -> Optional[dict]:
        review_data["updated_at"] = datetime.now()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$set": review_data},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def delete(self, review_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(review_id)})
        return result.deleted_count > 0

    async def get_count(self, product_id: str, min_rating: Optional[float] = None) -> int:
        query = {"product_id": product_id}
        
        if min_rating is not None:
            query["rating"] = {"$gte": min_rating}

        return await self.collection.count_documents(query)

    async def get_average_rating(self, product_id: str) -> float:
        pipeline = [
            {"$match": {"product_id": product_id}},
            {"$group": {"_id": None, "average": {"$avg": "$rating"}}}
        ]
        
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            return round(result[0]["average"], 1)
        return 0.0

    async def increment_helpful(self, review_id: str) -> Optional[dict]:
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$inc": {"helpful_count": 1}},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result
