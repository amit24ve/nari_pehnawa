"""
Seller / Vendor Management & Portal API
Provides dedicated registration, authentication, product catalog management,
packaging guidelines, and direct admin support inquiries (24-48hr SLA).
"""

from datetime import datetime, timezone, timedelta
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status, Response
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from app.database import get_database
from app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_seller,
    require_admin,
)
from app.utils.cache import clear_api_cache

router = APIRouter(prefix="/seller", tags=["Seller Portal"])


# ── Pydantic Request Models ───────────────────────────────────────────────────

class SellerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    shop_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    city: str
    state: str
    address: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None


class SellerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class SellerProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    tax_profile: Optional[str] = None  # "unregistered" | "regular_gst" | "composition"
    gst_enrolment_id: Optional[str] = None
    turnover_declaration: Optional[bool] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    brand_name: Optional[str] = None
    kyc_document_url: Optional[str] = None
    aadhaar_number: Optional[str] = None
    aadhaar_front_url: Optional[str] = None
    aadhaar_back_url: Optional[str] = None
    pan_number: Optional[str] = None
    pan_card_url: Optional[str] = None
    shop_image_url: Optional[str] = None
    brand_logo_url: Optional[str] = None
    seller_photo_url: Optional[str] = None
    kyc_documents: Optional[List[str]] = None


class AdminProductApprovalRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected|pending)$")
    remarks: Optional[str] = None


class SellerReturnDisputeRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5, max_length=2000)
    evidence_image_url: Optional[str] = None


class SellerProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=250)
    brand: Optional[str] = "Nari Pehnawa"
    # Pricing Breakdown (Meesho / Flipkart / Amazon Marketplace Model)
    seller_price: Optional[float] = Field(None, description="Base payout seller receives")
    delivery_charge: Optional[float] = Field(50.0, description="Forward shipping charge")
    rto_charge: Optional[float] = Field(35.0, description="RTO risk buffer charge")
    handling_fee: Optional[float] = Field(10.0, description="Centralized NP polybag & platform handling (+10 extra)")
    price: Optional[float] = Field(None, gt=0, description="Customer listing price on storefront")
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    discount: Optional[int] = 0
    image: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    stock: Optional[int] = None
    stock_quantity: Optional[int] = 10
    sizes: Optional[Any] = None
    size_stock: Optional[Dict[str, int]] = {}
    fabric: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    sleeve_type: Optional[str] = None
    occasion: Optional[str] = "Festive & Party"
    wash_care: Optional[str] = "Dry Clean Recommended"
    tags: Optional[List[str]] = []
    is_active: Optional[bool] = True


class SellerProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    seller_price: Optional[float] = None
    delivery_charge: Optional[float] = None
    rto_charge: Optional[float] = None
    handling_fee: Optional[float] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    discount: Optional[int] = None
    image: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    stock: Optional[int] = None
    stock_quantity: Optional[int] = None
    sizes: Optional[Any] = None
    size_stock: Optional[Dict[str, int]] = None
    fabric: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    sleeve_type: Optional[str] = None
    in_stock: Optional[bool] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None


class SellerInquiryCreateRequest(BaseModel):
    category: str = Field(..., description="category_request | packaging_request | kyc_query | payment | general")
    subject: str = Field(..., min_length=3, max_length=200)
    message: str = Field(..., min_length=10)


class AdminKYCUpdateRequest(BaseModel):
    kyc_status: str = Field(..., description="approved | rejected | pending")
    kyc_remarks: Optional[str] = None
    welcome_kit_status: Optional[str] = None
    welcome_kit_awb: Optional[str] = None
    welcome_kit_notes: Optional[str] = None


class AdminStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="active | suspended")


class AdminInquiryReplyRequest(BaseModel):
    reply_message: str = Field(..., min_length=2)
    new_status: Optional[str] = "resolved"


class SellerOrderStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="packed | ready_to_ship | cancelled")
    tracking_awb: Optional[str] = None
    courier_name: Optional[str] = None
    notes: Optional[str] = None


class SellerStockAdjustRequest(BaseModel):
    product_id: str
    new_stock: int = Field(..., ge=0)
    reason: Optional[str] = "Manual inventory adjustment"


# ── Helper ────────────────────────────────────────────────────────────────────

def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    res = dict(doc)
    if "_id" in res:
        res["id"] = str(res["_id"])
        del res["_id"]
    if "password_hash" in res:
        del res["password_hash"]
    return res


# ── 1. Public Authentication & Registration ───────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_seller(payload: SellerRegisterRequest):
    """
    Register a new merchant / seller.
    Initial KYC status is 'pending'. All sellers are enrolled in Nari Pehnawa Packaging Guidelines.
    """
    db = get_database()
    email_clean = payload.email.strip().lower()

    # Check if already registered
    existing = db["sellers"].find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A seller account with this email address already exists. Please log in.",
        )

    now = datetime.now(timezone.utc)
    hashed = get_password_hash(payload.password)

    seller_doc = {
        "name": payload.name.strip(),
        "shop_name": payload.shop_name.strip(),
        "email": email_clean,
        "phone": payload.phone.strip(),
        "password_hash": hashed,
        "city": payload.city.strip(),
        "state": payload.state.strip(),
        "address": payload.address.strip() if payload.address else "",
        "pincode": payload.pincode.strip() if payload.pincode else "",
        "gstin": payload.gstin.strip().upper() if payload.gstin else None,
        "pan": payload.pan.strip().upper() if payload.pan else None,
        "bank_name": payload.bank_name.strip() if payload.bank_name else None,
        "account_number": payload.account_number.strip() if payload.account_number else None,
        "ifsc_code": payload.ifsc_code.strip().upper() if payload.ifsc_code else None,
        "account_holder_name": payload.account_holder_name.strip() if payload.account_holder_name else None,
        "kyc_status": "pending",  # pending | approved | rejected
        "kyc_remarks": "Documents submitted. Awaiting verification by Nari Pehnawa Compliance team.",
        "kyc_document_url": None,
        "status": "active",       # active | suspended
        "packaging_policy_accepted": True,
        "created_at": now,
        "updated_at": now,
    }

    result = db["sellers"].insert_one(seller_doc)
    seller_id = str(result.inserted_id)

    # Sync seller into users collection for Admin Users visibility and universal login
    try:
        db["users"].update_one(
            {"email": email_clean},
            {
                "$set": {
                    "email": email_clean,
                    "full_name": payload.name.strip(),
                    "phone": payload.phone.strip(),
                    "password_hash": hashed,
                    "role": "seller",
                    "is_seller": True,
                    "seller_id": seller_id,
                    "shop_name": payload.shop_name.strip(),
                    "kyc_status": "pending",
                    "status": "active",
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "created_at": now,
                    "coins_balance": 0,
                },
            },
            upsert=True,
        )
    except Exception as e:
        print(f"Error syncing seller to users collection: {e}")

    # Issue JWT Token with seller role
    token = create_access_token({"sub": seller_id, "email": email_clean, "role": "seller"})

    return {
        "message": "Seller registration successful. Welcome to Nari Pehnawa Seller Central!",
        "access_token": token,
        "token_type": "bearer",
        "seller": serialize_doc(seller_doc),
    }


