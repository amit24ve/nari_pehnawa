from copy import deepcopy
from datetime import datetime
from zoneinfo import ZoneInfo


IST = ZoneInfo("Asia/Kolkata")


class FlashSaleService:
    """Calculate live promotions from canonical catalog prices.

    Clients may preview this result, but only this server-side calculation is
    trusted when an order or Razorpay payment is created.
    """

    def __init__(self, db):
        self.db = db

    @staticmethod
    def _date(value):
        if not value:
            return None
        if isinstance(value, datetime):
            parsed = value
        else:
            try:
                parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            except (TypeError, ValueError):
                return None
        return parsed.replace(tzinfo=IST) if parsed.tzinfo is None else parsed.astimezone(IST)

    @classmethod
    def _live(cls, sale, now):
        if not sale.get("is_active", True):
            return False
        start = cls._date(sale.get("start_time"))
        end = cls._date(sale.get("end_time"))
        return (not start or now >= start) and (not end or now <= end)

    @staticmethod
    def _priority(sale):
        return {"custom_products": 3, "product": 3, "products": 3, "category": 2, "all": 1}.get(
            str(sale.get("target_type") or "all").lower(), 1
        )

    @staticmethod
    def _signature(sale):
        product_ids = tuple(sorted(str(value) for value in (sale.get("target_product_ids") or [])))
        return (
            str(sale.get("title") or ""),
            str(sale.get("deal_type") or "").lower(),
            int(sale.get("buy_qty") or 0),
            int(sale.get("get_free_qty") or 0),
            int(sale.get("discount_percentage") or 0),
            str(sale.get("target_type") or "all").lower(),
            str(sale.get("target_category") or "").strip().lower(),
            product_ids,
            str(sale.get("start_time") or ""),
            str(sale.get("end_time") or ""),
        )

    def _campaigns(self):
        rows = list(self.db["flash_sales"].find({}))
        if not rows:
            legacy = self.db["flash_sale"].find_one({"key": "active_sale"})
            rows = [legacy] if legacy else []
        now = datetime.now(IST)
        unique = {}
        for sale in rows:
            if sale and self._live(sale, now):
                unique[self._signature(sale)] = sale
        return sorted(
            unique.values(),
            key=lambda sale: (self._priority(sale), str(sale.get("updated_at") or "")),
            reverse=True,
        )

    @staticmethod
    def _matches(sale, item):
        product_id = str(item.get("product_id") or "")
        target_ids = {str(value) for value in (sale.get("target_product_ids") or [])}
        if target_ids:
            return product_id in target_ids
        target_type = str(sale.get("target_type") or "all").lower()
        if target_type in {"product", "products", "custom_products"}:
            return False
        if target_type == "category":
            return str(item.get("category") or "").strip().lower() == str(
                sale.get("target_category") or ""
            ).strip().lower()
        return target_type == "all"

    @staticmethod
    def _buy_get(sale):
        deal_type = str(sale.get("deal_type") or "").lower()
        return (
            int(sale.get("buy_qty") or 0) > 0
            and int(sale.get("get_free_qty") or 0) > 0
            and (deal_type == "bogo" or "buy" in deal_type or "get" in deal_type)
        )

    def calculate(self, canonical_items):
        campaigns = self._campaigns()
        items = deepcopy(canonical_items)
        groups = {}
        for index, item in enumerate(items):
            sale = next((candidate for candidate in campaigns if self._matches(candidate, item)), None)
            if not sale:
                continue
            signature = self._signature(sale)
            group = groups.setdefault(signature, {"sale": sale, "units": []})
            for _ in range(max(0, int(item.get("quantity") or 0))):
                group["units"].append((round(float(item.get("price") or 0), 2), index))

        total_discount = 0.0
        offers = []
        line_discounts = {index: 0.0 for index in range(len(items))}
        free_quantities = {index: 0 for index in range(len(items))}
        for group in groups.values():
            sale = group["sale"]
            units = group["units"]
            campaign_discount = 0.0
            free_count = 0
            if self._buy_get(sale):
                buy = max(1, int(sale.get("buy_qty") or 1))
                free = max(1, int(sale.get("get_free_qty") or 1))
                free_count = (len(units) // (buy + free)) * free
                for price, item_index in sorted(units, key=lambda unit: unit[0])[:free_count]:
                    campaign_discount += price
                    line_discounts[item_index] += price
                    free_quantities[item_index] += 1
                label = f"Buy {buy} · Get {free} Free"
            elif str(sale.get("deal_type") or "").lower() in {"percentage", "percent"}:
                percentage = min(100, max(0, int(sale.get("discount_percentage") or 0)))
                for price, item_index in units:
                    saving = round(price * percentage / 100, 2)
                    campaign_discount += saving
                    line_discounts[item_index] += saving
                label = f"{percentage}% Off"
            else:
                continue
            campaign_discount = round(campaign_discount, 2)
            total_discount += campaign_discount
            offers.append(
                {
                    "campaign_id": str(sale.get("_id") or sale.get("id") or sale.get("key") or ""),
                    "title": str(sale.get("title") or "Flash Sale"),
                    "label": label,
                    "eligible_items": len(units),
                    "free_items": free_count,
                    "discount": campaign_discount,
                }
            )

        for index, item in enumerate(items):
            saving = round(line_discounts[index], 2)
            if saving:
                item["flash_sale_discount"] = saving
                item["flash_sale_free_quantity"] = free_quantities[index]
                item["payable_total"] = round(max(0.0, float(item.get("total") or 0) - saving), 2)
        return {"discount": round(total_discount, 2), "offers": offers, "items": items}
