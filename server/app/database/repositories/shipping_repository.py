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

    async def find_order_by_any_identifier(self, identifier: str, contact: Optional[str] = None, pincode: Optional[str] = None) -> Optional[dict]:
        clean_id = str(identifier or "").strip()
        clean_contact = str(contact or "").strip()
        clean_pincode = str(pincode or "").strip()

        def _fetch():
            doc = None
            if clean_id:
                # 1. Try by ObjectId
                try:
                    doc = self.orders.find_one({"_id": ObjectId(clean_id)})
                except Exception:
                    pass

                # 2. Try by order_number (e.g. ORD_20260927_1002, ORD-1002, NP-1002, 1002, #1002)
                if not doc:
                    variations = [
                        clean_id,
                        clean_id.lstrip("#"),
                        clean_id.replace("_", "-"),
                        clean_id.replace("-", "_"),
                        f"ORD_{clean_id.lstrip('#')}",
                        f"ORD-{clean_id.lstrip('#')}",
                        f"NP-{clean_id.lstrip('#')}",
                        clean_id.replace("NP-", "").replace("ORD-", "").replace("ORD_", "")
                    ]
                    for v in set(variations):
                        if not v:
                            continue
                        doc = self.orders.find_one({"order_number": {"$regex": f"^{v}$", "$options": "i"}})
                        if doc:
                            break

                # 3. Try by AWB
                if not doc:
                    doc = self.orders.find_one({"shipping.awb": clean_id})

                # 4. Try by shipment_id or shiprocket_order_id
                if not doc:
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

            # If no doc found by ID yet, but contact or pincode was supplied, find by contact & pincode
            if not doc and (clean_contact or clean_pincode):
                filter_conds = []
                if clean_contact:
                    phone_clean = clean_contact.replace("+91", "").replace(" ", "").strip()
                    filter_conds.append({
                        "$or": [
                            {"customer_email": {"$regex": f"^{clean_contact}$", "$options": "i"}},
                            {"email": {"$regex": f"^{clean_contact}$", "$options": "i"}},
                            {"shipping_address.email": {"$regex": f"^{clean_contact}$", "$options": "i"}},
                            {"customer_phone": {"$regex": phone_clean}},
                            {"phone": {"$regex": phone_clean}},
                            {"shipping_address.phone": {"$regex": phone_clean}},
                        ]
                    })
                if clean_pincode:
                    filter_conds.append({
                        "$or": [
                            {"shipping_address.postal_code": {"$regex": f"^{clean_pincode}$"}},
                            {"shipping_address.zip": {"$regex": f"^{clean_pincode}$"}},
                            {"shipping_address.pincode": {"$regex": f"^{clean_pincode}$"}},
                            {"pincode": {"$regex": f"^{clean_pincode}$"}},
                        ]
                    })
                if filter_conds:
                    doc = self.orders.find_one({"$and": filter_conds})

            return doc

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
        """Merge `shipping_info` fields into `orders.<id>.shipping` and sync root fields."""
        data = shipping_info.to_dict()
        set_fields = {f"shipping.{k}": v for k, v in data.items()}
        set_fields["updated_at"] = datetime.now()

        # Synchronize top-level helpers
        if shipping_info.awb:
            set_fields["awb_code"] = shipping_info.awb
        if shipping_info.courier_name:
            set_fields["courier_name"] = shipping_info.courier_name
        if shipping_info.shipment_status:
            set_fields["shipment_status"] = shipping_info.shipment_status
            sr_status = (shipping_info.shipment_status or "").lower()
            if sr_status in ("delivered", "completed"):
                set_fields["status"] = "delivered"
            elif sr_status in ("shipped", "in_transit", "out_for_delivery"):
                set_fields["status"] = "in_transit"
            elif sr_status in ("pickup_scheduled", "picked_up"):
                set_fields["status"] = "pickup_scheduled"
            elif sr_status in ("awb_assigned", "manifest_generated"):
                set_fields["status"] = "ready_to_ship"
            elif sr_status == "cancelled":
                set_fields["status"] = "cancelled"

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
            prev = self.orders.find_one({"_id": ObjectId(order_id)})
            prev_status = prev.get("status") if prev else None
            self.orders.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": {"status": status, "updated_at": datetime.now()}},
            )
            if prev:
                user_id = str(prev.get("user_id") or "")
                order_num = str(prev.get("order_number") or "")
                if status in ("delivered", "completed") and prev_status not in ("delivered", "completed"):
                    try:
                        from app.services.reward_coin_service import RewardCoinService
                        RewardCoinService(self.db).process_order_delivery(
                            user_id=user_id,
                            order_id=str(order_id),
                            order_number=order_num,
                            items=prev.get("items", []),
                            coins_to_award=int(prev.get("coins_earned") or 0) if prev.get("coins_earned") else None
                        )
                    except Exception as e:
                        print(f"[Coins] Error in shipping repo update_order_status delivery: {e}")
                elif status in ("cancelled", "returned", "refunded") and prev_status not in ("cancelled", "returned", "refunded"):
                    try:
                        from app.services.reward_coin_service import RewardCoinService
                        RewardCoinService(self.db).process_order_cancellation(
                            user_id=user_id,
                            order_id=str(order_id),
                            order_number=order_num,
                            coins_used=int(prev.get("coins_used") or 0),
                            coins_earned=int(prev.get("coins_earned") or 0),
                            action_type=status
                        )
                    except Exception as e:
                        print(f"[Coins] Error in shipping repo update_order_status cancel: {e}")

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
