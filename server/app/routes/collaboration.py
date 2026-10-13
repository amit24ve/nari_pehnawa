"""
Influencer Collaboration & Referral Tracking Routes for Nari Pehnawa.
Provides public tracking endpoints, private creator dashboard API (token-based),
and secured admin management endpoints.
"""

from datetime import datetime, timezone
import io
import csv
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from app.database import get_database
from app.security import require_admin
from app.services.collaboration_service import CollaborationService, is_collaboration_enabled

router = APIRouter(prefix="/collab", tags=["Influencer Collaboration"])


# ── Pydantic Request Models ──────────────────────────────────────────────────

class TrackClickRequest(BaseModel):
    referral_code: str
    visitor_id: Optional[str] = None
    landing_page: Optional[str] = None
    referrer: Optional[str] = None


class CreateCreatorRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    referral_code: str = Field(min_length=3, max_length=30)
    commission_rate: float = Field(default=10.0, ge=0.0, le=100.0)
    customer_discount_rate: float = Field(default=5.0, ge=0.0, le=100.0)
    commission_basis: str = Field(default="eligible_subtotal")
    email: Optional[str] = None
    phone: Optional[str] = None
    instagram_handle: Optional[str] = None
    notes: Optional[str] = None
    approved_products: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UpdateCreatorRequest(BaseModel):
    name: Optional[str] = None
    commission_rate: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    customer_discount_rate: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    commission_basis: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    instagram_handle: Optional[str] = None
    notes: Optional[str] = None
    approved_products: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str


class RecordPayoutRequest(BaseModel):
    creator_id: str
    amount: float = Field(gt=0.0)
    payment_method: str = "Bank Transfer"
    reference_id: Optional[str] = None
    notes: Optional[str] = None


# ── Public Tracking Endpoints ────────────────────────────────────────────────

@router.post("/track-click")
def track_referral_click(payload: TrackClickRequest, request: Request):
    """
    Public tracking endpoint called when a visitor enters via referral URL (?ref=CODE).
    Lightweight, rate-resilient, non-blocking.
    """
    db = get_database()
    service = CollaborationService(db)

    # Extract client IP and user agent safely
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
    user_agent = request.headers.get("user-agent")

    res = service.record_click(
        referral_code=payload.referral_code,
        visitor_id=payload.visitor_id,
        landing_page=payload.landing_page,
        referrer=payload.referrer,
        user_agent=user_agent,
        ip_address=client_ip,
    )
    return res


@router.get("/verify-ref/{code}")
def verify_referral_code(code: str):
    """Check if referral code is active (for frontend UX validation)."""
    db = get_database()
    if not is_collaboration_enabled(db):
        return {"valid": False, "message": "Collaboration module disabled"}

    service = CollaborationService(db)
    creator = service.get_creator_by_code(code)
    if not creator or creator.get("status") != "active":
        return {"valid": False, "message": "Invalid or inactive referral code"}

    now = datetime.now(timezone.utc)
    if creator.get("end_date") and now > creator["end_date"].replace(tzinfo=timezone.utc if creator["end_date"].tzinfo is None else creator["end_date"].tzinfo):
        return {"valid": False, "message": "Referral code has expired"}

    return {
        "valid": True,
        "referral_code": creator["referral_code"],
        "creator_name": creator.get("name"),
    }


# ── Private Creator Dashboard Endpoint (Token-Based, NO Login) ──────────────

