from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import mongodb_url, mongo_db
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class ProductRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["products"]

    async def create(self, product_data: dict) -> dict:
        product_data["created_at"] = datetime.now()
        product_data["updated_at"] = datetime.now()
        result = await self.collection.insert_one(product_data)
        product_data["_id"] = str(result.inserted_id)
        return product_data

    async def get_by_id(self, product_id: str) -> Optional[dict]:
        product = await self.collection.find_one({"_id": ObjectId(product_id)})
        if product:
            product["_id"] = str(product["_id"])
        return product

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
        category: Optional[str] = None,
        on_sale: Optional[bool] = None,
        is_new: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> List[dict]:
        query = {}
        
        if category:
            query["category"] = {"$regex": category, "$options": "i"}
        if on_sale is not None:
            query["on_sale"] = on_sale
        if is_new is not None:
            query["is_new"] = is_new
        if min_price is not None or max_price is not None:
            query["price"] = {}
            if min_price is not None:
                query["price"]["$gte"] = min_price
            if max_price is not None:
                query["price"]["$lte"] = max_price
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]

        cursor = self.collection.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
        products = await cursor.to_list(length=limit)
        
        for product in products:
            product["_id"] = str(product["_id"])
        
        return products

    async def get_count(
        self,
        category: Optional[str] = None,
        on_sale: Optional[bool] = None,
        is_new: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None
    ) -> int:
        query = {}
        
        if category:
            query["category"] = {"$regex": category, "$options": "i"}
        if on_sale is not None:
            query["on_sale"] = on_sale
        if is_new is not None:
            query["is_new"] = is_new
        if min_price is not None or max_price is not None:
            query["price"] = {}
            if min_price is not None:
                query["price"]["$gte"] = min_price
            if max_price is not None:
                query["price"]["$lte"] = max_price
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]

        return await self.collection.count_documents(query)

    async def update(self, product_id: str, product_data: dict) -> Optional[dict]:
        product_data["updated_at"] = datetime.now()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": product_data},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def delete(self, product_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(product_id)})
        return result.deleted_count > 0

    async def get_by_category(self, category: str, limit: int = 10) -> List[dict]:
        cursor = self.collection.find({"category": {"$regex": category, "$options": "i"}}).limit(limit)
        products = await cursor.to_list(length=limit)
        
        for product in products:
            product["_id"] = str(product["_id"])
        
        return products

    async def update_rating(self, product_id: str, rating: float, review_count: int) -> Optional[dict]:
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": {"rating": rating, "review_count": review_count, "updated_at": datetime.now()}},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result
