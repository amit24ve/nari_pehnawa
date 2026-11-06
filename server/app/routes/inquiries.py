from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from app.database import get_database

router = APIRouter(prefix="/inquiries", tags=["Inquiries"])

class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Customer name")
    phone: str = Field(..., min_length=10, description="Customer mobile number")
    email: Optional[EmailStr] = None
    subject: Optional[str] = "Customization Inquiry"
    message: Optional[str] = ""
    inquiry_type: Optional[str] = "customization"  # "general", "reseller", "customization"
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price: Optional[float] = None
    customization_type: Optional[str] = "Top & Bottom"  # "Top", "Bottom", "Top & Bottom"
    custom_size: Optional[str] = None
    custom_color: Optional[str] = None
    reseller_type: Optional[str] = None
    custom_type: Optional[str] = None  # "top_only", "bottom_only", "complete_set"
    
    # ── Top Measurements (Inches) ──
    shoulder: Optional[str] = None
    bust: Optional[str] = None
    upper_bust: Optional[str] = None
    waist: Optional[str] = None
    hip: Optional[str] = None
    armhole: Optional[str] = None
    sleeve_length: Optional[str] = None
    sleeve_opening: Optional[str] = None
    kurti_length: Optional[str] = None
    front_neck_depth: Optional[str] = None
    back_neck_depth: Optional[str] = None

    # Legacy Top fields (for backward compatibility)
    height: Optional[str] = None
    bust_size: Optional[str] = None
    cup_size: Optional[str] = None
    waist_size: Optional[str] = None
    hip_size: Optional[str] = None
    sleeve_type: Optional[str] = None
    neck_design: Optional[str] = None
    dress_length: Optional[str] = None

    # ── Bottom Measurements (Inches) ──
    bottom_waist: Optional[str] = None
    bottom_hip: Optional[str] = None
    thigh: Optional[str] = None
    knee: Optional[str] = None
    calf: Optional[str] = None
    bottom_opening: Optional[str] = None
    rise: Optional[str] = None
    inseam_length: Optional[str] = None
    outseam_length: Optional[str] = None
    bottom_length: Optional[str] = None
    bottom_style: Optional[str] = None
    fit_preference: Optional[str] = None

    # ── Customer Address & Instructions ──
    additional_instructions: Optional[str] = None
    delivery_address: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_pincode: Optional[str] = None
    shipping_landmark: Optional[str] = None
    shipping_full_address: Optional[str] = None

    # Payment / User Tracking (Optional)
    advance_amount: Optional[float] = None
    remaining_amount: Optional[float] = None
    advance_paid: Optional[bool] = False
    payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    user_id: Optional[str] = None


class NewsletterSubscribe(BaseModel):
    email: EmailStr


class InquiryStatusUpdate(BaseModel):
    status: str = Field(..., description="Status: New, Under Review, Measurement Verification, Quotation Sent, Awaiting Customer Confirmation, Approved, In Production, Completed, Rejected")


class InquiryNotesUpdate(BaseModel):
    internal_notes: str = Field(..., description="Admin internal notes")


class InquiryReply(BaseModel):
    reply_message: str = Field(..., min_length=2, description="Admin reply message")
    status: Optional[str] = "Resolved"


