"""
Replaces the two broad categories ("Kurtis", "Home Decoration") with granular,
product-type categories:

  - 10 Kurti-style categories (Anarkali, Straight, A-Line, Printed, ...)
  - 8 Home Decoration-style categories (Vases, Wall Decor, Lighting, ...)

Each category gets 15 products. All images come from loremflickr.com,
picked by keyword so they actually resemble the product (e.g. "kurti,fashion"
for kurtis, "vase,ceramic" for vases) — no local files are touched.

Safe to re-run: matching categories/products (by name) are skipped, not
duplicated. Run with --reset to first delete the old broad "Kurtis" /
"Home Decoration" categories and their products.

Usage:
    cd server
    venv/bin/python3 seed_subcategories.py --reset
"""

import sys
from datetime import datetime

from app.config import mongo_db, mongodb_url
from pymongo import MongoClient

client = MongoClient(mongodb_url)
db = client[mongo_db]
categories_col = db["categories"]
products_col = db["products"]

OLD_BROAD_CATEGORIES = ["Kurtis", "Home Decoration"]

COLOR_VARIANTS = [
    "Red",
    "Maroon",
    "Navy Blue",
    "Mustard Yellow",
    "Emerald Green",
    "Blush Pink",
    "Ivory White",
    "Charcoal Grey",
    "Coral Orange",
    "Royal Blue",
    "Lavender Purple",
    "Peach",
    "Turquoise",
    "Olive Green",
    "Black",
]

DECOR_VARIANTS = [
    "Textured",
    "Hand-Painted",
    "Matte Finish",
    "Glossy",
    "Rustic",
    "Modern",
    "Ribbed",
    "Classic",
    "Minimalist",
    "Antique",
    "Embossed",
    "Engraved",
    "Polished",
    "Speckled",
    "Natural Finish",
]

# name, tagline, link slug, border_color, display_order, image keyword, base product name, fabric, base price, base original price
KURTI_CATEGORIES = [
    (
        "Anarkali Kurtis",
        "Timeless Anarkali Silhouettes",
        "anarkali-kurtis",
        "#8B0000",
        "anarkali,dress",
        "Anarkali Kurti",
        "Georgette",
        1499,
        1899,
    ),
    (
        "Straight Kurtis",
        "Everyday Comfort, Effortless Style",
        "straight-kurtis",
        "#a52a2a",
        "kurti,fashion",
        "Straight Kurti",
        "Cotton",
        799,
        999,
    ),
    (
        "A-Line Kurtis",
        "Flattering Fits For Every Body",
        "aline-kurtis",
        "#8B0000",
        "kurti,indianwear",
        "A-Line Kurti",
        "Rayon",
        899,
        1149,
    ),
    (
        "Printed Kurtis",
        "Vibrant Prints For Every Mood",
        "printed-kurtis",
        "#a52a2a",
        "printedkurti,pattern",
        "Printed Kurti",
        "Cotton",
        849,
        1099,
    ),
    (
        "Embroidered Kurtis",
        "Intricate Threadwork, Elegant Charm",
        "embroidered-kurtis",
        "#8B0000",
        "embroidery,ethnicwear",
        "Embroidered Kurti",
        "Rayon",
        1699,
        2099,
    ),
    (
        "Denim Kurtis",
        "Fusion Style For The Modern Woman",
        "denim-kurtis",
        "#4a4a4a",
        "denim,kurti",
        "Denim Kurti",
        "Denim",
        1399,
        1799,
    ),
    (
        "Kaftan Kurtis",
        "Relaxed Silhouettes, Boho Vibes",
        "kaftan-kurtis",
        "#a52a2a",
        "kaftan,boho",
        "Kaftan Kurti",
        "Rayon",
        1199,
        1499,
    ),
    (
        "Chikankari Kurtis",
        "Lucknowi Craftsmanship At Its Finest",
        "chikankari-kurtis",
        "#8B0000",
        "chikankari,whitedress",
        "Chikankari Kurti",
        "Cotton",
        1799,
        2199,
    ),
    (
        "Palazzo Set Kurtis",
        "Complete Sets For Effortless Dressing",
        "palazzo-set-kurtis",
        "#a52a2a",
        "palazzo,indianoutfit",
        "Palazzo Set Kurti",
        "Rayon",
        1599,
        1999,
    ),
    (
        "Angrakha Kurtis",
        "Traditional Wrap Style Elegance",
        "angrakha-kurtis",
        "#8B0000",
        "angrakha,ethnic",
        "Angrakha Kurti",
        "Cotton Silk",
        1699,
        2099,
    ),
]

