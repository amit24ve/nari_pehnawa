"""
InventoryService — atomic stock management for the order lifecycle.

Every operation here uses a single atomic MongoDB `find_one_and_update`
with a query-side guard condition (e.g. `stock_quantity >= qty`), which is
how you avoid overselling under concurrent requests without needing a
distributed lock: MongoDB only lets one writer succeed the guarded update
per document at a time.

Lifecycle covered (from the spec):
    Product -> Available Stock -> Reserve Stock -> Order Placed
        -> Reduce Inventory -> Cancel Order -> Restore Inventory
        -> Return Approved -> Restore Inventory

Every stock change is written to `inventory_logs` for a full audit trail.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo.database import Database


class InsufficientStockError(Exception):
    """Raised when an operation would take stock below zero."""

    def __init__(self, product_id: str, requested: int, available: int):
        self.product_id = product_id
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for product {product_id}: "
            f"requested {requested}, available {available}"
        )


@dataclass
class StockLineItem:
    product_id: str
    quantity: int
    size: Optional[str] = None


class InventoryService:
    """
    Stateless helper bound to a pymongo `Database` for one request/thread.
    All methods are synchronous (matches the rest of this codebase's sync
    pymongo style — see app/database/__init__.py::get_database).
    """

    def __init__(self, db: Database):
        self.products = db["products"]
        self.logs = db["inventory_logs"]

    # ── internal ──────────────────────────────────────────────────────────

    def _log(
        self,
        product_id: str,
        change_type: str,
        quantity: int,
        stock_before: int,
        stock_after: int,
        order_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> None:
        self.logs.insert_one(
            {
                "product_id": product_id,
                "order_id": order_id,
                "change_type": change_type,
                "quantity": quantity,
                "stock_before": stock_before,
                "stock_after": stock_after,
                "reason": reason,
                "created_at": datetime.now(),
            }
        )

    def _to_oid(self, product_id: str) -> ObjectId:
        try:
            return ObjectId(product_id)
        except Exception as exc:
            raise ValueError(f"Invalid product_id: {product_id}") from exc

    # ── public API ────────────────────────────────────────────────────────

    def get_available_stock(self, product_id: str, size: Optional[str] = None) -> int:
        product = self.products.find_one(
            {"_id": self._to_oid(product_id)}, {"stock_quantity": 1, "size_stock": 1}
        )
        if not product:
            raise ValueError(f"Product not found: {product_id}")
        if size and product.get("size_stock") and size in product["size_stock"]:
            return int(product["size_stock"][size])
        return int(product.get("stock_quantity", 0))

    def check_availability(self, items: list[StockLineItem]) -> list[str]:
        """Returns a list of human-readable error strings for any item that
        doesn't have enough stock. Empty list means everything is available.
        Used by checkout to fail fast with a clear message before payment."""
        errors: list[str] = []
        for item in items:
            try:
                available = self.get_available_stock(item.product_id, size=item.size)
            except ValueError as exc:
                errors.append(str(exc))
                continue
            if available < item.quantity:
                sz_str = f" in size {item.size}" if item.size else ""
                errors.append(
                    f"Only {available} unit(s) left{sz_str} for product {item.product_id} "
                    f"(requested {item.quantity})"
                )
        return errors

    def reduce_stock(
        self, product_id: str, quantity: int, order_id: Optional[str] = None, size: Optional[str] = None
    ) -> int:
        """
        Atomically deducts `quantity` from stock_quantity (and size_stock.<size> if size provided),
        guarded in the query itself. Also flips `in_stock` to False once total stock reaches 0.
        """
        oid = self._to_oid(product_id)
        query = {"_id": oid, "stock_quantity": {"$gte": quantity}}
        inc_fields = {"stock_quantity": -quantity}
        if size:
            query[f"size_stock.{size}"] = {"$gte": quantity}
            inc_fields[f"size_stock.{size}"] = -quantity

        result = self.products.find_one_and_update(
            query,
            {"$inc": inc_fields},
            return_document=True,
        )
        if result is None:
            current = self.products.find_one({"_id": oid}, {"stock_quantity": 1, "size_stock": 1})
            available = int(current.get("stock_quantity", 0)) if current else 0
            if size and current and current.get("size_stock") and size in current["size_stock"]:
                available = int(current["size_stock"][size])
            raise InsufficientStockError(product_id, quantity, available)

        new_stock = int(result["stock_quantity"])
        if new_stock <= 0:
            self.products.update_one({"_id": oid}, {"$set": {"in_stock": False}})

        self._log(
            product_id,
            "reduce",
            -quantity,
            stock_before=new_stock + quantity,
            stock_after=new_stock,
            order_id=order_id,
            reason=f"Order placed ({size})" if size else "Order placed",
        )
        return new_stock

    def restore_stock(
        self,
        product_id: str,
        quantity: int,
        order_id: Optional[str] = None,
        reason: str = "Order cancelled",
        size: Optional[str] = None,
    ) -> int:
        """
        Atomically adds `quantity` back to stock_quantity and size_stock.<size>.
        """
        oid = self._to_oid(product_id)
        inc_fields = {"stock_quantity": quantity}
        if size:
            inc_fields[f"size_stock.{size}"] = quantity

        result = self.products.find_one_and_update(
            {"_id": oid},
            {"$inc": inc_fields, "$set": {"in_stock": True}},
            return_document=True,
        )
        if result is None:
            raise ValueError(f"Product not found: {product_id}")

        new_stock = int(result["stock_quantity"])
        self._log(
            product_id,
            "restore",
            quantity,
            stock_before=new_stock - quantity,
            stock_after=new_stock,
            order_id=order_id,
            reason=reason,
        )
        return new_stock

    def reduce_stock_for_order(
        self, items: list[StockLineItem], order_id: str
    ) -> None:
        """
        Reduce stock for every item in an order. This is called only AFTER
        payment success / COD order confirmation (never at cart or "pending
        payment" stage) so browsing/abandoned carts never lock up stock.

        If any single item fails (insufficient stock — can happen if two
        customers checked out concurrently for the last unit), every item
        already deducted in this same call is rolled back before raising,
        so the order never ends up partially fulfilled from an inventory
        standpoint.
        """
        applied: list[StockLineItem] = []
        try:
            for item in items:
                self.reduce_stock(item.product_id, item.quantity, order_id=order_id, size=item.size)
                applied.append(item)
        except InsufficientStockError:
            for done in applied:
                self.restore_stock(
                    done.product_id,
                    done.quantity,
                    order_id=order_id,
                    reason="Rollback: order failed due to insufficient stock on another item",
                    size=done.size,
                )
            raise

    def restore_stock_for_order(
        self, items: list[StockLineItem], order_id: str, reason: str = "Order cancelled"
    ) -> None:
        """Restore stock for every item in a cancelled order or an approved
        return. Best-effort per item — logs/continues even if one product
        was deleted since the order was placed, rather than aborting the
        whole restore."""
        for item in items:
            try:
                self.restore_stock(item.product_id, item.quantity, order_id=order_id, reason=reason, size=item.size)
            except ValueError:
                continue


def get_inventory_service(db: Database) -> InventoryService:
    return InventoryService(db)