@router.post("/login")
def login_seller(payload: SellerLoginRequest):
    """
    Authenticate seller and return JWT access token.
    """
    db = get_database()
    email_clean = payload.email.strip()
    escaped = re.escape(email_clean)
    email_pattern = f"^{escaped}$"

    seller = db["sellers"].find_one({"$or": [
        {"email": {"$regex": email_pattern, "$options": "i"}},
        {"phone": email_clean}
    ]})
    if not seller or not verify_password(payload.password, seller.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if seller.get("status") == "suspended":
        raise HTTPException(
            status_code=403,
            detail="Your seller account has been suspended. Please contact Nari Pehnawa Merchant Support.",
        )

    seller_id = str(seller["_id"])
    token = create_access_token({"sub": seller_id, "email": email_clean, "role": "seller"})

    return {
        "access_token": token,
        "token_type": "bearer",
        "seller": serialize_doc(seller),
    }


@router.get("/packaging-policy")
def get_packaging_policy():
    """
    Official Nari Pehnawa packaging rules:
    All seller dispatches must use Nari Pehnawa branded secure polybags.
    """
    return {
        "company": "Nari Pehnawa Luxury Indian Ethnic Wear",
        "policy_title": "Official Mandatory Packaging & Dispatch Guidelines",
        "packaging_system": "Nari Pehnawa Centralized Security Polybags",
        "guidelines": [
            "All seller garments dispatched through Nari Pehnawa must be sealed inside official Nari Pehnawa branded polythene / courier bags.",
            "External polybags, tamper-evident tape, and brand labels are provided directly by Nari Pehnawa.",
            "Garment branding (internal neck tags, wash-care tags, and garment cards) can carry the seller's verified brand name.",
            "Sellers can request additional polybag packs directly from the Seller Dashboard with 24-48hr fulfillment.",
            "Orders packed in non-standard or third-party polybags may be flagged during carrier pickup or hub transit.",
        ],
        "dispatch_steps": [
            "1. Fold and place the finished garment inside the transparent inner protective sleeve.",
            "2. Enclose inside the official Nari Pehnawa tamper-evident branded polybag.",
            "3. Peel the adhesive strip and seal tightly.",
            "4. Print and paste the official Nari Pehnawa shipping label on the designated document pouch.",
            "5. Hand over to the scheduled pickup carrier.",
        ],
        "support_sla": "Seller inquiries regarding packaging or requests are processed within 24 to 48 hours.",
    }


# ── 2. Seller Protected Endpoints (Seller Portal) ─────────────────────────────

@router.get("/me")
def get_seller_profile(current_user: dict = Depends(require_seller)):
    """Get current logged-in seller details and KYC status."""
    db = get_database()
    seller = None
    try:
        seller = db["sellers"].find_one({"_id": ObjectId(current_user["id"])})
    except Exception:
        pass
    if not seller:
        seller = db["sellers"].find_one({"id": current_user["id"]})
    if not seller and current_user.get("email"):
        seller = db["sellers"].find_one({"email": current_user["email"]})
    if not seller:
        try:
            u = db["users"].find_one({"_id": ObjectId(current_user["id"])})
            if u and u.get("seller_id"):
                seller = db["sellers"].find_one({"_id": ObjectId(u["seller_id"])})
        except Exception:
            pass
    if not seller and current_user.get("role") == "admin":
        return {
            "id": current_user["id"],
            "name": "Admin",
            "shop_name": "Nari Pehnawa Official",
            "email": current_user.get("email", "admin@naripehnawa.com"),
            "role": "admin",
            "kyc_status": "approved",
            "status": "active"
        }
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found.")
    return serialize_doc(seller)


@router.put("/profile")
def update_seller_profile(
    payload: SellerProfileUpdateRequest,
    current_user: dict = Depends(require_seller),
):
    """Update seller business, bank, and KYC details."""
    db = get_database()
    seller = db["sellers"].find_one({"_id": ObjectId(current_user["id"])})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc)

    # If new KYC doc or details added, move status to pending for re-review
    if payload.gstin or payload.pan or payload.kyc_document_url:
        if seller.get("kyc_status") == "rejected":
            update_fields["kyc_status"] = "pending"
            update_fields["kyc_remarks"] = "Updated documents submitted for re-verification."

    db["sellers"].update_one({"_id": ObjectId(current_user["id"])}, {"$set": update_fields})
    updated = db["sellers"].find_one({"_id": ObjectId(current_user["id"])})
    return {"message": "Profile updated successfully.", "seller": serialize_doc(updated)}