# name, tagline, link slug, border_color, display_order offset, image keyword, base product name, material, base price, base original price
HOME_DECOR_CATEGORIES = [
    (
        "Vases & Planters",
        "Bring Nature Indoors",
        "vases-planters",
        "#b8860b",
        "vase,ceramic",
        "Ceramic Vase",
        "Ceramic",
        649,
        849,
    ),
    (
        "Wall Decor",
        "Transform Blank Walls Into Art",
        "wall-decor",
        "#8B6914",
        "walldecor,interior",
        "Wall Hanging",
        "Wood & Metal",
        899,
        1149,
    ),
    (
        "Lighting & Lamps",
        "Warm Glow For Every Room",
        "lighting-lamps",
        "#b8860b",
        "lamp,lighting",
        "Table Lamp",
        "Metal & Fabric",
        1199,
        1549,
    ),
    (
        "Cushions & Covers",
        "Cozy Up Your Living Space",
        "cushions-covers",
        "#8B6914",
        "cushion,sofa",
        "Cushion Cover Set",
        "Cotton Blend",
        549,
        699,
    ),
    (
        "Rugs & Carpets",
        "Soft Foundations For Your Home",
        "rugs-carpets",
        "#b8860b",
        "rug,carpet",
        "Area Rug",
        "Jute & Cotton",
        1499,
        1899,
    ),
    (
        "Pooja Essentials",
        "Sacred Corners, Beautifully Crafted",
        "pooja-essentials",
        "#8B6914",
        "brass,pooja",
        "Pooja Thali Set",
        "Brass",
        999,
        1299,
    ),
    (
        "Candles & Fragrances",
        "Set The Mood With Ambient Scents",
        "candles-fragrances",
        "#b8860b",
        "candle,homefragrance",
        "Scented Candle Set",
        "Soy Wax",
        449,
        599,
    ),
    (
        "Photo Frames & Wall Art",
        "Cherish Memories, Beautifully Framed",
        "photo-frames-wall-art",
        "#8B6914",
        "photoframe,wallart",
        "Photo Frame Set",
        "Wood",
        699,
        899,
    ),
]


def reset_old_categories():
    for name in OLD_BROAD_CATEGORIES:
        cat_result = categories_col.delete_one({"name": name})
        prod_result = products_col.delete_many({"category": name})
        print(
            f"Removed category '{name}' ({cat_result.deleted_count}) and {prod_result.deleted_count} of its products"
        )


def upsert_category(
    name, tagline, slug, border_color, display_order, image_keyword, lock
):
    existing = categories_col.find_one({"name": name})
    if existing:
        print(f"  Category '{name}' already exists, skipping.")
        return
    doc = {
        "name": name,
        "tagline": tagline,
        "image": f"https://loremflickr.com/800/600/{image_keyword}?lock={lock}",
        "link": f"/category/{slug}",
        "border_color": border_color,
        "display_order": display_order,
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    categories_col.insert_one(doc)
    print(f"  Created category '{name}'")


def seed_products(
    category_name,
    base_name,
    material,
    base_price,
    base_original,
    image_keyword,
    variants,
    lock_start,
):
    created = 0
    for idx, variant in enumerate(variants, start=1):
        name = f"{base_name} - {variant}"
        if products_col.find_one({"name": name}):
            print(f"    Product '{name}' already exists, skipping.")
            continue
        price = base_price + (idx - 1) * 20
        original_price = base_original + (idx - 1) * 20
        discount = round((1 - price / original_price) * 100)
        lock = lock_start + idx
        image_url = f"https://loremflickr.com/600/800/{image_keyword}?lock={lock}"
        doc = {
            "name": name,
            "brand": "Nari Pehnawa",
            "price": price,
            "original_price": original_price,
            "discount": discount,
            "image": image_url,
            "images": [image_url],
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
        products_col.insert_one(doc)
        created += 1
    print(f"  Inserted {created} new products in '{category_name}'")


def main():
    if "--reset" in sys.argv:
        print("Removing old broad categories...")
        reset_old_categories()

    print(f"Seeding database '{mongo_db}' ...")

    print("Kurti categories:")
    lock_base = 1000
    for i, (
        name,
        tagline,
        slug,
        color,
        keyword,
        base_name,
        fabric,
        price,
        orig,
    ) in enumerate(KURTI_CATEGORIES):
        display_order = i + 1
        upsert_category(
            name, tagline, slug, color, display_order, keyword, lock_base + i
        )
        seed_products(
            name,
            base_name,
            fabric,
            price,
            orig,
            keyword,
            COLOR_VARIANTS,
            lock_base + i * 100,
        )

    print("Home Decoration categories:")
    lock_base2 = 5000
    for i, (
        name,
        tagline,
        slug,
        color,
        keyword,
        base_name,
        material,
        price,
        orig,
    ) in enumerate(HOME_DECOR_CATEGORIES):
        display_order = len(KURTI_CATEGORIES) + i + 1
        upsert_category(
            name, tagline, slug, color, display_order, keyword, lock_base2 + i
        )
        seed_products(
            name,
            base_name,
            material,
            price,
            orig,
            keyword,
            DECOR_VARIANTS,
            lock_base2 + i * 100,
        )

    print("Done.")


if __name__ == "__main__":
    main()
