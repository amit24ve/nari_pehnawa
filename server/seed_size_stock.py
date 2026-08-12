"""
Populates `size_stock` for all 1,800 products in MongoDB.
For products with sizes (e.g. S, M, L, XL, XXL):
Assigns realistic stock numbers per size (e.g., S: 10, M: 12, L: 5, XL: 2, XXL: 0),
making some sizes low-stock and some out-of-stock to demonstrate full inventory control.
"""

from pymongo import MongoClient, UpdateOne
from app.config import mongodb_url, mongo_db

client = MongoClient(mongodb_url)
db = client[mongo_db]
products_col = db["products"]

def main():
    products = list(products_col.find({}, {"_id": 1, "sizes": 1, "category": 1}))
    print(f"Found {len(products)} products to update with size_stock")

    updates = []
    for i, p in enumerate(products):
        sizes = p.get("sizes") or []
        if not sizes:
            # Home decor items or non-sized products keep standard stock
            continue

        # Generate realistic size stock counts
        # Pattern varies across products so some have XXL out of stock, some S out of stock, etc.
        size_stock = {}
        total_stock = 0
        
        for idx, sz in enumerate(sizes):
            # Deterministic variation per product and size index
            qty = (i * 3 + idx * 7 + 2) % 16  # 0 to 15
            if (i + idx) % 5 == 0:
                qty = 0  # Out of stock for this size
            elif (i + idx) % 7 == 0:
                qty = 2  # Low stock (2 left)
            elif (i + idx) % 11 == 0:
                qty = 1  # Low stock (1 left)

            size_stock[sz] = qty
            total_stock += qty

        updates.append(
            UpdateOne(
                {"_id": p["_id"]},
                {
                    "$set": {
                        "size_stock": size_stock,
                        "stock_quantity": total_stock,
                        "in_stock": total_stock > 0,
                    }
                },
            )
        )

    if updates:
        res = products_col.bulk_write(updates)
        print(f"Successfully updated size_stock for {res.modified_count} products!")

if __name__ == "__main__":
    main()
