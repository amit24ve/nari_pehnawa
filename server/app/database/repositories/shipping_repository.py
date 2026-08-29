"""
Repository layer for shipping data.

The rest of this codebase talks to MongoDB through a single synchronous
`pymongo.MongoClient` (see app/database/__init__.py::get_database), so this
repository follows the same convention rather than introducing a second,
motor-based async connection. To keep the shipping module's route handlers
and service layer fully async (as required for the httpx-based Shiprocket
client), each blocking pymongo call is dispatched to a worker thread via
`asyncio.to_thread` so it never blocks the event loop.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from pymongo.database import Database

from app.models.shipping import ShippingEvent, ShippingInfo


class ShippingRepository:
    """Persistence for `orders.shipping` and the `shipping_events` audit log."""

    def __init__(self, db: Database):
        self.orders = db["orders"]
        self.events = db["shipping_events"]

    # ── Orders ───────────────────────────────────────────────────────────────

    async def get_order(self, order_id: str) -> Optional[dict]:
        def _fetch():
            return self.orders.find_one({"_id": ObjectId(order_id)})

        return await asyncio.to_thread(_fetch)

    async def find_order_by_any_identifier(self, identifier: str) -> Optional[dict]:
        clean_id = str(identifier).strip()
        def _fetch():
            # 1. Try by ObjectId
            try:
                doc = self.orders.find_one({"_id": ObjectId(clean_id)})
                if doc:
                    return doc
            except Exception:
                pass

            # 2. Try by order_number (e.g. NP-1002, 1002, #1002)
            variations = [
                clean_id,
                clean_id.lstrip("#"),
                f"NP-{clean_id}",
                clean_id.replace("NP-", "")
            ]
            for v in variations:
                doc = self.orders.find_one({"order_number": {"$regex": f"^{v}$", "$options": "i"}})
                if doc:
                    return doc

            # 3. Try by AWB
            doc = self.orders.find_one({"shipping.awb": clean_id})
            if doc:
                return doc

            # 4. Try by shipment_id or shiprocket_order_id
            try:
                int_id = int(clean_id)
            except Exception:
                int_id = None

            q = [
                {"shipping.shipment_id": clean_id},
                {"shipping.shiprocket_order_id": clean_id}
            ]
            if int_id is not None:
                q.extend([
                    {"shipping.shipment_id": int_id},
                    {"shipping.shiprocket_order_id": int_id}
                ])
            doc = self.orders.find_one({"$or": q})
            if doc:
                return doc

            return None

        return await asyncio.to_thread(_fetch)

    async def find_order_by_awb(self, awb: str) -> Optional[dict]:
        def _fetch():
            return self.orders.find_one({"shipping.awb": awb})

        return await asyncio.to_thread(_fetch)

    async def find_order_by_shiprocket_order_id(
        self, shiprocket_order_id: Any
    ) -> Optional[dict]:
        def _fetch():
            try:
                int_val = int(shiprocket_order_id)
            except (ValueError, TypeError):
                int_val = None

            query = {"$or": [{"shipping.shiprocket_order_id": shiprocket_order_id}]}
            if int_val is not None:
                query["$or"].append({"shipping.shiprocket_order_id": int_val})
            
            query["$or"].append({"shipping.shiprocket_order_id": str(shiprocket_order_id)})
            return self.orders.find_one(query)

        return await asyncio.to_thread(_fetch)

    async def find_order_by_shipment_id(self, shipment_id: Any) -> Optional[dict]:
        def _fetch():
            try:
                int_val = int(shipment_id)
            except (ValueError, TypeError):
                int_val = None

            query = {"$or": [{"shipping.shipment_id": shipment_id}]}
            if int_val is not None:
                query["$or"].append({"shipping.shipment_id": int_val})
            
            query["$or"].append({"shipping.shipment_id": str(shipment_id)})
            return self.orders.find_one(query)

        return await asyncio.to_thread(_fetch)

    async def update_shipping_info(
        self, order_id: str, shipping_info: ShippingInfo
    ) -> Optional[dict]:
        """Merge `shipping_info` fields into `orders.<id>.shipping`."""
        data = shipping_info.to_dict()
        set_fields = {f"shipping.{k}": v for k, v in data.items()}
        set_fields["updated_at"] = datetime.now()

        def _update():
            return self.orders.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": set_fields},
                return_document=True,
            )

        return await asyncio.to_thread(_update)

    async def update_shipping_by_awb(self, awb: str, fields: dict) -> Optional[dict]:
        set_fields = {f"shipping.{k}": v for k, v in fields.items()}
        set_fields["updated_at"] = datetime.now()

        def _update():
            return self.orders.find_one_and_update(
                {"shipping.awb": awb},
                {"$set": set_fields},
                return_document=True,
            )

        return await asyncio.to_thread(_update)

    async def update_order_status(self, order_id: str, status: str) -> None:
        def _update():
            self.orders.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": {"status": status, "updated_at": datetime.now()}},
            )

        await asyncio.to_thread(_update)

    async def get_orders_pending_shipment(self, limit: int = 50) -> list[dict]:
        """Orders that are paid/confirmed but have no Shiprocket shipment yet."""

        def _fetch():
            query = {
                "status": {"$in": ["confirmed", "paid", "processing"]},
                "$or": [
                    {"shipping": {"$exists": False}},
                    {"shipping.shipment_id": None},
                ],
            }
            return list(self.orders.find(query).limit(limit))

        return await asyncio.to_thread(_fetch)

    # ── Events (webhook audit log) ───────────────────────────────────────────

    async def log_event(self, event: ShippingEvent) -> None:
        def _insert():
            self.events.insert_one(event.to_dict())

        await asyncio.to_thread(_insert)
