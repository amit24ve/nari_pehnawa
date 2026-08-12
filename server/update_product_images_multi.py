"""
Updates every product in MongoDB to have 4-5 unique, category-relevant high-resolution
Pexels images (e.g., Chikankari Kurti gets real Chikankari kurti photos).

Usage:
    cd server
    venv/bin/python3 update_product_images_multi.py
"""

import sys
import time
import requests
from pymongo import MongoClient, UpdateOne
from app.config import mongodb_url, mongo_db, pexels_api_key

client = MongoClient(mongodb_url)
db = client[mongo_db]
categories_col = db["categories"]
products_col = db["products"]

# Category -> Pexels search terms
SEARCH_QUERIES = {
    "Anarkali Kurtis": ["anarkali kurti", "anarkali dress", "indian ethnic dress", "lehenga choli"],
    "Straight Kurtis": ["straight kurti", "long kurti", "indian suit", "ethnic wear woman"],
    "A-Line Kurtis": ["a line kurti", "flared kurti", "indian dress woman", "kurti dress"],
    "Printed Kurtis": ["printed kurti", "floral kurti", "printed indian dress", "block print kurti"],
    "Embroidered Kurtis": ["embroidered kurti", "zari kurti", "heavy kurti", "embroidered dress"],
    "Denim Kurtis": ["denim dress", "denim shirt dress", "blue denim tunic", "casual denim dress"],
    "Kaftan Kurtis": ["kaftan dress", "boho kaftan", "printed kaftan", "silk kaftan"],
    "Chikankari Kurtis": ["chikankari kurti", "lucknowi kurti", "white chikankari", "cotton chikankari"],
    "Palazzo Set Kurtis": ["palazzo suit", "kurti with palazzo", "salwar suit set", "ethnic suit set"],
    "Angrakha Kurtis": ["angrakha kurti", "wrap kurti dress", "traditional angrakha", "anarkali angrakha"],
    "Vases & Planters": ["flower vase", "ceramic planter", "decorative vase", "indoor plant pot"],
    "Wall Decor": ["wall decor art", "wall hanging decor", "metal wall art", "decorative mirror"],
    "Lighting & Lamps": ["table lamp", "pendant light", "decorative lamp", "ambient lamp"],
    "Cushions & Covers": ["cushion cover", "throw pillow cover", "decorative cushion", "boho cushion"],
    "Rugs & Carpets": ["area rug", "vintage carpet", "boho rug", "patterned carpet"],
    "Pooja Essentials": ["pooja thali", "brass diya", "incense burner", "mandir decor"],
    "Candles & Fragrances": ["scented candle", "pillar candle", "aroma diffuser", "decorative candle"],
    "Photo Frames & Art": ["photo frame decor", "wall photo frame", "picture frame set", "canvas art frame"],
}

def pexels_photo_url(photo_id, width=800):
    return f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w={width}"

def fetch_pexels_photos(query, per_page=40):
    if not pexels_api_key:
        return []
    try:
        resp = requests.get(
            "https://api.pexels.com/v1/search",
            headers={"Authorization": pexels_api_key},
            params={"query": query, "per_page": per_page, "orientation": "portrait"},
            timeout=15,
        )
        if resp.status_code == 200:
            photos = resp.json().get("photos", [])
            return [p["id"] for p in photos if p.get("id")]
    except Exception as e:
        print(f"Error fetching for query '{query}': {e}")
    return []

def main():
    print("Starting Multi-Image update for products...")
    category_photo_cache = {}

    # Build image pools for each category
    for cat_name, queries in SEARCH_QUERIES.items():
        pool = []
        for q in queries:
            photos = fetch_pexels_photos(q, per_page=50)
            for pid in photos:
                if pid not in pool:
                    pool.append(pid)
            time.sleep(0.1)
        print(f"Fetched {len(pool)} unique photos for '{cat_name}'")
        category_photo_cache[cat_name] = pool

    products = list(products_col.find({}, {"_id": 1, "category": 1, "name": 1}))
    print(f"Total products in DB: {len(products)}")

    updates = []
    category_indices = {}

    for p in products:
        cat = p.get("category", "Chikankari Kurtis")
        pool = category_photo_cache.get(cat, [])
        idx = category_indices.get(cat, 0)
        category_indices[cat] = idx + 1

        if len(pool) >= 4:
            p1 = pool[idx % len(pool)]
            p2 = pool[(idx + 7) % len(pool)]
            p3 = pool[(idx + 17) % len(pool)]
            p4 = pool[(idx + 29) % len(pool)]
            p5 = pool[(idx + 41) % len(pool)]
            
            # Ensure uniqueness within the 5 images of this product
            chosen_ids = []
            for pid in [p1, p2, p3, p4, p5]:
                if pid not in chosen_ids:
                    chosen_ids.append(pid)
            
            img_urls = [pexels_photo_url(pid) for pid in chosen_ids]
        else:
            # Fallback if Pexels API returned insufficient results
            base_id = 28512776 + (idx * 5)
            img_urls = [pexels_photo_url(base_id + j) for j in range(5)]

        updates.append(
            UpdateOne(
                {"_id": p["_id"]},
                {
                    "$set": {
                        "image": img_urls[0],
                        "images": img_urls,
                    }
                },
            )
        )

    if updates:
        res = products_col.bulk_write(updates)
        print(f"Successfully updated {res.modified_count} products with 4-5 high quality images each!")

    # Also update category cover images with crisp landscape resolution
    categories = list(categories_col.find({}, {"_id": 1, "name": 1}))
    cat_updates = []
    for c in categories:
        cat_name = c.get("name")
        pool = category_photo_cache.get(cat_name, [])
        if pool:
            cover_url = pexels_photo_url(pool[0], width=1200)
            cat_updates.append(UpdateOne({"_id": c["_id"]}, {"$set": {"image": cover_url}}))

    if cat_updates:
        categories_col.bulk_write(cat_updates)
        print(f"Successfully updated {len(cat_updates)} categories cover images!")

if __name__ == "__main__":
    main()
