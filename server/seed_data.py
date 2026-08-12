"""
One-off / re-runnable seed script for Nari Pehnawa.

Adds two categories (Kurtis, Home Decoration) and 15 products under each,
if they don't already exist. Safe to re-run: it skips categories/products
that are already present (matched by name).

Usage:
    cd server
    venv/bin/python3 seed_data.py
"""

from datetime import datetime

from app.config import mongo_db, mongodb_url
from pymongo import MongoClient

client = MongoClient(mongodb_url)
db = client[mongo_db]
categories_col = db["categories"]
products_col = db["products"]

CATEGORIES = [
    {
        "name": "Kurtis",
        "tagline": "Comfort Meets Everyday Elegance",
        "image": "/gob-kurta-set-1.png",
        "link": "/category/kurtis",
        "border_color": "#8B0000",
        "display_order": 1,
        "is_active": True,
    },
    {
        "name": "Home Decoration",
        "tagline": "Beautify Every Corner Of Your Home",
        "image": "https://picsum.photos/seed/home-decoration-cover/800/600",
        "link": "/category/home-decoration",
        "border_color": "#b8860b",
        "display_order": 2,
        "is_active": True,
    },
]

KURTI_PRODUCTS = [
    ("Cotton Printed Straight Kurti - Blue", 899, 1199, "Cotton"),
    ("Rayon Anarkali Kurti - Maroon", 1299, 1599, "Rayon"),
    ("Chikankari Embroidered Kurti - White", 1799, 2199, "Cotton"),
    ("A-Line Floral Kurti - Yellow", 999, 1299, "Rayon"),
    ("Denim Kurti With Belt - Indigo", 1499, 1899, "Denim"),
    ("Straight Fit Kurti - Mustard", 849, 1099, "Cotton"),
    ("Georgette Party Wear Kurti - Wine", 1999, 2499, "Georgette"),
    ("Printed Kaftan Kurti - Green", 1149, 1399, "Rayon"),
    ("Handblock Print Cotton Kurti - Pink", 999, 1249, "Cotton"),
    ("Embroidered Angrakha Kurti - Black", 1699, 2099, "Rayon"),
    ("High-Low Hem Kurti - Peach", 1099, 1349, "Georgette"),
    ("Bandhani Print Kurti - Orange", 949, 1199, "Cotton"),
    ("Chanderi Silk Kurti - Gold", 2199, 2699, "Chanderi Silk"),
    ("Palazzo Set Kurti - Teal", 1599, 1999, "Rayon"),
    ("Casual Daily Wear Kurti - Grey", 699, 899, "Cotton"),
]

HOME_DECOR_PRODUCTS = [
    ("Handcrafted Ceramic Vase", 799, 999, "Ceramic"),
    ("Wooden Wall Shelf - Set of 2", 1199, 1499, "Sheesham Wood"),
    ("Macrame Wall Hanging", 649, 849, "Cotton Rope"),
    ("Decorative Table Lamp", 1399, 1799, "Metal & Fabric"),
    ("Scented Soy Candle Set - Pack of 3", 549, 699, "Soy Wax"),
    ("Brass Pooja Thali Set", 1099, 1399, "Brass"),
    ("Embroidered Cushion Cover Set - Pack of 5", 899, 1199, "Cotton Blend"),
    ("Wall Mirror With Wooden Frame", 1899, 2399, "Wood & Glass"),
    ("Handwoven Jute Area Rug", 1599, 1999, "Jute"),
    ("Terracotta Wind Chime", 399, 549, "Terracotta"),
    ("Decorative Photo Frame Set - Pack of 4", 749, 949, "Wood"),
    ("Metal Wall Art Sculpture", 2199, 2699, "Wrought Iron"),
    ("Printed Cotton Table Runner", 499, 649, "Cotton"),
    ("Artificial Flower Vase Arrangement", 899, 1149, "Plastic & Ceramic"),
    ("Aromatic Oil Diffuser Set", 1299, 1599, "Glass & Ceramic"),
]


def upsert_category(cat):
    existing = categories_col.find_one({"name": cat["name"]})
    if existing:
        print(f"  Category '{cat['name']}' already exists, skipping.")
        return existing["_id"]
    doc = {**cat, "created_at": datetime.now(), "updated_at": datetime.now()}
    result = categories_col.insert_one(doc)
    print(f"  Created category '{cat['name']}'")
    return result.inserted_id


def seed_products(category_name, items, image_seed_prefix):
    created = 0
    for idx, (name, price, original_price, fabric) in enumerate(items, start=1):
        if products_col.find_one({"name": name}):
            print(f"    Product '{name}' already exists, skipping.")
            continue
        discount = round((1 - price / original_price) * 100)
        doc = {
            "name": name,
            "brand": "Nari Pehnawa",
            "price": price,
            "original_price": original_price,
            "discount": discount,
            "image": f"https://picsum.photos/seed/{image_seed_prefix}-{idx}/600/800",
            "images": [f"https://picsum.photos/seed/{image_seed_prefix}-{idx}/600/800"],
            "category": category_name,
            "sub_category": None,
            "description": f"{name}. Premium quality {fabric.lower()} crafted for everyday comfort and style, brought to you by Nari Pehnawa.",
            "on_sale": idx % 3 == 0,
            "is_new": idx % 4 == 0,
            "in_stock": True,
            "stock_quantity": 100,
            "sizes": ["S", "M", "L", "XL"] if category_name == "Kurtis" else [],
            "colors": [],
            "fabric": fabric,
            "pattern": None,
            "sleeve_type": None,
            "rating": 4.2,
            "review_count": 0,
            "tags": [category_name.lower()],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        products_col.insert_one(doc)
        created += 1
    print(f"  Inserted {created} new products in '{category_name}'")


def main():
    print(f"Seeding database '{mongo_db}' ...")
    print("Categories:")
    for cat in CATEGORIES:
        upsert_category(cat)

    print("Kurtis products:")
    seed_products("Kurtis", KURTI_PRODUCTS, "kurti")

    print("Home Decoration products:")
    seed_products("Home Decoration", HOME_DECOR_PRODUCTS, "home-decor")

    print("Done.")


if __name__ == "__main__":
    main()
