from pymongo import MongoClient
from app.config import mongodb_url, mongo_db


def initialize_database():
    """Initialize database with collections and seed data"""
    client = MongoClient(mongodb_url)
    db = client[mongo_db]
    
    print("Initializing database...")
    
    # Create collections if they don't exist
    collections = db.list_collection_names()
    
    required_collections = [
        "users",
        "products",
        "categories",
        "orders",
        "carts",
        "reviews"
    ]
    
    for collection_name in required_collections:
        if collection_name not in collections:
            db.create_collection(collection_name)
            print(f"Created collection: {collection_name}")
    
    # Create indexes
    db.products.create_index("category")
    db.products.create_index("price")
    db.products.create_index("on_sale")
    db.products.create_index("is_new")
    db.products.create_index([("name", "text"), ("description", "text")])
    
    db.categories.create_index("name", unique=True)
    db.categories.create_index("display_order")
    
    db.orders.create_index("user_id")
    db.orders.create_index("order_number", unique=True)
    db.orders.create_index("status")
    db.orders.create_index("created_at")
    
    db.carts.create_index("user_id", unique=True)
    
    db.reviews.create_index("product_id")
    db.reviews.create_index("user_id")
    db.reviews.create_index("rating")
    
    db.users.create_index("email", unique=True)
    
    print("Indexes created successfully")
    
    # Seed initial data
    seed_categories(db)
    seed_products(db)
    seed_test_data(db)
    
    client.close()
    print("Database initialization complete!")


def seed_categories(db):
    """Seed initial categories"""
    categories_count = db.categories.count_documents({})
    
    if categories_count == 0:
        categories = [
            {
                "name": "ELEGANT ANARKALI",
                "tagline": "Anarkalis Made For Forever Moments!",
                "image": "/category_card_1.jpg",
                "link": "/category/anarkali",
                "border_color": "#dc2626",
                "display_order": 1,
                "is_active": True
            },
            {
                "name": "CHIC CO-ORDS",
                "tagline": "Made To Match Your Wedding Mood!",
                "image": "/category_card_2.jpg",
                "link": "/category/co-ords",
                "border_color": "#db2777",
                "display_order": 2,
                "is_active": True
            },
            {
                "name": "TRAVEL-READY DRESSES",
                "tagline": "Glam That Moves With You!",
                "image": "/category_card_3.jpg",
                "link": "/category/dresses",
                "border_color": "#dc2626",
                "display_order": 3,
                "is_active": True
            },
            {
                "name": "INDOWESTERN",
                "tagline": "All Set For The Shaadi Season!",
                "image": "/category_card_4.jpg",
                "link": "/category/indowestern",
                "border_color": "#db2777",
                "display_order": 4,
                "is_active": True
            },
            {
                "name": "KURTA & SUIT SETS",
                "tagline": "Crafted For Timeless Celebrations!",
                "image": "/category_card_5.jpg",
                "link": "/category/suit-sets",
                "border_color": "#dc2626",
                "display_order": 5,
                "is_active": True
            }
        ]
        
        db.categories.insert_many(categories)
        print(f"Seeded {len(categories)} categories")


