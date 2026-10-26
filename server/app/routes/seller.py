from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks, Header
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr
from app.database import get_database
from app.security import require_admin
from bson import ObjectId
from datetime import datetime
import hashlib
import uuid

router = APIRouter(prefix="/seller", tags=["Seller Hub"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class SellerRegister(BaseModel):
    full_name: str
    business_name: str
    email: EmailStr
    phone: str
    password: str
    gstin: Optional[str] = None
    city: str
    state: str
    pin_code: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    category_specialty: Optional[str] = "Women's Ethnic Wear"


class SellerLogin(BaseModel):
    email: str
    password: str


class SellerProductCreate(BaseModel):
    name: str
    category: str
    department: str = "Clothing"  # Scoped specifically for Nari Pehnawa Women's Ethnic Fashion
    price: float
    original_price: Optional[float] = None
    discount: Optional[int] = None
    image: str
    images: Optional[List[str]] = []
    sizes: List[str] = ["S", "M", "L", "XL"]
    size_stock: Optional[Dict[str, int]] = {}
    fabric: Optional[str] = None
    pattern: Optional[str] = None
    sleeve_type: Optional[str] = None
    fit_type: Optional[str] = "Regular Comfort Fit"
    occasion: Optional[str] = "Festive, Casual, Office Wear"
    description: Optional[str] = None
    deal_type: Optional[str] = None
    deal_text: Optional[str] = None
    is_bogo: Optional[bool] = False
    highlights: Optional[List[str]] = []


def get_current_seller(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Seller authentication token required")
    token = authorization.split(" ")[1]
    db = get_database()
    seller = db["sellers"].find_one({"token": token})
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid or expired seller session")
    return seller


@router.post("/register")
def register_seller(data: SellerRegister):
    db = get_database()
    sellers_col = db["sellers"]

    # Check if seller exists with email or phone
    existing = sellers_col.find_one({"$or": [{"email": data.email.lower()}, {"phone": data.phone}]})
    if existing:
        raise HTTPException(status_code=400, detail="A seller with this email or mobile number already exists")

    seller_token = f"np_seller_{uuid.uuid4().hex}"
    doc = data.model_dump()
    doc["email"] = doc["email"].lower()
    doc["password"] = hash_password(doc["password"])
    doc["token"] = seller_token
    doc["status"] = "active"  # Automatic registration as requested
    doc["is_approved"] = True
    doc["created_at"] = datetime.utcnow()
    doc["total_products"] = 0
    doc["total_units_sold"] = 0
    doc["gross_sales"] = 0.0
    doc["pending_payout"] = 0.0

    res = sellers_col.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc["_id"] = str(res.inserted_id)
    doc.pop("password", None)

    return {
        "success": True,
        "message": "Seller account registered successfully! Welcome to Nari Pehnawa Seller Hub.",
        "seller": doc,
        "token": seller_token
    }


@router.post("/login")
def login_seller(creds: SellerLogin):
    db = get_database()
    sellers_col = db["sellers"]

    seller = sellers_col.find_one({"email": creds.email.lower()})
    if not seller:
        # Also allow login via phone
        seller = sellers_col.find_one({"phone": creds.email})

    if not seller or seller.get("password") != hash_password(creds.password):
        raise HTTPException(status_code=401, detail="Invalid seller email/phone or password")

    new_token = f"np_seller_{uuid.uuid4().hex}"
    sellers_col.update_one({"_id": seller["_id"]}, {"$set": {"token": new_token, "last_login": datetime.utcnow()}})
    
    seller["id"] = str(seller["_id"])
    seller["_id"] = str(seller["_id"])
    seller.pop("password", None)
    seller["token"] = new_token

    return {
        "success": True,
        "message": "Login successful",
        "seller": seller,
        "token": new_token
    }


@router.get("/profile")
def get_seller_profile(seller: dict = Depends(get_current_seller)):
    seller["id"] = str(seller["_id"])
    seller["_id"] = str(seller["_id"])
    seller.pop("password", None)
    return seller


@router.get("/dashboard-stats")
def get_seller_stats(seller: dict = Depends(get_current_seller)):
    db = get_database()
    seller_id_str = str(seller["_id"])

    # Count seller products
    product_count = db["products"].count_documents({
        "$or": [{"seller_id": seller_id_str}, {"brand": seller.get("business_name")}]
    })

    # Total stock units across seller products
    prods = list(db["products"].find({
        "$or": [{"seller_id": seller_id_str}, {"brand": seller.get("business_name")}]
    }, {"stock_quantity": 1, "stock": 1, "price": 1}))

    total_stock_units = sum(int(p.get("stock_quantity") or p.get("stock") or 0) for p in prods)

    # Active categories
    categories = list(db["categories"].find({"is_active": True}, {"name": 1, "image": 1, "department": 1}))

    return {
        "seller_id": seller_id_str,
        "business_name": seller.get("business_name"),
        "full_name": seller.get("full_name"),
        "status": seller.get("status", "active"),
        "total_products": product_count,
        "total_stock_units": total_stock_units,
        "units_sold": seller.get("total_units_sold", 0),
        "gross_earnings": seller.get("gross_sales", 0.0),
        "pending_payout": seller.get("pending_payout", 0.0),
        "active_categories": categories
    }


@router.get("/products")
def get_seller_products(seller: dict = Depends(get_current_seller)):
    db = get_database()
    seller_id_str = str(seller["_id"])

    prods = list(db["products"].find({
        "$or": [{"seller_id": seller_id_str}, {"brand": seller.get("business_name")}]
    }).sort("created_at", -1))

    for p in prods:
        p["id"] = str(p["_id"])
        p["_id"] = str(p["_id"])

    return prods


@router.post("/products")
def add_seller_product(data: SellerProductCreate, seller: dict = Depends(get_current_seller)):
    db = get_database()
    products_col = db["products"]
    seller_id_str = str(seller["_id"])

    size_stock = data.size_stock or {}
    total_stock = sum(int(v or 0) for v in size_stock.values()) if size_stock else 40

    all_images = data.images if (data.images and len(data.images) > 0) else ([data.image] if data.image else [])
    primary_image = data.image or (all_images[0] if all_images else "")

    product_doc = {
        "name": data.name,
        "brand": seller.get("business_name") or "Nari Pehnawa Partner",
        "category": data.category,
        "department": "Clothing",  # Scoped specifically for Nari Pehnawa Women's Ethnic Wear
        "price": data.price,
        "original_price": data.original_price or (data.price * 1.3),
        "discount": data.discount or (round(((data.original_price - data.price) / data.original_price) * 100) if data.original_price and data.original_price > data.price else 0),
        "image": primary_image,
        "images": all_images,
        "sizes": data.sizes,
        "size_stock": size_stock,
        "stock_quantity": total_stock,
        "fabric": data.fabric,
        "pattern": data.pattern,
        "sleeve_type": data.sleeve_type,
        "fit_type": data.fit_type,
        "occasion": data.occasion,
        "description": data.description or f"Authentic handcrafted {data.category} by {seller.get('business_name')}.",
        "deal_type": "bogo" if data.is_bogo else data.deal_type,
        "deal_text": "BUY 1 GET 1 FREE" if data.is_bogo else data.deal_text,
        "is_bogo": bool(data.is_bogo),
        "seller_id": seller_id_str,
        "seller_name": seller.get("business_name") or seller.get("full_name"),
        "seller_status": "approved",
        "in_stock": total_stock > 0,
        "on_sale": bool(data.discount and data.discount > 0),
        "is_new": True,
        "country_of_origin": "India 🇮🇳",
        "hsn_code": "621133",
        "warehouse_stock": {"Home": total_stock, "home-1": 0},
        "created_at": datetime.utcnow()
    }

    res = products_col.insert_one(product_doc)
    product_doc["id"] = str(res.inserted_id)
    product_doc["_id"] = str(res.inserted_id)

    # Increment seller product count
    db["sellers"].update_one({"_id": seller["_id"]}, {"$inc": {"total_products": 1}})

    return {
        "success": True,
        "message": "Product published successfully to Nari Pehnawa catalog!",
        "product": product_doc
    }


# Admin endpoints for managing sellers
@router.get("/admin/list")
def admin_list_sellers(current_user: dict = Depends(require_admin)):
    db = get_database()
    sellers = list(db["sellers"].find({}).sort("created_at", -1))
    for s in sellers:
        s["id"] = str(s["_id"])
        s["_id"] = str(s["_id"])
        s.pop("password", None)
    return sellers