@router.post("/subscribe", status_code=201)
async def subscribe_newsletter(payload: NewsletterSubscribe):
    """Subscribe a new email address to the newsletter"""
    try:
        db = get_database()
        email_clean = payload.email.strip().lower()
        exists = db.newsletter_subscribers.find_one({"email": email_clean})
        if exists:
            return {"success": True, "message": "Already subscribed"}
        
        db.newsletter_subscribers.insert_one({
            "email": email_clean,
            "subscribed_at": datetime.now(timezone.utc).isoformat()
        })
        return {"success": True, "message": "Subscribed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription failed: {str(e)}")


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_inquiry(payload: InquiryCreate):
    """Public API for customers to submit customization requests and inquiries"""
    try:
        db = get_database()
        inq_type = (payload.inquiry_type or "customization").strip().lower()
        subj_lower = (payload.subject or "").lower()
        if "reseller" in subj_lower:
            inq_type = "reseller"
        elif "custom" in subj_lower:
            inq_type = "customization"

        # Unique inquiry ID with official NP- prefix
        generated_id = f"NP-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Construct full address
        full_addr = (
            payload.delivery_address or
            payload.shipping_full_address or
            f"{payload.shipping_address or ''}, {payload.shipping_city or ''}, {payload.shipping_state or ''} {payload.shipping_pincode or ''}".strip(", ")
        ).strip()

        # Default initial status
        initial_status = "Advance Paid" if payload.advance_paid else "New"

        inquiry_doc = {
            "id": generated_id,
            "name": payload.name.strip(),
            "phone": payload.phone.strip(),
            "email": str(payload.email).strip() if payload.email else "",
            "subject": payload.subject.strip() if payload.subject else ("Become a Reseller" if inq_type == "reseller" else f"Custom Outfit: {payload.product_name or 'Bespoke Order'}"),
            "message": (payload.message or payload.additional_instructions or "Customization request submitted").strip(),
            "additional_instructions": (payload.additional_instructions or payload.message or "").strip(),
            "inquiry_type": inq_type,
            "product_id": payload.product_id or "",
            "product_name": payload.product_name or "",
            "product_image": payload.product_image or "",
            "product_price": payload.product_price,
            "customization_type": payload.customization_type or "Top & Bottom",
            "custom_size": payload.custom_size or "",
            "custom_color": payload.custom_color or "",
            "reseller_type": payload.reseller_type or "",
            "custom_type": payload.custom_type or "",

            # ── Top Measurements (Inches) ──
            "shoulder": payload.shoulder or "",
            "bust": payload.bust or payload.bust_size or "",
            "upper_bust": payload.upper_bust or "",
            "waist": payload.waist or payload.waist_size or "",
            "hip": payload.hip or payload.hip_size or "",
            "armhole": payload.armhole or "",
            "sleeve_length": payload.sleeve_length or "",
            "sleeve_opening": payload.sleeve_opening or "",
            "kurti_length": payload.kurti_length or payload.dress_length or "",
            "front_neck_depth": payload.front_neck_depth or "",
            "back_neck_depth": payload.back_neck_depth or "",

            # Legacy compatibility
            "height": payload.height or "",
            "bust_size": payload.bust_size or payload.bust or "",
            "cup_size": payload.cup_size or "",
            "waist_size": payload.waist_size or payload.waist or "",
            "hip_size": payload.hip_size or payload.hip or "",
            "sleeve_type": payload.sleeve_type or "",
            "neck_design": payload.neck_design or "",
            "dress_length": payload.dress_length or payload.kurti_length or "",

            # ── Bottom Measurements (Inches) ──
            "bottom_waist": payload.bottom_waist or payload.waist or "",
            "bottom_hip": payload.bottom_hip or payload.hip or "",
            "thigh": payload.thigh or "",
            "knee": payload.knee or "",
            "calf": payload.calf or "",
            "bottom_opening": payload.bottom_opening or "",
            "rise": payload.rise or "",
            "inseam_length": payload.inseam_length or "",
            "outseam_length": payload.outseam_length or "",
            "bottom_length": payload.bottom_length or "",
            "bottom_style": payload.bottom_style or "",
            "fit_preference": payload.fit_preference or "",

            # ── Customer Address & Tracking ──
            "delivery_address": full_addr,
            "shipping_address": payload.shipping_address or full_addr,
            "shipping_city": payload.shipping_city or "",
            "shipping_state": payload.shipping_state or "",
            "shipping_pincode": payload.shipping_pincode or "",
            "shipping_landmark": payload.shipping_landmark or "",
            "shipping_full_address": full_addr,

            # Payment / Order Tracking
            "advance_amount": payload.advance_amount,
            "remaining_amount": payload.remaining_amount,
            "advance_paid": bool(payload.advance_paid),
            "payment_id": payload.payment_id or "",
            "payment_method": payload.payment_method or "",
            "user_id": payload.user_id or "",

            # Admin Management
            "status": initial_status,
            "internal_notes": "",
            "status_history": [
                {
                    "status": initial_status,
                    "timestamp": now_iso,
                    "note": "Inquiry submitted by customer"
                }
            ],
            "reply_message": "",
            "replied_at": None,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        db.customer_inquiries.insert_one(inquiry_doc)

        # Generate an admin notification for the new inquiry
        try:
            db.admin_notifications.insert_one({
                "type": "customization_inquiry" if inq_type == "customization" else "customer_inquiry",
                "inquiry_id": generated_id,
                "title": f"New Customization Request: {payload.name.strip()}",
                "message": f"{payload.name.strip()} requested custom outfit for {payload.product_name or 'Product'} (ID: {generated_id})",
                "customer_name": payload.name.strip(),
                "customer_phone": payload.phone.strip(),
                "product_name": payload.product_name or "",
                "read": False,
                "created_at": now_iso
            })
        except Exception:
            pass

        if "_id" in inquiry_doc:
            del inquiry_doc["_id"]

        return {
            "success": True,
            "message": "Your customization request has been submitted successfully!",
            "inquiry_id": generated_id,
            "data": inquiry_doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit inquiry: {str(e)}")


@router.get("/")
async def list_inquiries(
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None),
    limit: int = Query(250, ge=1, le=500)
):
    """Admin API to list customer and customization inquiries"""
    try:
        db = get_database()
        query = {}
        if status_filter and status_filter.strip() and status_filter.lower() != "all":
            query["status"] = status_filter.strip()
        if type_filter and type_filter.strip() and type_filter.lower() != "all":
            query["inquiry_type"] = type_filter.strip()
        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"id": {"$regex": s, "$options": "i"}},
                {"name": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"subject": {"$regex": s, "$options": "i"}},
                {"message": {"$regex": s, "$options": "i"}},
                {"product_name": {"$regex": s, "$options": "i"}},
                {"delivery_address": {"$regex": s, "$options": "i"}}
            ]
        
        cursor = db.customer_inquiries.find(query).sort("created_at", -1).limit(limit)
        inquiries = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            inquiries.append(doc)
        return inquiries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")


