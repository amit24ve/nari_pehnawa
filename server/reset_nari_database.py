import sys
from app.database import get_database

def run_reset():
    db = get_database()
    
    # Extra safety check: verify db name is strictly NariPehnawa
    if db.name != "NariPehnawa":
        print(f"CRITICAL ABORT: Connected to '{db.name}', expected 'NariPehnawa'!")
        sys.exit(1)
        
    print(f"=== Safely Cleaning Nari Pehnawa Database: {db.name} ===")
    
    collections_to_wipe = [
        "products",
        "orders",
        "order_logs",
        "payments",
        "payment_logs",
        "refunds",
        "returns",
        "exchanges",
        "cancellations",
        "carts",
        "wishlist",
        "reviews",
        "customer_inquiries",
        "inventory_logs",
        "shipping_events",
        "coin_transactions",
        "addresses",
        "otps",
        "notifications",
        "clicks",
        "pageviews",
        "sessions",
        "visitors",
        "visits",
        "scrolls",
        "events",
        "conversions",
        "ai_insights",
        "mobile_google_flows"
    ]
    
    cleaned_total = 0
    for coll_name in collections_to_wipe:
        if coll_name in db.list_collection_names():
            res = db[coll_name].delete_many({})
            cleaned_total += res.deleted_count
            print(f"  ✓ Cleaned {coll_name:22}: {res.deleted_count} documents removed (Now: 0)")
        else:
            print(f"  - Skipped {coll_name:22}: collection does not exist")
            
    # Clean non-admin users, keeping admin@naripehnawa.com
    admin_count_before = db["users"].count_documents({"role": "admin"})
    user_res = db["users"].delete_many({"role": {"$ne": "admin"}})
    admin_count_after = db["users"].count_documents({"role": "admin"})
    print(f"  ✓ Cleaned non-admin users  : {user_res.deleted_count} customers removed")
    print(f"  ✓ Preserved Admin accounts : {admin_count_after} admin user(s) active")
    
    print("\n=== Preserved Configurations & Assets ===")
    for preserved in ["categories", "hero_slides", "watch_buy_reels", "celeb_approved_looks", "brands", "forms", "flash_sales"]:
        if preserved in db.list_collection_names():
            cnt = db[preserved].count_documents({})
            print(f"  • {preserved:22}: {cnt} items preserved")
            
    print(f"\n🎉 Database successfully reset and cleaned! Ready for fresh product & catalog addition.")

if __name__ == "__main__":
    run_reset()