def seed_products(db):
    """Seed initial products"""
    products_count = db.products.count_documents({})
    
    if products_count == 0:
        products = [
            {
                "name": "Blush Glow Anarkali Kurta Set",
                "brand": "Bunaai",
                "price": 4000,
                "original_price": 4500,
                "discount": 11,
                "image": "/product_anarkali_1.png",
                "images": ["/product_anarkali_1.png"],
                "category": "Anarkali",
                "description": "Beautiful anarkali kurta set perfect for festive occasions",
                "on_sale": True,
                "is_new": True,
                "in_stock": True,
                "stock_quantity": 50,
                "sizes": ["S", "M", "L", "XL"],
                "colors": ["Blush Pink"],
                "fabric": "Georgette",
                "pattern": "Anarkali",
                "sleeve_type": "3/4 Sleeves",
                "rating": 4.5,
                "review_count": 12,
                "tags": ["festive", "anarkali", "ethnic"]
            },
            {
                "name": "Royal Blue Silk Saree",
                "brand": "Bunaai",
                "price": 5999,
                "original_price": 11999,
                "discount": 50,
                "image": "/product_saree_1.png",
                "images": ["/product_saree_1.png"],
                "category": "Sarees",
                "description": "Elegant silk saree with traditional design",
                "on_sale": False,
                "is_new": True,
                "in_stock": True,
                "stock_quantity": 30,
                "sizes": ["One Size"],
                "colors": ["Royal Blue"],
                "fabric": "Silk",
                "pattern": "Traditional",
                "rating": 4.7,
                "review_count": 25,
                "tags": ["silk", "saree", "traditional"]
            },
            {
                "name": "Floral Embroidered Kurta Set",
                "brand": "Bunaai",
                "price": 3500,
                "original_price": 7000,
                "discount": 50,
                "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop",
                "images": ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop"],
                "category": "Kurta Sets",
                "description": "Comfortable kurta set with beautiful floral embroidery",
                "on_sale": True,
                "is_new": False,
                "in_stock": True,
                "stock_quantity": 40,
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "colors": ["White", "Pink"],
                "fabric": "Cotton",
                "pattern": "Floral",
                "sleeve_type": "Full Sleeves",
                "rating": 4.3,
                "review_count": 18,
                "tags": ["kurta", "embroidered", "casual"]
            }
        ]
        
        # Generate more products
        for i in range(3, 33):
            categories = ["Anarkali", "Kurta Sets", "Sarees", "Lehengas", "Dresses"]
            category = categories[i % len(categories)]
            
            products.append({
                "name": f"{['Elegant', 'Beautiful', 'Designer', 'Premium', 'Festive'][i % 5]} {category} {i}",
                "brand": "Bunaai",
                "price": 3000 + (i * 100),
                "original_price": 6000 + (i * 200),
                "discount": 50,
                "image": f"https://images.unsplash.com/photo-{['1610030469983-98e550d6193c', '1583391733956-6c78276477e2', '1617627143750-d86bc21e42bb', '1595777457583-95e059d581b8'][i % 4]}?w=400&h=600&fit=crop",
                "images": [f"https://images.unsplash.com/photo-{['1610030469983-98e550d6193c', '1583391733956-6c78276477e2', '1617627143750-d86bc21e42bb', '1595777457583-95e059d581b8'][i % 4]}?w=400&h=600&fit=crop"],
                "category": category,
                "description": f"Premium quality {category.lower()} for special occasions",
                "on_sale": i % 3 == 0,
                "is_new": i % 2 == 0,
                "in_stock": True,
                "stock_quantity": 20 + (i * 2),
                "sizes": ["S", "M", "L", "XL"],
                "colors": [["Red", "Blue"][i % 2]],
                "fabric": ["Cotton", "Silk", "Georgette", "Chiffon"][i % 4],
                "pattern": ["Floral", "Solid", "Embroidered", "Printed"][i % 4],
                "sleeve_type": ["Full Sleeves", "3/4 Sleeves", "Half Sleeves"][i % 3],
                "rating": 4.0 + (i % 10) / 10,
                "review_count": i % 20,
                "tags": ["ethnic", "traditional", "festive"]
            })
        
        db.products.insert_many(products)
        print(f"Seeded {len(products)} products")