@router.get("/dashboard/stats")
def get_seller_dashboard_stats(
    current_user: dict = Depends(require_seller),
    range_filter: str = Query("7d", alias="range"),
):
    """
    Real-time, permission-filtered stats for Seller Dashboard.
    Supports range: 'today', '7d', '30d', 'all'.
    """
    db = get_database()
    sid = current_user["id"]

    seller = db["sellers"].find_one({"_id": ObjectId(sid)})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    # 1. Product & stock counts
    seller_products = list(db["products"].find({"seller_id": sid}))
    total_products = len(seller_products)
    active_products = sum(1 for p in seller_products if p.get("in_stock", True))
    total_stock_units = sum(int(p.get("stock_quantity") or 0) for p in seller_products)
    low_stock_products = sum(1 for p in seller_products if 0 < int(p.get("stock_quantity") or 0) <= 5)
    out_of_stock_products = sum(1 for p in seller_products if not p.get("in_stock", True) or int(p.get("stock_quantity") or 0) <= 0)

    # 2. Date filtering
    now = datetime.now(timezone.utc)
    if range_filter == "today":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        days_count = 1
    elif range_filter == "30d":
        start_dt = now - timedelta(days=30)
        days_count = 30
    elif range_filter == "all":
        start_dt = datetime(2020, 1, 1, tzinfo=timezone.utc)
        days_count = 30
    else:  # default 7d
        start_dt = now - timedelta(days=7)
        days_count = 7

    # 3. Seller orders calculation
    seller_pids = {str(p["_id"]): p for p in seller_products}
    seller_pid_list = list(seller_pids.keys())

    order_query = {
        "$or": [
            {"items.product_id": {"$in": seller_pid_list}},
            {"items.seller_id": sid},
        ]
    }
    all_seller_orders = list(db["orders"].find(order_query).sort("created_at", -1))

    # Calculate metrics
    total_orders = 0
    total_sales_amount = 0.0
    pending_orders = 0
    ready_to_ship = 0
    shipped_orders = 0
    delivered_orders = 0
    cancelled_orders = 0

    daily_buckets = {}
    for d_idx in range(days_count):
        day_date = (now - timedelta(days=days_count - 1 - d_idx)).strftime("%Y-%m-%d")
        day_label = (now - timedelta(days=days_count - 1 - d_idx)).strftime("%b %d")
        daily_buckets[day_date] = {"date": day_date, "label": day_label, "sales": 0.0, "orders": 0}

    for o in all_seller_orders:
        o_created = o.get("created_at")
        if isinstance(o_created, str):
            try:
                o_created = datetime.fromisoformat(o_created.replace("Z", "+00:00"))
            except Exception:
                o_created = now
        elif not isinstance(o_created, datetime):
            o_created = now

        # Seller sub-items in this order
        seller_items = [
            it for it in o.get("items", [])
            if str(it.get("product_id")) in seller_pids or str(it.get("seller_id")) == sid
        ]
        if not seller_items:
            continue

        seller_subtotal = sum(
            float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items
        )

        st = str(o.get("status") or "").lower()
        if st in ["placed", "confirmed", "processing", "pending"]:
            pending_orders += 1
        elif st in ["packed", "ready_to_ship"]:
            ready_to_ship += 1
        elif st in ["shipped", "out_for_delivery", "in_transit"]:
            shipped_orders += 1
        elif st in ["delivered", "completed"]:
            delivered_orders += 1
        elif st in ["cancelled", "canceled", "failed"]:
            cancelled_orders += 1

        if o_created >= start_dt:
            total_orders += 1
            if st not in ["cancelled", "canceled", "failed"]:
                total_sales_amount += seller_subtotal

            d_str = o_created.strftime("%Y-%m-%d")
            if d_str in daily_buckets and st not in ["cancelled", "canceled", "failed"]:
                daily_buckets[d_str]["sales"] += round(seller_subtotal, 2)
                daily_buckets[d_str]["orders"] += 1

    daily_sales_trend = list(daily_buckets.values())

    # Inquiries count
    open_inquiries = db["seller_inquiries"].count_documents({"seller_id": sid, "status": "open"})
    total_inquiries = db["seller_inquiries"].count_documents({"seller_id": sid})

    # Action Items
    action_items = []
    if pending_orders > 0:
        action_items.append({
            "id": "orders_pending",
            "title": f"{pending_orders} new order(s) pending processing",
            "desc": "Please pack order garments in Nari Pehnawa polybags and mark ready to ship.",
            "type": "warning",
            "link": "/seller/orders?status=processing",
        })
    if low_stock_products > 0:
        action_items.append({
            "id": "low_stock",
            "title": f"{low_stock_products} product(s) low in stock (<= 5 units remaining)",
            "desc": "Restock inventory to prevent sudden out-of-stock cancellations.",
            "type": "alert",
            "link": "/seller/inventory?stock=low",
        })
    if seller.get("kyc_status") != "approved":
        action_items.append({
            "id": "kyc_verify",
            "title": "Complete KYC Verification (Aadhaar & PAN)",
            "desc": "Required for direct bank settlements and official welcome kit dispatch.",
            "type": "info",
            "link": "/seller/profile",
        })
    if seller.get("welcome_kit_status") == "dispatched":
        action_items.append({
            "id": "kit_dispatch",
            "title": "Welcome Kit & Packaging Polybags Dispatched",
            "desc": f"Tracking AWB: {seller.get('welcome_kit_awb') or 'Shiprocket'}. Please confirm receipt once delivered.",
            "type": "success",
            "link": "/seller/profile",
        })

    # Commission & payout estimation (Dynamic platform commission)
    m_cfg = db["marketplace_settings"].find_one({"key": "global_config"}) or {}
    comm_rate = float(m_cfg.get("global_commission_rate", 10.0)) / 100.0
    estimated_commission = round(total_sales_amount * comm_rate, 2)
    net_earnings = round(total_sales_amount - estimated_commission, 2)
    available_balance = net_earnings if seller.get("kyc_status") == "approved" else 0.0
    pending_settlements = net_earnings if seller.get("kyc_status") != "approved" else 0.0

    return {
        "shop_name": seller.get("shop_name", "My Store"),
        "kyc_status": seller.get("kyc_status", "pending"),
        "kyc_remarks": seller.get("kyc_remarks", ""),
        "total_products": total_products,
        "active_products": active_products,
        "total_stock_units": total_stock_units,
        "low_stock_products": low_stock_products,
        "out_of_stock_products": out_of_stock_products,
        "total_sales_amount": round(total_sales_amount, 2),
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "ready_to_ship": ready_to_ship,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "net_earnings": net_earnings,
        "available_balance": available_balance,
        "pending_settlements": pending_settlements,
        "open_inquiries": open_inquiries,
        "total_inquiries": total_inquiries,
        "daily_sales_trend": daily_sales_trend,
        "action_items": action_items,
        "packaging_compliance": "Enrolled (Official Nari Pehnawa Packaging)",
        "welcome_kit_status": seller.get("welcome_kit_status", "not_dispatched"),
        "welcome_kit_awb": seller.get("welcome_kit_awb", ""),
        "welcome_kit_notes": seller.get("welcome_kit_notes", ""),
        "support_sla": "Under 24-48 Hours",
    }


# ── Orders Management by Seller ───────────────────────────────────────────────

@router.get("/orders")
def list_seller_orders(
    current_user: dict = Depends(require_seller),
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """
    List customer orders containing the authenticated seller's products.
    Returns seller-scoped items, subtotal, and fulfillment state.
    """
    db = get_database()
    sid = current_user["id"]

    seller_products = list(db["products"].find({"seller_id": sid}, {"_id": 1}))
    seller_pid_list = [str(p["_id"]) for p in seller_products]

    query = {
        "$or": [
            {"items.product_id": {"$in": seller_pid_list}},
            {"items.seller_id": sid},
        ]
    }

    if status and status != "all":
        query["status"] = status
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search.strip(), "$options": "i"}},
            {"customer_email": {"$regex": search.strip(), "$options": "i"}},
            {"shipping_address.name": {"$regex": search.strip(), "$options": "i"}},
        ]

    total = db["orders"].count_documents(query)
    raw_orders = list(db["orders"].find(query).sort("created_at", -1).skip(skip).limit(limit))

    seller_orders = []
    for o in raw_orders:
        seller_items = [
            it for it in o.get("items", [])
            if str(it.get("product_id")) in seller_pid_list or str(it.get("seller_id")) == sid
        ]
        seller_subtotal = sum(
            float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items
        )

        formatted = serialize_doc(o)
        formatted["seller_items"] = seller_items
        formatted["seller_subtotal"] = round(seller_subtotal, 2)
        formatted["seller_item_count"] = sum(int(it.get("quantity") or 1) for it in seller_items)
        seller_orders.append(formatted)

    return {
        "orders": seller_orders,
        "total": total,
    }


