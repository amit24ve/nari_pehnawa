from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
import random
import string


class OrderRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["orders"]

    def _generate_order_number(self) -> str:
        """Generate unique order number"""
        timestamp = datetime.now().strftime("%Y%m%d")
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"ORD-{timestamp}-{random_str}"

    async def create(self, order_data: dict) -> dict:
        order_data["order_number"] = self._generate_order_number()
        order_data["status"] = "pending"
        order_data["payment_status"] = "pending"
        order_data["created_at"] = datetime.now()
        order_data["updated_at"] = datetime.now()
        order_data["estimated_delivery"] = datetime.now() + timedelta(days=7)
        
        result = await self.collection.insert_one(order_data)
        order_data["_id"] = str(result.inserted_id)
        return order_data

    async def get_by_id(self, order_id: str) -> Optional[dict]:
        order = await self.collection.find_one({"_id": ObjectId(order_id)})
        if order:
            order["_id"] = str(order["_id"])
        return order

    async def get_by_order_number(self, order_number: str) -> Optional[dict]:
        order = await self.collection.find_one({"order_number": order_number})
        if order:
            order["_id"] = str(order["_id"])
        return order

    async def get_by_user_id(self, user_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        orders = await cursor.to_list(length=limit)
        
        for order in orders:
            order["_id"] = str(order["_id"])
        
        return orders

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[dict]:
        query = {}
        
        if status:
            query["status"] = status
        if payment_status:
            query["payment_status"] = payment_status

        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        orders = await cursor.to_list(length=limit)
        
        for order in orders:
            order["_id"] = str(order["_id"])
        
        return orders

    async def update(self, order_id: str, order_data: dict) -> Optional[dict]:
        order_data["updated_at"] = datetime.now()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": order_data},
            return_document=True
        )
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_status(self, order_id: str, status: str) -> Optional[dict]:
        return await self.update(order_id, {"status": status})

    async def update_payment_status(self, order_id: str, payment_status: str) -> Optional[dict]:
        return await self.update(order_id, {"payment_status": payment_status})

    async def delete(self, order_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(order_id)})
        return result.deleted_count > 0

    async def get_count(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> int:
        query = {}
        
        if user_id:
            query["user_id"] = user_id
        if status:
            query["status"] = status
        if payment_status:
            query["payment_status"] = payment_status

        return await self.collection.count_documents(query)
