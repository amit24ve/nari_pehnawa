"""
InvoiceService — generates a GST-ready PDF invoice for a completed order.

Uses reportlab (pure-Python, no external binary dependency like
wkhtmltopdf/weasyprint's native libs) to draw a proper tax invoice: seller
details incl. GSTIN, buyer/shipping address, itemised HSN + tax breakdown,
and totals. The generated PDF bytes are handed back to the route, which
either streams them directly or (optionally) persists a reference in the
`invoices` collection for the admin invoice list.

Tax model: this store currently stores a single `tax` amount per order
(see OrderBase.tax in app/database/schemas/order.py) rather than per-line
CGST/SGST/IGST — so the invoice shows a single "Tax" line using
`invoice_tax_percent` from config as the effective rate label, applied
proportionally per item for the itemised breakdown. If you later capture
tax per item, swap `_compute_item_tax` for the real stored value with no
other changes needed.
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

from app.config import (
    company_address,
    company_gstin,
    company_name,
    company_state,
    company_support_email,
    company_support_phone,
    invoice_tax_percent,
)


class InvoiceService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._title_style = ParagraphStyle(
            "InvoiceTitle", parent=self.styles["Title"], fontSize=18, spaceAfter=2
        )
        self._small = ParagraphStyle(
            "Small", parent=self.styles["Normal"], fontSize=8, leading=11
        )
        self._label = ParagraphStyle(
            "Label", parent=self.styles["Normal"], fontSize=9, textColor=colors.HexColor("#555555")
        )

    # ── public API ───────────────────────────────────────────────────────

    def generate_invoice_pdf(self, order: dict, invoice_number: Optional[str] = None) -> bytes:
        """
        `order` is the raw order dict as stored in MongoDB (with `items`,
        `shipping_address`, `subtotal`, `discount`, `shipping_cost`,
        `tax`, `total_amount`, `order_number`, `created_at`, `payment_method`).
        Returns the PDF as raw bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=16 * mm,
            bottomMargin=16 * mm,
            title=f"Invoice {order.get('order_number', '')}",
        )

        elements = []
        elements.extend(self._build_header(order, invoice_number))
        elements.append(Spacer(1, 8 * mm))
        elements.extend(self._build_parties(order))
        elements.append(Spacer(1, 6 * mm))
        elements.extend(self._build_items_table(order))
        elements.append(Spacer(1, 4 * mm))
        elements.extend(self._build_totals(order))
        elements.append(Spacer(1, 8 * mm))
        elements.extend(self._build_footer())

        doc.build(elements)
        return buffer.getvalue()

    # ── sections ─────────────────────────────────────────────────────────

    def _build_header(self, order: dict, invoice_number: Optional[str]) -> list:
        created_at = order.get("created_at")
        if isinstance(created_at, datetime):
            date_str = created_at.strftime("%d %b %Y")
        else:
            date_str = datetime.now().strftime("%d %b %Y")

        inv_no = invoice_number or f"INV-{order.get('order_number', 'NA')}"

        header_table = Table(
            [
                [
                    Paragraph(f"<b>{company_name}</b>", self._title_style),
                    Paragraph("<b>TAX INVOICE</b>", self._title_style),
                ],
                [
                    Paragraph(company_address, self._small),
                    Paragraph(f"Invoice No: <b>{inv_no}</b>", self._small),
                ],
                [
                    Paragraph(
                        f"GSTIN: {company_gstin or 'Not Registered'}", self._small
                    ),
                    Paragraph(f"Invoice Date: {date_str}", self._small),
                ],
                [
                    Paragraph(
                        f"Support: {company_support_email} | {company_support_phone or '-'}",
                        self._small,
                    ),
                    Paragraph(f"Order No: {order.get('order_number', 'N/A')}", self._small),
                ],
            ],
            colWidths=[95 * mm, 75 * mm],
        )
        header_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        return [header_table]

    def _build_parties(self, order: dict) -> list:
        addr = order.get("shipping_address", {}) or {}
        if isinstance(addr, str):
            addr = {}

        bill_to_lines = [
            f"<b>{addr.get('full_name', order.get('customer_email', 'Customer'))}</b>",
            addr.get("address_line1", ""),
            addr.get("address_line2", ""),
            f"{addr.get('city', '')}, {addr.get('state', '')} - {addr.get('postal_code', '')}",
            addr.get("country", "India"),
            f"Phone: {addr.get('phone', 'N/A')}",
        ]
        bill_to_lines = [l for l in bill_to_lines if l]

        ship_to_para = Paragraph(
            "<b>Ship To / Bill To</b><br/>" + "<br/>".join(bill_to_lines), self._small
        )
        seller_para = Paragraph(
            f"<b>Sold By</b><br/>{company_name}<br/>{company_address}<br/>"
            f"State: {company_state}<br/>GSTIN: {company_gstin or 'Not Registered'}",
            self._small,
        )

        table = Table([[seller_para, ship_to_para]], colWidths=[85 * mm, 85 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        return [table]

    def _build_items_table(self, order: dict) -> list:
        items = order.get("items", []) or []
        subtotal = float(order.get("subtotal", 0) or 0)
        total_tax = float(order.get("tax", 0) or 0)

        header = ["#", "Item", "HSN", "Qty", "Unit Price (\u20b9)", "Tax (\u20b9)", "Amount (\u20b9)"]
        rows = [header]

        for idx, item in enumerate(items, start=1):
            qty = int(item.get("quantity", 1))
            price = float(item.get("price", 0) or 0)
            line_amount = float(item.get("total", price * qty))
            item_tax = self._compute_item_tax(line_amount, subtotal, total_tax)
            rows.append(
                [
                    str(idx),
                    Paragraph(
                        f"{item.get('product_name', 'Item')}"
                        + (f" (Size: {item.get('size')})" if item.get("size") else ""),
                        self._small,
                    ),
                    item.get("hsn_code", "-") or "-",
                    str(qty),
                    f"{price:,.2f}",
                    f"{item_tax:,.2f}",
                    f"{line_amount:,.2f}",
                ]
            )

        table = Table(
            rows,
            colWidths=[8 * mm, 65 * mm, 18 * mm, 12 * mm, 26 * mm, 22 * mm, 26 * mm],
            repeatRows=1,
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8B0000")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
                    ("ALIGN", (0, 0), (0, -1), "CENTER"),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#dddddd")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
                    ("PADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        return [table]

    def _build_totals(self, order: dict) -> list:
        subtotal = float(order.get("subtotal", 0) or 0)
        discount = float(order.get("discount", 0) or 0)
        shipping = float(order.get("shipping_cost", 0) or 0)
        tax = float(order.get("tax", 0) or 0)
        total = float(order.get("total_amount", subtotal - discount + shipping + tax))

        rows = [
            ["Subtotal", f"\u20b9 {subtotal:,.2f}"],
            ["Discount", f"- \u20b9 {discount:,.2f}"],
            ["Shipping", f"\u20b9 {shipping:,.2f}"],
            [f"Tax ({invoice_tax_percent:.0f}% GST)", f"\u20b9 {tax:,.2f}"],
            ["Total Payable", f"\u20b9 {total:,.2f}"],
        ]
        table = Table(rows, colWidths=[130 * mm, 40 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                    ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.HexColor("#8B0000")),
                    ("TOPPADDING", (0, -1), (-1, -1), 6),
                ]
            )
        )
        payment_line = Paragraph(
            f"Payment Method: <b>{order.get('payment_method', 'N/A')}</b> &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"Payment Status: <b>{order.get('payment_status', 'N/A')}</b>",
            self._label,
        )
        return [table, Spacer(1, 4 * mm), payment_line]

    def _build_footer(self) -> list:
        note = Paragraph(
            "This is a computer-generated invoice and does not require a physical signature. "
            "For any queries regarding this order, please contact our support team.",
            self._small,
        )
        return [note]

    # ── helpers ──────────────────────────────────────────────────────────

    def _compute_item_tax(self, line_amount: float, subtotal: float, total_tax: float) -> float:
        """Distributes the order-level tax amount proportionally across
        items by their share of the subtotal, so the itemised table sums
        back to the stored order.tax value exactly."""
        if subtotal <= 0 or total_tax <= 0:
            return 0.0
        return round(line_amount / subtotal * total_tax, 2)


def get_invoice_service() -> InvoiceService:
    return InvoiceService()