@router.get("/dashboard/{token}")
def get_creator_dashboard(
    token: str,
    range_filter: Optional[str] = None,  # "today" | "7d" | "30d" | "all"
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Private, read-only creator dashboard data.
    Secured by cryptographically random token hash. Zero customer PII exposed.
    """
    db = get_database()
    service = CollaborationService(db)

    creator = service.get_creator_by_token(token)
    if not creator:
        raise HTTPException(status_code=404, detail="Invalid or revoked creator dashboard link.")

    # Calculate date range
    now = datetime.now(timezone.utc)
    start_filter = None
    end_filter = None

    if range_filter == "today":
        start_filter = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_filter == "7d":
        start_filter = now - (datetime.now() - datetime.now())  # 7 days
        from datetime import timedelta
        start_filter = now - timedelta(days=7)
    elif range_filter == "30d":
        from datetime import timedelta
        start_filter = now - timedelta(days=30)
    elif start_date:
        try:
            start_filter = datetime.fromisoformat(start_date)
            if end_date:
                end_filter = datetime.fromisoformat(end_date)
        except Exception:
            pass

    stats = service.get_creator_dashboard_stats(
        creator_id=creator["_id"],
        start_filter=start_filter,
        end_filter=end_filter,
    )
    return stats


# ── Secured Admin Management Endpoints ───────────────────────────────────────

@router.get("/admin/list")
def list_admin_collaborations(current_user: dict = Depends(require_admin)):
    """Admin: Get list of all collaborations with aggregated performance."""
    db = get_database()
    service = CollaborationService(db)
    service.ensure_indexes()
    return service.get_admin_collaborations_list()


@router.post("/admin/create", status_code=201)
def create_admin_collaboration(
    payload: CreateCreatorRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: Create a new creator collaboration."""
    db = get_database()
    service = CollaborationService(db)
    service.ensure_indexes()

    try:
        creator = service.create_creator(
            name=payload.name,
            referral_code=payload.referral_code,
            commission_rate=payload.commission_rate,
            customer_discount_rate=payload.customer_discount_rate,
            commission_basis=payload.commission_basis,
            email=payload.email,
            phone=payload.phone,
            instagram_handle=payload.instagram_handle,
            notes=payload.notes,
            approved_products=payload.approved_products,
            start_date=payload.start_date,
            end_date=payload.end_date,
            created_by=current_user.get("email") or current_user.get("id") or "admin",
        )
        return creator
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/{creator_id}")
def get_admin_collaboration_detail(
    creator_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin: Get full details, clicks, orders, ledger, and payouts for a creator."""
    db = get_database()
    service = CollaborationService(db)
    try:
        return service.get_admin_collaboration_detail(creator_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/admin/{creator_id}")
def update_admin_collaboration(
    creator_id: str,
    payload: UpdateCreatorRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: Update creator details or commission rate with audit log."""
    db = get_database()
    service = CollaborationService(db)
    try:
        return service.update_creator(
            creator_id=creator_id,
            update_data=payload.model_dump(exclude_unset=True),
            admin_user=current_user.get("email") or current_user.get("id") or "admin",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/admin/{creator_id}")
def delete_admin_collaboration(
    creator_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin: Permanently delete a collaboration."""
    db = get_database()
    service = CollaborationService(db)
    try:
        service.delete_creator(
            creator_id=creator_id,
            admin_user=current_user.get("email") or current_user.get("id") or "admin",
        )
        return {"status": "success", "message": "Collaboration deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/admin/{creator_id}/status")
def update_admin_collaboration_status(
    creator_id: str,
    payload: UpdateStatusRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: Pause, resume, revoke, or expire a collaboration."""
    db = get_database()
    service = CollaborationService(db)
    try:
        return service.update_creator_status(
            creator_id=creator_id,
            new_status=payload.status,
            admin_user=current_user.get("email") or current_user.get("id") or "admin",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/{creator_id}/regenerate-token")
def regenerate_creator_dashboard_token(
    creator_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin: Immediately revoke current token and generate a new secure dashboard link."""
    db = get_database()
    service = CollaborationService(db)
    try:
        new_token = service.regenerate_token(
            creator_id=creator_id,
            admin_user=current_user.get("email") or current_user.get("id") or "admin",
        )
        return {"raw_token": new_token, "message": "Token regenerated successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/payouts", status_code=201)
def record_creator_payout(
    payload: RecordPayoutRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: Record a commission payment made to a creator."""
    db = get_database()
    service = CollaborationService(db)
    try:
        res = service.record_payout(
            creator_id=payload.creator_id,
            amount=payload.amount,
            payment_method=payload.payment_method,
            reference_id=payload.reference_id,
            notes=payload.notes,
            admin_user=current_user.get("email") or current_user.get("id") or "admin",
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/reports/export-csv")
def export_collaborations_csv(current_user: dict = Depends(require_admin)):
    """Admin: Export complete collaboration financial and order report to CSV."""
    db = get_database()
    service = CollaborationService(db)
    creators = service.get_admin_collaborations_list()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Creator ID",
        "Creator Name",
        "Referral Code",
        "Instagram Handle",
        "Email",
        "Phone",
        "Commission Rate (%)",
        "Commission Basis",
        "Status",
        "Total Clicks",
        "Unique Visitors",
        "Attributed Orders",
        "Eligible Sales (INR)",
        "Commission Earned (INR)",
        "Commission Paid (INR)",
        "Outstanding Liability (INR)",
        "Created At",
    ])

    for c in creators:
        writer.writerow([
            c["id"],
            c.get("name", ""),
            c.get("referral_code", ""),
            c.get("instagram_handle", ""),
            c.get("email", ""),
            c.get("phone", ""),
            c.get("commission_rate", 10.0),
            c.get("commission_basis", ""),
            c.get("status", ""),
            c.get("clicks", 0),
            c.get("unique_visitors", 0),
            c.get("attributed_orders", 0),
            c.get("eligible_sales", 0.0),
            c.get("commission_earned", 0.0),
            c.get("commission_paid", 0.0),
            c.get("outstanding_liability", 0.0),
            str(c.get("created_at", "")),
        ])

    csv_data = output.getvalue()
    filename = f"nari_pehnawa_influencers_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/admin/products-picker")
def get_products_for_picker(current_user: dict = Depends(require_admin)):
    """Admin: Lightweight product list for promoting approved products in collaborations."""
    db = get_database()
    prods = list(db["products"].find({}, {"_id": 1, "name": 1, "price": 1, "image": 1, "category": 1}).sort("created_at", -1).limit(200))
    return [
        {
            "id": str(p["_id"]),
            "name": p.get("name"),
            "price": p.get("price"),
            "image": p.get("image"),
            "category": p.get("category"),
        }
        for p in prods
    ]
