from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response

from app.database import get_database
from app.security import get_current_user, require_admin
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def _load_order_or_404(db, order_id: str) -> dict:
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order_id")
    order = db["orders"].find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _ensure_invoice_record(db, order: dict) -> str:
    """Idempotently creates/looks up the `invoices` collection entry for an
    order and returns its invoice_number. Keeping a persisted invoices
    collection (rather than generating a random number every download)
    means the same order always gets the same invoice number, which is
    required for GST record-keeping."""
    order_id = str(order["_id"])
    existing = db["invoices"].find_one({"order_id": order_id})
    if existing:
        return existing["invoice_number"]

    invoice_number = f"INV-{order.get('order_number', order_id[-8:])}"
    db["invoices"].insert_one(
        {
            "order_id": order_id,
            "order_number": order.get("order_number"),
            "invoice_number": invoice_number,
            "user_id": order.get("user_id"),
            "total_amount": order.get("total_amount"),
            "created_at": datetime.now(),
        }
    )
    return invoice_number


@router.get("/order/{order_id}/download")
def download_invoice(order_id: str, current_user: dict = Depends(get_current_user)):
    """
    Download the GST-ready PDF invoice for an order. Customers may only
    download their own order's invoice; admins may download any.
    """
    db = get_database()
    order = _load_order_or_404(db, order_id)

    if current_user.get("role") != "admin" and str(order.get("user_id")) != str(
        current_user.get("id")
    ):
        raise HTTPException(status_code=403, detail="Not authorised to view this invoice")

    invoice_number = _ensure_invoice_record(db, order)

    service = InvoiceService()
    pdf_bytes = service.generate_invoice_pdf(order, invoice_number)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{invoice_number}.pdf"'
        },
    )


@router.get("/admin/order/{order_id}")
def admin_get_invoice(order_id: str, current_user: dict = Depends(require_admin)):
    """Admin: fetch invoice metadata (number, totals) without downloading
    the PDF — used by the admin order list to show whether an invoice has
    already been generated for an order."""
    db = get_database()
    order = _load_order_or_404(db, order_id)
    invoice_number = _ensure_invoice_record(db, order)
    record = db["invoices"].find_one({"order_id": order_id})
    record["_id"] = str(record["_id"])
    return record