@router.get("/orders/{order_id}")
def get_seller_order_detail(
    order_id: str,
    current_user: dict = Depends(require_seller),
):
    """Detailed view of an order with printable packing slip & invoice data for the seller."""
    db = get_database()
    sid = current_user["id"]

    order = None
    if ObjectId.is_valid(order_id):
        order = db["orders"].find_one({"_id": ObjectId(order_id)})
    if not order:
        order = db["orders"].find_one({"order_number": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    seller_products = list(db["products"].find({"seller_id": sid}, {"_id": 1}))
    seller_pid_list = [str(p["_id"]) for p in seller_products]

    seller_items = [
        it for it in order.get("items", [])
        if str(it.get("product_id")) in seller_pid_list or str(it.get("seller_id")) == sid
    ]
    if not seller_items:
        raise HTTPException(status_code=403, detail="You do not have products in this order.")

    seller_subtotal = sum(
        float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items
    )

    formatted = serialize_doc(order)
    formatted["seller_items"] = seller_items
    formatted["seller_subtotal"] = round(seller_subtotal, 2)
    return formatted


@router.put("/orders/{order_id}/status")
def update_seller_order_status(
    order_id: str,
    payload: SellerOrderStatusUpdateRequest,
    current_user: dict = Depends(require_seller),
):
    """Seller marks order as packed, ready to ship, or adds dispatch note."""
    db = get_database()
    sid = current_user["id"]

    order = None
    if ObjectId.is_valid(order_id):
        order = db["orders"].find_one({"_id": ObjectId(order_id)})
    if not order:
        order = db["orders"].find_one({"order_number": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    update_doc = {
        "status": payload.status,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.tracking_awb:
        update_doc["shipping.awb_code"] = payload.tracking_awb
    if payload.courier_name:
        update_doc["shipping.courier_name"] = payload.courier_name

    db["orders"].update_one({"_id": order["_id"]}, {"$set": update_doc})
    return {"message": f"Order status updated to '{payload.status}'.", "status": payload.status}


# ── Inventory Ledger & Stock Management ───────────────────────────────────────

@router.get("/inventory")
def get_seller_inventory(
    current_user: dict = Depends(require_seller),
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """Real-time inventory levels, stock health, and recent stock adjustment logs."""
    db = get_database()
    sid = current_user["id"]

    query = {"seller_id": sid}
    if search:
        query["name"] = {"$regex": search.strip(), "$options": "i"}

    if status == "low":
        query["stock_quantity"] = {"$gt": 0, "$lte": 5}
    elif status == "out_of_stock":
        query["$or"] = [{"stock_quantity": {"$lte": 0}}, {"in_stock": False}]
    elif status == "in_stock":
        query["stock_quantity"] = {"$gt": 5}
        query["in_stock"] = True

    total = db["products"].count_documents(query)
    prods = list(db["products"].find(query).sort("stock_quantity", 1).skip(skip).limit(limit))

    # Fetch recent inventory logs
    logs = list(db["inventory_logs"].find({"seller_id": sid}).sort("created_at", -1).limit(20))

    return {
        "products": [serialize_doc(p) for p in prods],
        "total": total,
        "logs": [serialize_doc(l) for l in logs],
    }


@router.post("/inventory/adjust")
def adjust_seller_inventory(
    payload: SellerStockAdjustRequest,
    current_user: dict = Depends(require_seller),
):
    """Adjust product stock quantity with audit reason logged."""
    if not ObjectId.is_valid(payload.product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID.")

    db = get_database()
    sid = current_user["id"]

    prod = db["products"].find_one({"_id": ObjectId(payload.product_id), "seller_id": sid})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found in your catalog.")

    old_stock = int(prod.get("stock_quantity") or 0)
    new_stock = int(payload.new_stock)

    db["products"].update_one(
        {"_id": ObjectId(payload.product_id)},
        {"$set": {
            "stock_quantity": new_stock,
            "in_stock": new_stock > 0,
            "updated_at": datetime.now(timezone.utc),
        }}
    )

    # Record in inventory audit log
    db["inventory_logs"].insert_one({
        "seller_id": sid,
        "product_id": payload.product_id,
        "product_name": prod.get("name"),
        "old_quantity": old_stock,
        "new_quantity": new_stock,
        "delta": new_stock - old_stock,
        "reason": payload.reason or "Stock manual update",
        "created_at": datetime.now(timezone.utc),
    })

    return {
        "message": "Stock updated successfully.",
        "product_id": payload.product_id,
        "new_stock": new_stock,
        "in_stock": new_stock > 0,
    }


# ── Finance & Settlements Overview ────────────────────────────────────────────

@router.get("/finance/overview")
def get_seller_finance_overview(current_user: dict = Depends(require_seller)):
    """Ledger overview of gross sales, marketplace commission, shipping charges, and net payouts."""
    db = get_database()
    sid = current_user["id"]

    seller = db["sellers"].find_one({"_id": ObjectId(sid)})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    seller_products = list(db["products"].find({"seller_id": sid}, {"_id": 1}))
    seller_pids = [str(p["_id"]) for p in seller_products]

    # Find delivered orders
    orders = list(db["orders"].find({
        "$or": [
            {"items.product_id": {"$in": seller_pids}},
            {"items.seller_id": sid},
        ]
    }))

    gross_sales = 0.0
    completed_sales = 0.0
    orders_count = 0

    for o in orders:
        st = str(o.get("status") or "").lower()
        if st in ["cancelled", "canceled", "failed"]:
            continue

        seller_items = [
            it for it in o.get("items", [])
            if str(it.get("product_id")) in seller_pids or str(it.get("seller_id")) == sid
        ]
        sub = sum(float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items)
        gross_sales += sub
        orders_count += 1
        if st in ["delivered", "completed"]:
            completed_sales += sub

    m_cfg = db["marketplace_settings"].find_one({"key": "global_config"}) or {}
    comm_rate = float(m_cfg.get("global_commission_rate", 10.0)) / 100.0
    commission_fee = round(gross_sales * comm_rate, 2)
    logistics_fee = round(orders_count * float(m_cfg.get("shipping_fee_default", 50.0)), 2)
    net_earnings = round(max(0, gross_sales - commission_fee - logistics_fee), 2)

    available_balance = round(max(0, completed_sales - (completed_sales * comm_rate)), 2)
    pending_settlement = round(max(0, net_earnings - available_balance), 2)

    return {
        "gross_sales": round(gross_sales, 2),
        "platform_commission": commission_fee,
        "logistics_deductions": logistics_fee,
        "net_earnings": net_earnings,
        "available_balance": available_balance,
        "pending_settlements": pending_settlement,
        "kyc_verified": seller.get("kyc_status") == "approved",
        "bank_account_configured": bool(seller.get("account_number") and seller.get("ifsc_code")),
        "bank_name": seller.get("bank_name", "Not set"),
        "account_number_masked": f"••••{seller.get('account_number')[-4:]}" if seller.get("account_number") else "Not configured",
        "settlement_cycle": "T+7 Days Post Delivery",
    }


# ── Returns, Cancellations & Reverse Logistics ────────────────────────────────

@router.get("/returns")
def list_seller_returns(
    current_user: dict = Depends(require_seller),
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """
    List returns, cancellations, and disputes related to the seller's items.
    """
    db = get_database()
    sid = current_user["id"]

    seller_products = list(db["products"].find({"seller_id": sid}, {"_id": 1}))
    seller_pid_list = [str(p["_id"]) for p in seller_products]

    query = {
        "$and": [
            {
                "$or": [
                    {"items.product_id": {"$in": seller_pid_list}},
                    {"items.seller_id": sid},
                ]
            },
            {
                "$or": [
                    {"status": {"$in": ["cancelled", "canceled", "return_requested", "returned", "return_in_transit", "refunded"]}},
                    {"return_status": {"$exists": True, "$ne": None}},
                ]
            }
        ]
    }

    if status and status != "all":
        query["$and"].append({"status": status})

    total = db["orders"].count_documents(query)
    raw_orders = list(db["orders"].find(query).sort("updated_at", -1).skip(skip).limit(limit))

    returns_list = []
    for o in raw_orders:
        seller_items = [
            it for it in o.get("items", [])
            if str(it.get("product_id")) in seller_pid_list or str(it.get("seller_id")) == sid
        ]
        sub = sum(float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items)
        returns_list.append({
            "id": str(o["_id"]),
            "order_number": o.get("order_number", str(o["_id"])),
            "created_at": o.get("created_at"),
            "updated_at": o.get("updated_at"),
            "status": o.get("return_status") or o.get("status", "cancelled"),
            "return_reason": o.get("cancellation_reason") or o.get("return_reason") or "Customer requested cancellation / return",
            "items": seller_items,
            "refund_amount": round(sub, 2),
            "dispute_status": o.get("seller_dispute", {}).get("status", "none") if isinstance(o.get("seller_dispute"), dict) else "none",
            "dispute_reason": o.get("seller_dispute", {}).get("reason") if isinstance(o.get("seller_dispute"), dict) else None,
            "shipping_address": o.get("shipping_address"),
            "tracking_awb": o.get("shipping", {}).get("awb_code"),
        })

    return {
        "returns": returns_list,
        "total": total,
    }


@router.post("/returns/{order_id}/dispute")
def raise_return_dispute(
    order_id: str,
    payload: SellerReturnDisputeRequest,
    current_user: dict = Depends(require_seller),
):
    """Raise a condition or fraud dispute for a returned/cancelled item."""
    db = get_database()
    sid = current_user["id"]

    order = None
    if ObjectId.is_valid(order_id):
        order = db["orders"].find_one({"_id": ObjectId(order_id)})
    if not order:
        order = db["orders"].find_one({"order_number": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    dispute_record = {
        "status": "under_review",
        "reason": payload.reason,
        "description": payload.description,
        "evidence_image_url": payload.evidence_image_url,
        "created_at": datetime.now(timezone.utc),
        "raised_by_seller_id": sid,
    }

    db["orders"].update_one(
        {"_id": order["_id"]},
        {"$set": {"seller_dispute": dispute_record, "updated_at": datetime.now(timezone.utc)}}
    )

    db["seller_inquiries"].insert_one({
        "seller_id": sid,
        "category": "Return Damage & Claims",
        "subject": f"Return Dispute for Order #{order.get('order_number')}: {payload.reason}",
        "message": payload.description,
        "status": "open",
        "order_id": str(order["_id"]),
        "evidence_image": payload.evidence_image_url,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })

    return {"message": "Dispute lodged successfully. Admin team will review within 24-48 hours."}


# ── Reports & Data Exports (CSV) ──────────────────────────────────────────────

@router.get("/reports/export")
def export_seller_report(
    report_type: str = Query("orders", alias="type"),
    current_user: dict = Depends(require_seller),
):
    """
    Download CSV report for orders, products, inventory, or financial settlements.
    Strictly isolated to authenticated seller.
    """
    import csv
    import io

    db = get_database()
    sid = current_user["id"]
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "orders":
        writer.writerow(["Order Number", "Order Date", "Status", "Items Count", "Seller Subtotal (INR)", "Customer Name", "City", "State", "AWB Code"])
        seller_products = list(db["products"].find({"seller_id": sid}, {"_id": 1}))
        seller_pids = [str(p["_id"]) for p in seller_products]
        orders = list(db["orders"].find({
            "$or": [
                {"items.product_id": {"$in": seller_pids}},
                {"items.seller_id": sid},
            ]
        }).sort("created_at", -1))
        for o in orders:
            seller_items = [
                it for it in o.get("items", [])
                if str(it.get("product_id")) in seller_pids or str(it.get("seller_id")) == sid
            ]
            sub = sum(float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items)
            addr = o.get("shipping_address") or {}
            writer.writerow([
                o.get("order_number", str(o["_id"])),
                str(o.get("created_at") or "")[:19],
                o.get("status", "pending"),
                len(seller_items),
                round(sub, 2),
                addr.get("name", "Customer"),
                addr.get("city", ""),
                addr.get("state", ""),
                o.get("shipping", {}).get("awb_code", "N/A"),
            ])

    elif report_type == "products":
        writer.writerow(["Product ID", "Title", "Category", "Brand", "Customer Price", "Seller Payout", "Stock Quantity", "In Stock", "Live Status"])
        prods = list(db["products"].find({"seller_id": sid}).sort("created_at", -1))
        for p in prods:
            writer.writerow([
                str(p["_id"]),
                p.get("name", ""),
                p.get("category", ""),
                p.get("brand", ""),
                p.get("price", 0),
                p.get("seller_price", ""),
                p.get("stock_quantity", p.get("stock", 0)),
                "YES" if p.get("in_stock", True) else "NO",
                "LIVE" if p.get("is_active", True) else "DRAFT",
            ])

    elif report_type == "inventory":
        writer.writerow(["Product Name", "Old Qty", "New Qty", "Delta", "Reason", "Timestamp"])
        logs = list(db["inventory_logs"].find({"seller_id": sid}).sort("created_at", -1).limit(500))
        for l in logs:
            writer.writerow([
                l.get("product_name", ""),
                l.get("old_quantity", 0),
                l.get("new_quantity", 0),
                l.get("delta", 0),
                l.get("reason", ""),
                str(l.get("created_at") or "")[:19],
            ])

    else:  # settlements / finance
        writer.writerow(["Order Number", "Order Date", "Status", "Gross Subtotal (INR)", "Platform Commission (10%)", "Logistics Fee (INR)", "Net Earnings (INR)"])
        seller_products = list(db["products"].find({"seller_id": sid}, {"_id": 1}))
        seller_pids = [str(p["_id"]) for p in seller_products]
        orders = list(db["orders"].find({
            "$or": [
                {"items.product_id": {"$in": seller_pids}},
                {"items.seller_id": sid},
            ]
        }).sort("created_at", -1))
        for o in orders:
            seller_items = [
                it for it in o.get("items", [])
                if str(it.get("product_id")) in seller_pids or str(it.get("seller_id")) == sid
            ]
            sub = sum(float(it.get("price") or 0) * int(it.get("quantity") or 1) for it in seller_items)
            comm = round(sub * 0.10, 2)
            ship = 50.0
            net = round(max(0, sub - comm - ship), 2)
            writer.writerow([
                o.get("order_number", str(o["_id"])),
                str(o.get("created_at") or "")[:19],
                o.get("status", "pending"),
                round(sub, 2),
                comm,
                ship,
                net,
            ])

    csv_data = output.getvalue()
    filename = f"nari_pehnawa_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── Products Management by Seller ─────────────────────────────────────────────

@router.get("/products")
def list_seller_products(
    current_user: dict = Depends(require_seller),
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    skip: int = 0,
):
    """List all products uploaded by the authenticated seller."""
    db = get_database()
    query = {"seller_id": current_user["id"]}

    if search:
        query["name"] = {"$regex": search.strip(), "$options": "i"}
    if category and category != "all":
        query["category"] = category
    if is_active is not None:
        query["is_active"] = is_active

    total = db["products"].count_documents(query)
    prods = list(db["products"].find(query).sort("created_at", -1).skip(skip).limit(limit))
    return {
        "products": [serialize_doc(p) for p in prods],
        "total": total,
    }


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_seller_product(
    payload: SellerProductCreateRequest,
    current_user: dict = Depends(require_seller),
):
    """
    Add a new product by the seller.
    Product is immediately registered in the central Nari Pehnawa product catalog!
    """
    db = get_database()
    seller = db["sellers"].find_one({"_id": ObjectId(current_user["id"])})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    now = datetime.now(timezone.utc)

    main_image = payload.image or payload.image_url or (payload.images[0] if payload.images else "/placeholder.png")
    all_images = payload.images or ([main_image] if main_image else [])

    # Process sizes and size_stock
    parsed_sizes = []
    size_stock_map = payload.size_stock or {}
    total_qty = payload.stock if payload.stock is not None else (payload.stock_quantity or 10)

    if payload.sizes:
        if isinstance(payload.sizes, list):
            for s in payload.sizes:
                if isinstance(s, dict):
                    sz_name = str(s.get("size", "")).strip()
                    sz_qty = int(s.get("stock", 0))
                    if sz_name:
                        parsed_sizes.append(sz_name)
                        size_stock_map[sz_name] = sz_qty
                elif isinstance(s, str) and s.strip():
                    parsed_sizes.append(s.strip())
        elif isinstance(payload.sizes, str):
            parsed_sizes = [x.strip() for x in payload.sizes.split(",") if x.strip()]

    if not parsed_sizes:
        parsed_sizes = ["Free Size"]
    if size_stock_map:
        total_qty = sum(size_stock_map.values())

    # ── Advanced Marketplace Pricing Formula (Meesho / Flipkart / Amazon Model) ──
    # Formula: Customer Price = Seller Payout + Delivery Charge + RTO Charge + 10 Extra
    shipping_fee = float(payload.delivery_charge if payload.delivery_charge is not None else 50.0)
    rto_fee = float(payload.rto_charge if payload.rto_charge is not None else 35.0)
    extra_handling = float(payload.handling_fee if payload.handling_fee is not None else 10.0)

    if payload.seller_price and payload.seller_price > 0:
        seller_payout = float(payload.seller_price)
        calculated_customer_price = round(seller_payout + shipping_fee + rto_fee + extra_handling, 2)
    elif payload.price and payload.price > 0:
        # If seller only passed final price, deduce base seller payout
        calculated_customer_price = float(payload.price)
        seller_payout = max(0.0, round(calculated_customer_price - (shipping_fee + rto_fee + extra_handling), 2))
    else:
        seller_payout = 499.0
        calculated_customer_price = round(seller_payout + shipping_fee + rto_fee + extra_handling, 2)

    curr_price = float(payload.discount_price if (payload.discount_price and payload.discount_price < calculated_customer_price) else calculated_customer_price)
    orig_price = float(payload.original_price if (payload.original_price and payload.original_price > curr_price) else round(curr_price * 1.35, 2))
    discount = payload.discount or 0
    if not discount and orig_price > curr_price:
        discount = int(round(((orig_price - curr_price) / orig_price) * 100))

    prod_doc = {
        "name": payload.name.strip(),
        "brand": payload.brand.strip() if payload.brand else (seller.get("shop_name") or "Nari Pehnawa"),
        "seller_price": seller_payout,
        "delivery_charge": shipping_fee,
        "rto_charge": rto_fee,
        "handling_fee": extra_handling,
        "marketplace_breakdown": {
            "seller_payout": seller_payout,
            "forward_shipping": shipping_fee,
            "rto_protection": rto_fee,
            "packaging_and_handling": extra_handling,
            "total_markup": round(shipping_fee + rto_fee + extra_handling, 2),
        },
        "price": curr_price,
        "original_price": orig_price,
        "discount_price": curr_price if curr_price < orig_price else None,
        "discount": discount,
        "image": main_image,
        "image_url": main_image,
        "images": all_images,
        "category": payload.category.strip(),
        "sub_category": payload.sub_category.strip() if payload.sub_category else "",
        "description": payload.description or "",
        "highlights": [
            f"100% Genuine Ethnic Wear from {seller.get('shop_name')}",
            "Packed securely in official Nari Pehnawa packaging",
            "Dispatched within 24-48 business hours",
        ],
        "sizes": parsed_sizes,
        "size_stock": size_stock_map,
        "stock": total_qty,
        "stock_quantity": total_qty,
        "in_stock": total_qty > 0,
        "is_active": False,  # Kept inactive until Admin approval
        "is_approved": False,
        "approval_status": "pending",  # pending | approved | rejected
        "approval_remarks": "Awaiting Admin Verification (24-48 business hours)",
        "fabric": payload.fabric,
        "color": payload.color,
        "pattern": payload.pattern,
        "sleeve_type": payload.sleeve_type,
        "occasion": payload.occasion or "Festive & Party",
        "wash_care": payload.wash_care or "Dry Clean Recommended",
        "tags": payload.tags or [],
        "is_returnable": True,
        "return_policy": "Easy 15-Day Returns",
        "seller_id": str(seller["_id"]),
        "seller_name": seller.get("shop_name"),
        "seller_city": seller.get("city"),
        "created_at": now,
        "updated_at": now,
    }

    res = db["products"].insert_one(prod_doc)
    prod_id = str(res.inserted_id)
    prod_doc["id"] = prod_id

    # Invalidate public products cache
    try:
        clear_api_cache()
    except Exception:
        pass

    return {
        "message": f"Product '{payload.name}' submitted successfully! It is under review and will go live once verified by Admin.",
        "product": serialize_doc(prod_doc),
    }


@router.put("/products/{product_id}")
def update_seller_product(
    product_id: str,
    payload: SellerProductUpdateRequest,
    current_user: dict = Depends(require_seller),
):
    """Seller updates their own existing product."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID.")

    db = get_database()
    prod = db["products"].find_one({
        "_id": ObjectId(product_id),
        "seller_id": current_user["id"],
    })
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found or unauthorized.")

    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc)

    if "sizes" in update_fields and isinstance(update_fields["sizes"], list):
        parsed_sizes = []
        size_stock_map = update_fields.get("size_stock") or {}
        for s in update_fields["sizes"]:
            if isinstance(s, dict):
                sz_name = str(s.get("size", "")).strip()
                sz_qty = int(s.get("stock", 0))
                if sz_name:
                    parsed_sizes.append(sz_name)
                    size_stock_map[sz_name] = sz_qty
            elif isinstance(s, str) and s.strip():
                parsed_sizes.append(s.strip())
        if parsed_sizes:
            update_fields["sizes"] = parsed_sizes
            update_fields["size_stock"] = size_stock_map
            if size_stock_map:
                update_fields["stock"] = sum(size_stock_map.values())
                update_fields["stock_quantity"] = sum(size_stock_map.values())
                update_fields["in_stock"] = update_fields["stock"] > 0

    if "stock_quantity" in update_fields:
        update_fields["in_stock"] = int(update_fields["stock_quantity"]) > 0

    if any(k in update_fields for k in ["seller_price", "delivery_charge", "rto_charge", "handling_fee"]):
        cur_seller_price = float(update_fields.get("seller_price", prod.get("seller_price", prod.get("price", 0))))
        cur_shipping = float(update_fields.get("delivery_charge", prod.get("delivery_charge", 50.0)))
        cur_rto = float(update_fields.get("rto_charge", prod.get("rto_charge", 35.0)))
        cur_handling = float(update_fields.get("handling_fee", prod.get("handling_fee", 10.0)))

        computed_price = round(cur_seller_price + cur_shipping + cur_rto + cur_handling, 2)
        if "price" not in update_fields:
            update_fields["price"] = computed_price

        update_fields["marketplace_breakdown"] = {
            "seller_payout": cur_seller_price,
            "forward_shipping": cur_shipping,
            "rto_protection": cur_rto,
            "packaging_and_handling": cur_handling,
            "total_markup": round(cur_shipping + cur_rto + cur_handling, 2),
        }

    db["products"].update_one({"_id": ObjectId(product_id)}, {"$set": update_fields})

    try:
        clear_api_cache()
    except Exception:
        pass

    updated = db["products"].find_one({"_id": ObjectId(product_id)})
    return {"message": "Product updated successfully.", "product": serialize_doc(updated)}


@router.delete("/products/{product_id}")
def delete_seller_product(
    product_id: str,
    current_user: dict = Depends(require_seller),
):
    """Seller deletes their own product."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID.")

    db = get_database()
    res = db["products"].delete_one({
        "_id": ObjectId(product_id),
        "seller_id": current_user["id"],
    })
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found or unauthorized.")

    try:
        clear_api_cache()
    except Exception:
        pass

    return {"message": "Product deleted successfully from storefront."}


@router.get("/categories")
def get_categories_for_seller():
    """List of active categories available for sellers to select."""
    db = get_database()
    cats = list(db["categories"].find({"is_active": {"$ne": False}}, {"name": 1, "image": 1}))
    return [{"name": c.get("name"), "image": c.get("image")} for c in cats if c.get("name")]


@router.get("/brands")
def get_brands_for_seller():
    """List of available brands, with Nari Pehnawa as the premier brand."""
    db = get_database()
    brands = list(db["brands"].find({}, {"name": 1, "logo": 1}))
    names = ["Nari Pehnawa"] + [b["name"] for b in brands if b.get("name") and b["name"] != "Nari Pehnawa"]
    return names


# ── Seller Support Inquiries (24-48hr SLA) ────────────────────────────────────

@router.get("/inquiries")
def list_seller_inquiries(current_user: dict = Depends(require_seller)):
    """List all inquiries raised by this seller to Nari Pehnawa Admin."""
    db = get_database()
    inquiries = list(db["seller_inquiries"].find({"seller_id": current_user["id"]}).sort("created_at", -1))
    return [serialize_doc(i) for i in inquiries]


@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
def create_seller_inquiry(
    payload: SellerInquiryCreateRequest,
    current_user: dict = Depends(require_seller),
):
    """
    Seller raises a direct support inquiry/ticket to Admin.
    Promised response SLA: Under 24 to 48 Hours.
    """
    db = get_database()
    seller = db["sellers"].find_one({"_id": ObjectId(current_user["id"])})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    now = datetime.now(timezone.utc)
    inquiry_doc = {
        "seller_id": str(seller["_id"]),
        "seller_name": seller.get("shop_name"),
        "seller_contact_person": seller.get("name"),
        "seller_email": seller.get("email"),
        "seller_phone": seller.get("phone"),
        "category": payload.category,  # category_request | packaging_request | kyc_query | payment | general
        "subject": payload.subject.strip(),
        "message": payload.message.strip(),
        "status": "open",  # open | in_progress | resolved
        "admin_reply": None,
        "replied_at": None,
        "replied_by": None,
        "sla_target": "24 to 48 Hours",
        "created_at": now,
        "updated_at": now,
    }

    res = db["seller_inquiries"].insert_one(inquiry_doc)
    inquiry_doc["id"] = str(res.inserted_id)

    return {
        "message": "Your inquiry has been submitted to Nari Pehnawa Admin. We will respond within 24 to 48 hours.",
        "inquiry": serialize_doc(inquiry_doc),
    }


# ── 3. Admin Management Endpoints for Sellers (Admin Panel) ───────────────────

@router.get("/admin/sellers")
def admin_list_sellers(
    current_user: dict = Depends(require_admin),
    kyc_status: Optional[str] = None,
    search: Optional[str] = None,
):
    """Admin: List all registered sellers with KYC and products overview."""
    db = get_database()
    query = {}
    if kyc_status and kyc_status != "all":
        query["kyc_status"] = kyc_status
    if search:
        query["$or"] = [
            {"shop_name": {"$regex": search.strip(), "$options": "i"}},
            {"name": {"$regex": search.strip(), "$options": "i"}},
            {"email": {"$regex": search.strip(), "$options": "i"}},
            {"phone": {"$regex": search.strip(), "$options": "i"}},
        ]

    sellers = list(db["sellers"].find(query).sort("created_at", -1))
    results = []
    for s in sellers:
        sid = str(s["_id"])
        prod_count = db["products"].count_documents({"seller_id": sid})
        item = serialize_doc(s)
        item["products_count"] = prod_count
        results.append(item)
    return results


@router.get("/admin/sellers/{seller_id}")
def admin_get_seller_detail(seller_id: str, current_user: dict = Depends(require_admin)):
    """Admin: Get detailed profile of a specific seller including all their products."""
    if not ObjectId.is_valid(seller_id):
        raise HTTPException(status_code=400, detail="Invalid seller ID.")

    db = get_database()
    seller = db["sellers"].find_one({"_id": ObjectId(seller_id)})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    products = list(db["products"].find({"seller_id": seller_id}).sort("created_at", -1).limit(50))
    inquiries = list(db["seller_inquiries"].find({"seller_id": seller_id}).sort("created_at", -1))

    return {
        "seller": serialize_doc(seller),
        "products": [serialize_doc(p) for p in products],
        "inquiries": [serialize_doc(i) for i in inquiries],
    }


@router.put("/admin/sellers/{seller_id}/kyc")
def admin_update_seller_kyc(
    seller_id: str,
    payload: AdminKYCUpdateRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin approves or rejects seller KYC verification."""
    if not ObjectId.is_valid(seller_id):
        raise HTTPException(status_code=400, detail="Invalid seller ID.")

    db = get_database()
    seller = db["sellers"].find_one({"_id": ObjectId(seller_id)})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    remarks = payload.kyc_remarks or (
        "Congratulations! Your KYC documents have been verified and approved by Nari Pehnawa."
        if payload.kyc_status == "approved"
        else "KYC verification failed. Please review your business details and re-submit."
    )

    update_dict = {
        "kyc_status": payload.kyc_status,
        "kyc_remarks": remarks,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.welcome_kit_status is not None:
        update_dict["welcome_kit_status"] = payload.welcome_kit_status
    if payload.welcome_kit_awb is not None:
        update_dict["welcome_kit_awb"] = payload.welcome_kit_awb
    if payload.welcome_kit_notes is not None:
        update_dict["welcome_kit_notes"] = payload.welcome_kit_notes

    db["sellers"].update_one(
        {"_id": ObjectId(seller_id)},
        {"$set": update_dict},
    )
    return {"message": f"Seller KYC status updated to '{payload.kyc_status}'.", "kyc_status": payload.kyc_status}


@router.put("/admin/sellers/{seller_id}/status")
def admin_update_seller_status(
    seller_id: str,
    payload: AdminStatusUpdateRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: Activate or Suspend seller account."""
    if not ObjectId.is_valid(seller_id):
        raise HTTPException(status_code=400, detail="Invalid seller ID.")

    db = get_database()
    res = db["sellers"].update_one(
        {"_id": ObjectId(seller_id)},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc)}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Seller not found.")

    return {"message": f"Seller account status updated to '{payload.status}'."}


@router.get("/admin/inquiries")
def admin_list_seller_inquiries(
    current_user: dict = Depends(require_admin),
    status: Optional[str] = None,
    category: Optional[str] = None,
):
    """Admin: View all seller support tickets and category/packaging inquiries."""
    db = get_database()
    query = {}
    if status and status != "all":
        query["status"] = status
    if category and category != "all":
        query["category"] = category

    inquiries = list(db["seller_inquiries"].find(query).sort("created_at", -1))
    return [serialize_doc(i) for i in inquiries]


@router.post("/admin/inquiries/{inquiry_id}/reply")
def admin_reply_to_seller_inquiry(
    inquiry_id: str,
    payload: AdminInquiryReplyRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin responds to seller inquiry. Seller sees reply directly in their dashboard."""
    if not ObjectId.is_valid(inquiry_id):
        raise HTTPException(status_code=400, detail="Invalid inquiry ID.")

    db = get_database()
    now = datetime.now(timezone.utc)
    admin_name = current_user.get("email") or "Nari Pehnawa Merchant Support"

    res = db["seller_inquiries"].update_one(
        {"_id": ObjectId(inquiry_id)},
        {
            "$set": {
                "admin_reply": payload.reply_message.strip(),
                "replied_at": now,
                "replied_by": admin_name,
                "status": payload.new_status or "resolved",
                "updated_at": now,
            }
        },
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found.")

    return {"message": "Reply sent successfully to seller."}


@router.get("/admin/products")
def admin_list_seller_products(
    current_user: dict = Depends(require_admin),
    approval_status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """Admin: View seller products pending review or approved/rejected."""
    db = get_database()
    query = {"seller_id": {"$exists": True, "$ne": None}}
    if approval_status and approval_status != "all":
        query["approval_status"] = approval_status

    total = db["products"].count_documents(query)
    prods = list(db["products"].find(query).sort("created_at", -1).skip(skip).limit(limit))
    return {
        "products": [serialize_doc(p) for p in prods],
        "total": total,
    }


@router.put("/admin/products/{product_id}/approval")
def admin_approve_reject_seller_product(
    product_id: str,
    payload: AdminProductApprovalRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin approves or rejects seller product before it goes live."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID.")

    db = get_database()
    now = datetime.now(timezone.utc)
    admin_email = current_user.get("email") or "Admin"

    is_approved = (payload.status == "approved")
    update_doc = {
        "approval_status": payload.status,
        "is_approved": is_approved,
        "is_active": is_approved,
        "approval_remarks": payload.remarks or ("Approved by Admin" if is_approved else "Rejected by Admin"),
        "reviewed_at": now,
        "reviewed_by": admin_email,
        "updated_at": now,
    }

    res = db["products"].update_one({"_id": ObjectId(product_id)}, {"$set": update_doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")

    try:
        clear_api_cache()
    except Exception:
        pass

    return {
        "message": f"Product has been {payload.status}.",
        "is_approved": is_approved,
        "is_active": is_approved,
    }


class MarketplaceSettingsRequest(BaseModel):
    global_commission_rate: float = Field(default=10.0, ge=0.0, le=100.0)
    settlement_days: int = Field(default=7, ge=1, le=60)
    min_payout: float = Field(default=500.0, ge=0.0)
    shipping_fee_default: float = Field(default=50.0, ge=0.0)
    rto_fee_default: float = Field(default=35.0, ge=0.0)
    handling_fee_default: float = Field(default=10.0, ge=0.0)


@router.get("/admin/marketplace-settings")
def get_marketplace_settings(current_user: dict = Depends(require_admin)):
    """Fetch global marketplace commission, settlement, and fee settings."""
    db = get_database()
    settings = db["marketplace_settings"].find_one({"key": "global_config"})
    if not settings:
        settings = {
            "key": "global_config",
            "global_commission_rate": 10.0,
            "settlement_days": 7,
            "min_payout": 500.0,
            "shipping_fee_default": 50.0,
            "rto_fee_default": 35.0,
            "handling_fee_default": 10.0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        db["marketplace_settings"].insert_one(settings)
    return serialize_doc(settings)


@router.put("/admin/marketplace-settings")
def update_marketplace_settings(
    payload: MarketplaceSettingsRequest,
    current_user: dict = Depends(require_admin),
):
    """Update global marketplace commission and settlement rules."""
    db = get_database()
    now = datetime.now(timezone.utc)
    update_doc = {
        "global_commission_rate": float(payload.global_commission_rate),
        "settlement_days": int(payload.settlement_days),
        "min_payout": float(payload.min_payout),
        "shipping_fee_default": float(payload.shipping_fee_default),
        "rto_fee_default": float(payload.rto_fee_default),
        "handling_fee_default": float(payload.handling_fee_default),
        "updated_at": now.isoformat(),
        "updated_by": current_user.get("email") or "Admin",
    }
    db["marketplace_settings"].update_one(
        {"key": "global_config"},
        {"$set": update_doc},
        upsert=True,
    )
    return {"message": "Marketplace settings updated successfully.", "settings": update_doc}

