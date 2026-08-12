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
    subject: Optional[str] = "General Inquiry"
    message: str = Field(..., min_length=5, description="Inquiry details")

class InquiryStatusUpdate(BaseModel):
    status: str = Field(..., description="Status: Pending, Contacted, Resolved")

class InquiryReply(BaseModel):
    reply_message: str = Field(..., min_length=2, description="Admin reply message")
    status: Optional[str] = "Resolved"

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_inquiry(payload: InquiryCreate):
    """Public API for customers to submit inquiries / callback requests"""
    try:
        db = get_database()
        inquiry_doc = {
            "id": f"INQ-{uuid.uuid4().hex[:8].upper()}",
            "name": payload.name.strip(),
            "phone": payload.phone.strip(),
            "email": str(payload.email).strip() if payload.email else "",
            "subject": payload.subject.strip() if payload.subject else "General Inquiry",
            "message": payload.message.strip(),
            "status": "Pending",
            "reply_message": "",
            "replied_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        db.customer_inquiries.insert_one(inquiry_doc)
        if "_id" in inquiry_doc:
            del inquiry_doc["_id"]
        return {"success": True, "message": "Inquiry submitted successfully", "data": inquiry_doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit inquiry: {str(e)}")

@router.get("/")
async def list_inquiries(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    """Admin API to list customer inquiries"""
    try:
        db = get_database()
        query = {}
        if status_filter and status_filter.strip() and status_filter.lower() != "all":
            query["status"] = status_filter.strip()
        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"name": {"$regex": s, "$options": "i"}},
                {"phone": {"$regex": s, "$options": "i"}},
                {"email": {"$regex": s, "$options": "i"}},
                {"subject": {"$regex": s, "$options": "i"}},
                {"message": {"$regex": s, "$options": "i"}}
            ]
        
        cursor = db.customer_inquiries.find(query).sort("created_at", -1).limit(limit)
        inquiries = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            inquiries.append(doc)
        return inquiries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")

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

@router.patch("/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, payload: InquiryStatusUpdate):
    """Admin API to update inquiry status"""
    try:
        db = get_database()
        result = db.customer_inquiries.update_one(
            {"id": inquiry_id},
            {"$set": {
                "status": payload.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        return {"success": True, "message": "Inquiry status updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

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
