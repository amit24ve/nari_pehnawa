import os
import sys

sys.path.insert(0, '/www/wwwroot/nari_pehnawa/server')
from app.database import get_database

def migrate():
    db = get_database()
    products_col = db["products"]
    products = list(products_col.find({}))
    print(f"Total products in database: {len(products)}")

    updated = 0
    for p in products:
        p_id = p["_id"]
        p_id_str = str(p_id)
        
        meta_id = p.get("meta_catalog_id")
        sku = p.get("sku")
        
        target_meta_id = str(meta_id or sku or p_id_str).strip()
        target_sku = str(sku or target_meta_id).strip()
        
        print(f"Processing product: {p.get('name', 'Unnamed')} (ID: {p_id_str})")
        print(f"  Current meta_catalog_id: {meta_id}, sku: {sku}")
        print(f"  Setting meta_catalog_id: {target_meta_id}, sku: {target_sku}")
        
        products_col.update_one(
            {"_id": p_id},
            {"$set": {
                "meta_catalog_id": target_meta_id,
                "sku": target_sku
            }}
        )
        updated += 1

    print(f"\nSuccessfully verified and updated {updated} existing products in MongoDB.")

    # Re-fetch and display
    for p in products_col.find({}):
        print(f"Verified -> ID: {p['_id']} | meta_catalog_id: {p.get('meta_catalog_id')} | sku: {p.get('sku')} | Name: {p.get('name')}")

if __name__ == "__main__":
    migrate()