def seed_test_data(db):
    """Seed test data for orders, carts, reviews, and users"""
    
    # Seed test users
    users_count = db.users.count_documents({})
    if users_count == 0:
        test_users = [
            {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+91 9876543210",
                "address": "123 Main St, Mumbai, Maharashtra, 400001"
            },
            {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+91 9876543211",
                "address": "456 Park Ave, Delhi, 110001"
            },
            {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+91 9876543212",
                "address": "789 Test Lane, Bangalore, Karnataka, 560001"
            }
        ]
        result = db.users.insert_many(test_users)
        user_ids = [str(id) for id in result.inserted_ids]
        print(f"Seeded {len(test_users)} test users")
    else:
        # Get existing user IDs
        users = list(db.users.find().limit(3))
        user_ids = [str(user["_id"]) for user in users]
    
    # Get some product IDs for testing
    products = list(db.products.find().limit(5))
    product_ids = [str(p["_id"]) for p in products]
    
    if len(product_ids) > 0 and len(user_ids) > 0:
        # Seed test cart
        carts_count = db.carts.count_documents({})
        if carts_count == 0:
            test_cart = {
                "user_id": user_ids[0],
                "items": [
                    {
                        "product_id": product_ids[0],
                        "quantity": 2,
                        "size": "M",
                        "color": "Red",
                        "price": 4000,
                        "added_at": "2024-12-12T10:00:00"
                    },
                    {
                        "product_id": product_ids[1],
                        "quantity": 1,
                        "size": "L",
                        "color": "Blue",
                        "price": 3500,
                        "added_at": "2024-12-12T10:05:00"
                    }
                ],
                "total_amount": 11500,
                "total_items": 3
            }
            db.carts.insert_one(test_cart)
            print("Seeded 1 test cart")
        
        # Seed test reviews
        reviews_count = db.reviews.count_documents({})
        if reviews_count == 0:
            test_reviews = [
                {
                    "product_id": product_ids[0],
                    "user_id": user_ids[0],
                    "user_name": "John Doe",
                    "rating": 4.5,
                    "title": "Excellent Quality!",
                    "comment": "Beautiful anarkali suit, the fabric is amazing and the fit is perfect. Highly recommend!",
                    "verified_purchase": True,
                    "size_purchased": "M",
                    "color_purchased": "Red",
                    "helpful_count": 5
                },
                {
                    "product_id": product_ids[0],
                    "user_id": user_ids[1],
                    "user_name": "Jane Smith",
                    "rating": 5.0,
                    "title": "Love it!",
                    "comment": "Absolutely gorgeous! Got so many compliments at the wedding.",
                    "verified_purchase": True,
                    "size_purchased": "L",
                    "color_purchased": "Pink",
                    "helpful_count": 3
                },
                {
                    "product_id": product_ids[1],
                    "user_id": user_ids[0],
                    "user_name": "John Doe",
                    "rating": 4.0,
                    "title": "Good product",
                    "comment": "Nice kurta set, comfortable to wear. Good value for money.",
                    "verified_purchase": True,
                    "size_purchased": "M",
                    "helpful_count": 2
                }
            ]
            db.reviews.insert_many(test_reviews)
            print(f"Seeded {len(test_reviews)} test reviews")
        
        # Seed test orders
        orders_count = db.orders.count_documents({})
        if orders_count == 0:
            test_orders = [
                {
                    "user_id": user_ids[0],
                    "order_number": "ORD-20241212-ABC123",
                    "items": [
                        {
                            "product_id": product_ids[0],
                            "product_name": products[0]["name"],
                            "product_image": products[0]["image"],
                            "quantity": 1,
                            "size": "M",
                            "color": "Red",
                            "price": 4000,
                            "total": 4000
                        }
                    ],
                    "shipping_address": {
                        "full_name": "John Doe",
                        "phone": "+91 9876543210",
                        "address_line1": "123 Main Street",
                        "address_line2": "Apt 4B",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "postal_code": "400001",
                        "country": "India"
                    },
                    "subtotal": 4000,
                    "discount": 200,
                    "shipping_cost": 0,
                    "tax": 0,
                    "total_amount": 3800,
                    "payment_method": "COD",
                    "status": "confirmed",
                    "payment_status": "pending",
                    "created_at": "2024-12-10T10:00:00",
                    "updated_at": "2024-12-10T10:00:00"
                },
                {
                    "user_id": user_ids[1],
                    "order_number": "ORD-20241211-XYZ456",
                    "items": [
                        {
                            "product_id": product_ids[1],
                            "product_name": products[1]["name"],
                            "product_image": products[1]["image"],
                            "quantity": 2,
                            "size": "L",
                            "color": "Blue",
                            "price": 3500,
                            "total": 7000
                        }
                    ],
                    "shipping_address": {
                        "full_name": "Jane Smith",
                        "phone": "+91 9876543211",
                        "address_line1": "456 Park Avenue",
                        "city": "Delhi",
                        "state": "Delhi",
                        "postal_code": "110001",
                        "country": "India"
                    },
                    "subtotal": 7000,
                    "discount": 0,
                    "shipping_cost": 0,
                    "tax": 0,
                    "total_amount": 7000,
                    "payment_method": "Online",
                    "status": "shipped",
                    "payment_status": "completed",
                    "tracking_number": "TRACK123456",
                    "created_at": "2024-12-09T14:30:00",
                    "updated_at": "2024-12-11T09:15:00"
                }
            ]
            db.orders.insert_many(test_orders)
            print(f"Seeded {len(test_orders)} test orders")


if __name__ == "__main__":
    initialize_database()


