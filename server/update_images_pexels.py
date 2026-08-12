"""
Updates every category's cover image and every product's image using
Pexels (https://pexels.com) search results, matched to that specific
category — e.g. "Chikankari Kurtis" pulls real chikankari-kurti photos,
"Pooja Essentials" pulls real pooja-thali photos, etc.

Guarantees every image across the whole catalog is unique (tracks used
Pexels photo IDs globally and skips repeats, paging further into the
search results if needed). If a category's specific query runs out of
fresh results, a broader, still-relevant fallback query tops up the rest
(e.g. "kurti" for any Kurti category, "home decor" for any Home
Decoration category) so every product still gets a real, on-theme photo.

Requires PEXELS_API_KEY to be set in server/app/.env (get a free key at
https://www.pexels.com/api/).

Usage:
    cd server
    venv/bin/python3 update_images_pexels.py
"""

import sys
import time

import requests
from app.config import mongo_db, mongodb_url, pexels_api_key
from pymongo import MongoClient, UpdateOne

if not pexels_api_key:
    print("ERROR: PEXELS_API_KEY is not set in server/app/.env")
    sys.exit(1)

client = MongoClient(mongodb_url)
db = client[mongo_db]
categories_col = db["categories"]
products_col = db["products"]

HEADERS = {"Authorization": pexels_api_key}

# category name -> Pexels search query
SEARCH_QUERIES = {
    "Anarkali Kurtis": "anarkali kurti",
    "Straight Kurtis": "straight kurti",
    "A-Line Kurtis": "a line kurti dress",
    "Printed Kurtis": "printed kurti",
    "Embroidered Kurtis": "embroidered kurti",
    "Denim Kurtis": "denim kurti dress",
    "Kaftan Kurtis": "kaftan dress",
    "Chikankari Kurtis": "chikankari kurti",
    "Palazzo Set Kurtis": "palazzo suit set",
    "Angrakha Kurtis": "angrakha kurti",
    "Vases & Planters": "flower vase",
    "Wall Decor": "wall decor art",
    "Lighting & Lamps": "table lamp",
    "Cushions & Covers": "cushion cover",
    "Rugs & Carpets": "area rug",
    "Pooja Essentials": "pooja thali",
    "Candles & Fragrances": "scented candle",
    "Photo Frames & Wall Art": "photo frame",
}

# Broader, still-relevant fallback queries used to top up a category once
# its specific query is exhausted of fresh (unused) results.
KURTI_FALLBACKS = ["kurti", "indian dress woman", "ethnic wear woman", "salwar suit"]
DECOR_FALLBACKS = ["home decor", "interior decor", "living room decor"]


def fallback_queries_for(category_name):
    if "Kurtis" in category_name:
        return KURTI_FALLBACKS
    return DECOR_FALLBACKS


used_ids = set()


def fetch_unique_photos_from_query(query, needed, max_pages=10, per_page=80):
    """Fetch up to `needed` photos for `query` not already in used_ids."""
    collected = []
    for page in range(1, max_pages + 1):
        resp = requests.get(
            "https://api.pexels.com/v1/search",
            headers=HEADERS,
            params={"query": query, "per_page": per_page, "page": page},
            timeout=20,
        )
        resp.raise_for_status()
        photos = resp.json().get("photos", [])
        if not photos:
            break
        for photo in photos:
            if photo["id"] in used_ids:
                continue
            collected.append(photo)
            if len(collected) >= needed:
                return collected
        time.sleep(0.15)
    return collected


def fetch_unique_photos(category_name, primary_query, needed):
    """Try the category's specific query first, then fall back to
    broader related queries until `needed` unique photos are collected."""
    collected = fetch_unique_photos_from_query(primary_query, needed)
    for photo in collected:
        used_ids.add(photo["id"])

    if len(collected) < needed:
        for fallback in fallback_queries_for(category_name):
            still_needed = needed - len(collected)
            if still_needed <= 0:
                break
            more = fetch_unique_photos_from_query(fallback, still_needed)
            for photo in more:
                used_ids.add(photo["id"])
            collected.extend(more)

    return collected


def main():
    for category_name, query in SEARCH_QUERIES.items():
        category = categories_col.find_one({"name": category_name})
        if not category:
            print(f"Category '{category_name}' not found in DB, skipping.")
            continue

        products = list(
            products_col.find({"category": category_name}, {"_id": 1}).sort("_id", 1)
        )
        needed = 1 + len(products)  # 1 cover image + 1 per product
        photos = fetch_unique_photos(category_name, query, needed)

        if not photos:
            print(f"No photos found for '{category_name}' ({query}), skipping.")
            continue
        if len(photos) < needed:
            print(
                f"NOTE: only found {len(photos)} unique photos for '{query}' (wanted {needed})"
            )

        # Category cover image = first result
        cover_url = photos[0]["src"]["landscape"]
        categories_col.update_one(
            {"_id": category["_id"]}, {"$set": {"image": cover_url}}
        )

        # Remaining results feed the products, one each
        product_photos = photos[1:] if len(photos) > 1 else photos
        ops = []
        for i, product in enumerate(products):
            if i >= len(product_photos):
                break
            image_url = product_photos[i]["src"]["portrait"]
            ops.append(
                UpdateOne(
                    {"_id": product["_id"]},
                    {"$set": {"image": image_url, "images": [image_url]}},
                )
            )

        if ops:
            products_col.bulk_write(ops, ordered=False)

        print(
            f"{category_name:30s} query={query!r:30s} cover + {len(ops)} products updated"
        )

    print("Done.")


if __name__ == "__main__":
    main()
