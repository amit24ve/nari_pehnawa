"""
Creates one admin login and one regular customer login for Nari Pehnawa.
Safe to re-run: if a user with the given email already exists, its
password/role is updated in place instead of creating a duplicate.

Usage:
    cd server
    venv/bin/python3 create_logins.py
"""

from datetime import datetime

from app.config import mongo_db, mongodb_url
from app.security import get_password_hash
from pymongo import MongoClient

client = MongoClient(mongodb_url)
db = client[mongo_db]
users_col = db["users"]

ADMIN_EMAIL = "admin@naripehnawa.com"
ADMIN_PASSWORD = "Admin@123"

USER_EMAIL = "user@naripehnawa.com"
USER_PASSWORD = "User@123"


def upsert_user(email, password, name, role):
    existing = users_col.find_one({"email": email})
    password_hash = get_password_hash(password)

    if existing:
        users_col.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "password_hash": password_hash,
                    "role": role,
                    "is_admin": role == "admin",
                    "status": "active",
                    "updated_at": datetime.now(),
                }
            },
        )
        print(f"Updated existing {role} account: {email}")
        return

    doc = {
        "email": email,
        "name": name,
        "password_hash": password_hash,
        "role": role,
        "is_admin": role == "admin",
        "status": "active",
        "joined_date": datetime.now().strftime("%Y-%m-%d"),
        "last_login": None,
        "orders_count": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    users_col.insert_one(doc)
    print(f"Created new {role} account: {email}")


def main():
    upsert_user(ADMIN_EMAIL, ADMIN_PASSWORD, "Admin", "admin")
    upsert_user(USER_EMAIL, USER_PASSWORD, "Test User", "customer")

    print("\nLogin credentials:")
    print(f"  Admin    -> email: {ADMIN_EMAIL}  password: {ADMIN_PASSWORD}")
    print(f"  Customer -> email: {USER_EMAIL}  password: {USER_PASSWORD}")


if __name__ == "__main__":
    main()
