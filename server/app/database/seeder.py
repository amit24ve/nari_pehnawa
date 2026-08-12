import datetime
import random
from app.database import get_database

def seed_dummy_data():
    db = get_database()
    
    # 1. Seed Customers (exactly 2 customers as shown in the screenshot)
    try:
        # Clear existing customer users first so the count is exactly 2
        db["users"].delete_many({"role": "customer"})
        db["users"].insert_many([
            {
                "email": "neha.sharma@example.com",
                "full_name": "Neha Sharma",
                "role": "customer",
                "is_active": True,
                "created_at": datetime.datetime.now() - datetime.timedelta(days=15)
            },
            {
                "email": "priya.verma@example.com",
                "full_name": "Priya Verma",
                "role": "customer",
                "is_active": True,
                "created_at": datetime.datetime.now() - datetime.timedelta(days=12)
            }
        ])
        print("Seeded exactly 2 customer users successfully!")
    except Exception as e:
        print(f"Error seeding customers: {e}")

    # 2. Seed Orders (exactly 265 orders summing up to 128450)
    try:
        # Clear existing orders to start fresh
        db["orders"].delete_many({})
        
        orders_to_insert = []
        now = datetime.datetime.now()
        
        # Exact 4 latest orders from the screenshot:
        latest_orders = [
            {
                "order_id": "ORD-1025",
                "customer_name": "Neha Sharma",
                "email": "neha.sharma@example.com",
                "total": 1299,
                "total_amount": 1299,
                "status": "delivered",
                "payment_status": "paid",
                "payment_method": "Razorpay",
                "created_at": now - datetime.timedelta(minutes=5),
                "items": [{"name": "Elegant Floral Kurti", "quantity": 1, "price": 1299}],
                "shipping_address": "Flat 402, Sunrise Apt, Andheri, Mumbai, MH, 400053",
                "phone": "+91 9876543210"
            },
            {
                "order_id": "ORD-1024",
                "customer_name": "Priya Verma",
                "email": "priya.verma@example.com",
                "total": 2499,
                "total_amount": 2499,
                "status": "processing",
                "payment_status": "pending",
                "payment_method": "COD",
                "created_at": now - datetime.timedelta(minutes=15),
                "items": [{"name": "Designer Anarkali Suit", "quantity": 1, "price": 2499}],
                "shipping_address": "H No 12, Sector 4, Panchkula, Haryana, 134109",
                "phone": "+91 9876543211"
            },
            {
                "order_id": "ORD-1023",
                "customer_name": "Anjali Singh",
                "email": "anjali.singh@example.com",
                "total": 899,
                "total_amount": 899,
                "status": "shipped",
                "payment_status": "pending",
                "payment_method": "COD",
                "created_at": now - datetime.timedelta(minutes=30),
                "items": [{"name": "Cotton Printed Kurti", "quantity": 1, "price": 899}],
                "shipping_address": "Flat 2C, Park Street, Kolkata, WB, 700016",
                "phone": "+91 9876543212"
            },
            {
                "order_id": "ORD-1022",
                "customer_name": "Kavita Patel",
                "email": "kavita.patel@example.com",
                "total": 1699,
                "total_amount": 1699,
                "status": "delivered",
                "payment_status": "paid",
                "payment_method": "Razorpay",
                "created_at": now - datetime.timedelta(minutes=45),
                "items": [{"name": "Embroidered Palazzo Set", "quantity": 1, "price": 1699}],
                "shipping_address": "B-404, Shanti Heights, Vastrapur, Ahmedabad, GJ, 380015",
                "phone": "+91 9876543213"
            }
        ]
        orders_to_insert.extend(latest_orders)
        
        # We need 261 more orders. Total amount needed = 128450 - (1299 + 2499 + 899 + 1699) = 122054
        # We'll generate 261 historical orders distributed over the last 30 days
        # E.g. 260 orders of 467 INR and 1 order of 634 INR. 467*260 + 634 = 122054
        customer_pool = [
            ("Aarav Mehta", "aarav@example.com"),
            ("Rohan Gupta", "rohan@example.com"),
            ("Sneha Rao", "sneha@example.com"),
            ("Aditi Sen", "aditi@example.com"),
            ("Divya Nair", "divya@example.com")
        ]
        
        for i in range(260):
            cust_name, cust_email = random.choice(customer_pool)
            days_ago = random.randint(1, 30)
            minutes_ago = random.randint(1, 1440)
            order_date = now - datetime.timedelta(days=days_ago, minutes=minutes_ago)
            orders_to_insert.append({
                "order_id": f"ORD-10{i:03d}",
                "customer_name": cust_name,
                "email": cust_email,
                "total": 467,
                "total_amount": 467,
                "status": "delivered",
                "payment_status": "paid",
                "payment_method": "Razorpay",
                "created_at": order_date,
                "items": [{"name": "Kurti Item", "quantity": 1, "price": 467}],
                "shipping_address": "Historical Address India",
                "phone": "+91 9999999999"
            })
            
        # Last one to make the math hit exactly 128,450
        cust_name, cust_email = random.choice(customer_pool)
        order_date = now - datetime.timedelta(days=15)
        orders_to_insert.append({
            "order_id": "ORD-10261",
            "customer_name": cust_name,
            "email": cust_email,
            "total": 634,
            "total_amount": 634,
            "status": "delivered",
            "payment_status": "paid",
            "payment_method": "Razorpay",
            "created_at": order_date,
            "items": [{"name": "Kurti Special Set", "quantity": 1, "price": 634}],
            "shipping_address": "Historical Address India",
            "phone": "+91 9999999999"
        })
        
        db["orders"].insert_many(orders_to_insert)
        print("Seeded exactly 265 orders summing to 128450 successfully!")
    except Exception as e:
        print(f"Error seeding orders: {e}")

    # 3. Seed Categories (if empty)
    try:
        if db["categories"].count_documents({}) == 0:
            db["categories"].insert_many([
                {
                    "name": "Anarkali Kurtis",
                    "link": "/category/anarkali-kurtis",
                    "tagline": "Timeless flare for classic elegance",
                    "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500",
                    "is_active": True
                },
                {
                    "name": "Chikankari Kurtis",
                    "link": "/category/chikankari-kurtis",
                    "tagline": "Traditional lucknowi handcrafted details",
                    "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500",
                    "is_active": True
                },
                {
                    "name": "Palazzo Set Kurtis",
                    "link": "/category/palazzo-set-kurtis",
                    "tagline": "Modern sets for casual and festive comfort",
                    "image": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500",
                    "is_active": True
                },
                {
                    "name": "Home Decor",
                    "link": "/category/vases-planters",
                    "tagline": "Chic design pieces to brighten your home",
                    "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500",
                    "is_active": True
                }
            ])
            print("Seeded categories successfully!")
    except Exception as e:
        print(f"Error seeding categories: {e}")

    # 4. Seed Reviews (dynamic dummy reviews)
    try:
        db["reviews"].delete_many({})
        db["reviews"].insert_many([
            {
                "reviewer_name": "Neha Sharma",
                "reviewer_email": "neha.sharma@example.com",
                "product_name": "Elegant Floral Kurti",
                "rating": 5,
                "comment": "Absolutely stunning fabric and beautiful embroidery! Got so many compliments on it.",
                "status": "approved",
                "created_at": datetime.datetime.now() - datetime.timedelta(days=1)
            },
            {
                "reviewer_name": "Priya Verma",
                "reviewer_email": "priya.verma@example.com",
                "product_name": "Designer Anarkali Suit",
                "rating": 5,
                "comment": "Very comfortable and premium fit. Highly recommended!",
                "status": "approved",
                "created_at": datetime.datetime.now() - datetime.timedelta(days=2)
            },
            {
                "reviewer_name": "Anjali Singh",
                "reviewer_email": "anjali.singh@example.com",
                "product_name": "Cotton Printed Kurti",
                "rating": 4,
                "comment": "Nice color and prints. Perfect for office wear.",
                "status": "approved",
                "created_at": datetime.datetime.now() - datetime.timedelta(days=3)
            }
        ])
        print("Seeded reviews successfully!")
    except Exception as e:
        print(f"Error seeding reviews: {e}")

    # 5. Seed Payments (exactly matching the 265 orders summing up to 128450)
    try:
        db["payments"].delete_many({})
        payments_to_insert = []
        orders = list(db["orders"].find())
        for o in orders:
            payments_to_insert.append({
                "order_number": o["order_id"],
                "customer_name": o["customer_name"],
                "customer_email": o["email"],
                "payment_method": o["payment_method"],
                "amount": o["total"],
                "status": "captured" if o["payment_status"] == "paid" else "cod_pending",
                "razorpay_payment_id": f"pay_{random.randint(100000, 999999)}",
                "created_at": o["created_at"]
            })
        db["payments"].insert_many(payments_to_insert)
        print("Seeded matching payments successfully!")
    except Exception as e:
        print(f"Error seeding payments: {e}")
