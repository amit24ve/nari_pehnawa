"""
Tops up every existing category to at least 100 products (adding new,
uniquely-named products on top of whatever already exists — nothing is
deleted). Safe to re-run: products are matched/skipped by name.

Combines each category's base product name with a COLOR/DECOR variant AND
a style modifier (15 x 7 = 105 combinations) to comfortably clear the
100-product bar with distinct, readable names.

Images are left as harmless placeholders here — run
`update_images_pexels.py` afterwards to replace every category cover and
product image with a real, category-matched Pexels photo.

Usage:
    cd server
    venv/bin/python3 seed_bulk_products.py
"""

from datetime import datetime

from app.config import mongo_db, mongodb_url
from pymongo import MongoClient

from seed_subcategories import (
    KURTI_CATEGORIES,
    HOME_DECOR_CATEGORIES,
    COLOR_VARIANTS,
    DECOR_VARIANTS,
)

client = MongoClient(mongodb_url)
db = client[mongo_db]
categories_col = db["categories"]
products_col = db["products"]

TARGET_PER_CATEGORY = 100

KURTI_STYLE_MODIFIERS = [
    "Classic",
    "Festive",
    "Casual",
    "Party Wear",
    "Office Wear",
    "Designer",
    "Premium",
]

DECOR_STYLE_MODIFIERS = [
    "Small",
    "Large",
    "Compact",
    "Oversized",
    "Deluxe",
    "Signature",
    "Limited Edition",
]


def seed_extra_products(
    category_name,
    base_name,
    material,
    base_price,
    base_original,
    variants,
    style_modifiers,
    placeholder_keyword,
):
    existing_names = {
        d["name"]
        for d in products_col.find({"category": category_name}, {"name": 1})
    }
    existing_count = len(existing_names)
    docs = []
    idx = 0
    for style in style_modifiers:
        for variant in variants:
            idx += 1
            name = f"{base_name} - {style} {variant}"
            if name in existing_names:
                continue
            price = base_price + (idx % 20) * 15
            original_price = base_original + (idx % 20) * 15
            discount = round((1 - price / original_price) * 100)
            doc = {
                "name": name,
                "brand": "Nari Pehnawa",
                "price": price,
                "original_price": original_price,
                "discount": discount,
                "image": f"https://picsum.photos/seed/{placeholder_keyword}-{idx}/600/800",
                "images": [
                    f"https://picsum.photos/seed/{placeholder_keyword}-{idx}/600/800"
                ],
                "category": category_name,
                "sub_category": None,
                "description": f"{name}. Premium quality {material.lower()} piece, thoughtfully crafted by Nari Pehnawa.",
                "on_sale": idx % 3 == 0,
                "is_new": idx % 4 == 0,
                "in_stock": True,
                "stock_quantity": 100,
                "sizes": ["S", "M", "L", "XL"] if "Kurti" in base_name else [],
                "colors": [],
                "fabric": material,
                "pattern": None,
                "sleeve_type": None,
                "rating": 4.2,
                "review_count": 0,
                "tags": [category_name.lower()],
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            docs.append(doc)

    created = len(docs)
    if docs:
        products_col.insert_many(docs)
    total = existing_count + created
    print(
        f"  {category_name:30s} had {existing_count:3d}, added {created:3d} new, total now {total:3d}"
    )


def main():
    print(f"Bulk-seeding database '{mongo_db}' to {TARGET_PER_CATEGORY}+ products/category ...")

    print("Kurti categories:")
    for (
        name,
        _tagline,
        _slug,
        _color,
        keyword,
        base_name,
        fabric,
        price,
        orig,
    ) in KURTI_CATEGORIES:
        if not categories_col.find_one({"name": name}):
            print(f"  Category '{name}' not found, skipping.")
            continue
        seed_extra_products(
            name,
            base_name,
            fabric,
            price,
            orig,
            COLOR_VARIANTS,
            KURTI_STYLE_MODIFIERS,
            keyword.replace(",", "-"),
        )

    print("Home Decoration categories:")
    for (
        name,
        _tagline,
        _slug,
        _color,
        keyword,
        base_name,
        material,
        price,
        orig,
    ) in HOME_DECOR_CATEGORIES:
        if not categories_col.find_one({"name": name}):
            print(f"  Category '{name}' not found, skipping.")
            continue
        seed_extra_products(
            name,
            base_name,
            material,
            price,
            orig,
            DECOR_VARIANTS,
            DECOR_STYLE_MODIFIERS,
            keyword.replace(",", "-"),
        )

    print("Done.")


if __name__ == "__main__":
    main()
