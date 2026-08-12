"""
Gives every product (and every category) its own distinct, reliably-loading
image, using Picsum Photos (https://picsum.photos) with a unique seed per
document. LoremFlickr was switched away from because, in practice, many of
its keyword pools are tiny / rate-limited and it was serving the same
fallback photo for lots of products.

Picsum seeds are deterministic (same seed -> same photo forever) and the
service has no rate limits, so every product keeps a stable, unique image.

Safe to re-run.

Usage:
    cd server
    venv/bin/python3 fix_product_images.py
"""

from app.config import mongo_db, mongodb_url
from pymongo import MongoClient

client = MongoClient(mongodb_url)
db = client[mongo_db]
categories_col = db["categories"]
products_col = db["products"]


def fix_products():
    products = list(products_col.find({}, {"_id": 1, "name": 1}).sort("_id", 1))
    print(f"Found {len(products)} products")
    for i, p in enumerate(products):
        seed = f"nari-pehnawa-product-{i}-{p['_id']}"
        image_url = f"https://picsum.photos/seed/{seed}/600/800"
        products_col.update_one(
            {"_id": p["_id"]},
            {"$set": {"image": image_url, "images": [image_url]}},
        )
    print(f"Updated images for {len(products)} products")


def fix_categories():
    categories = list(categories_col.find({}, {"_id": 1, "name": 1}).sort("_id", 1))
    print(f"Found {len(categories)} categories")
    for i, c in enumerate(categories):
        seed = f"nari-pehnawa-category-{i}-{c['_id']}"
        image_url = f"https://picsum.photos/seed/{seed}/800/600"
        categories_col.update_one(
            {"_id": c["_id"]},
            {"$set": {"image": image_url}},
        )
    print(f"Updated images for {len(categories)} categories")


if __name__ == "__main__":
    fix_categories()
    fix_products()
    print("Done.")