@router.patch("/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, payload: InquiryStatusUpdate):
    """Admin API to update inquiry status with audit history"""
    try:
        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        history_entry = {
            "status": payload.status,
            "timestamp": now_iso,
            "note": f"Status updated to {payload.status}"
        }

        result = db.customer_inquiries.update_one(
            {"id": inquiry_id},
            {
                "$set": {
                    "status": payload.status,
                    "updated_at": now_iso
                },
                "$push": {
                    "status_history": history_entry
                }
            }
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        return {"success": True, "message": f"Inquiry status updated to {payload.status}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


@router.patch("/{inquiry_id}/notes")
async def update_inquiry_notes(inquiry_id: str, payload: InquiryNotesUpdate):
    """Admin API to add/update internal notes for an inquiry"""
    try:
        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        result = db.customer_inquiries.update_one(
            {"id": inquiry_id},
            {
                "$set": {
                    "internal_notes": payload.internal_notes.strip(),
                    "updated_at": now_iso
                }
            }
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        return {"success": True, "message": "Internal notes updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update notes: {str(e)}")


@router.post("/{inquiry_id}/reply")
async def reply_inquiry(inquiry_id: str, payload: InquiryReply):
    """Admin API to reply to customer inquiry and update status"""
    try:
        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        new_status = payload.status if payload.status else "Resolved"

        result = db.customer_inquiries.update_one(
            {"id": inquiry_id},
            {"$set": {
                "reply_message": payload.reply_message.strip(),
                "replied_at": now_iso,
                "status": new_status,
                "updated_at": now_iso
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        updated_doc = db.customer_inquiries.find_one({"id": inquiry_id}, {"_id": 0})
        return {"success": True, "message": "Reply saved successfully", "data": updated_doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save reply: {str(e)}")


@router.delete("/{inquiry_id}")
async def delete_inquiry(inquiry_id: str):
    """Admin API to delete inquiry"""
    try:
        db = get_database()
        result = db.customer_inquiries.delete_one({"id": inquiry_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        return {"success": True, "message": "Inquiry deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete inquiry: {str(e)}")
