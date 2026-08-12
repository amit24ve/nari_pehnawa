"""
NotificationService — sends order-lifecycle notifications over Email and
WhatsApp, and logs every attempt (sent / failed / skipped) to the
`notifications` collection for auditing and for an admin "notification
history" view.

Design notes:
  - If SMTP is not configured (config.smtp_host is empty), email sending is
    skipped gracefully — the attempt is still logged with
    status="skipped_no_config" so nothing silently disappears.
  - Same behaviour for WhatsApp if WHATSAPP_ACCESS_TOKEN is empty.
  - Sending never raises up into the caller. A notification failure must
    never break order placement / payment verification / shipment
    creation. Every send_* method catches its own exceptions and logs them.
  - Uses stdlib `smtplib` for email (no extra dependency) and `httpx` for
    the WhatsApp Cloud API call (already a project dependency, used by
    shiprocket_service.py).
"""

from __future__ import annotations

import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import httpx
from pymongo.database import Database

from app.config import (
    company_name,
    company_support_email,
    company_support_phone,
    smtp_from_email,
    smtp_from_name,
    smtp_host,
    smtp_password,
    smtp_port,
    smtp_use_tls,
    smtp_username,
    whatsapp_access_token,
    whatsapp_api_version,
    whatsapp_phone_number_id,
)
from app.database.schemas.notification import NotificationEvent


# ── Message templates ──────────────────────────────────────────────────────
# Keyed by NotificationEvent. `{}` placeholders filled via .format(**ctx).

_EMAIL_SUBJECTS = {
    NotificationEvent.ORDER_CONFIRMED: "Your order {order_number} is confirmed!",
    NotificationEvent.PAYMENT_SUCCESS: "Payment received for order {order_number}",
    NotificationEvent.PAYMENT_FAILED: "Payment failed for order {order_number}",
    NotificationEvent.ORDER_PACKED: "Your order {order_number} has been packed",
    NotificationEvent.ORDER_SHIPPED: "Your order {order_number} has shipped!",
    NotificationEvent.OUT_FOR_DELIVERY: "Your order {order_number} is out for delivery",
    NotificationEvent.ORDER_DELIVERED: "Your order {order_number} has been delivered",
    NotificationEvent.ORDER_CANCELLED: "Your order {order_number} has been cancelled",
    NotificationEvent.REFUND_INITIATED: "Refund initiated for order {order_number}",
    NotificationEvent.REFUND_COMPLETED: "Refund completed for order {order_number}",
    NotificationEvent.RETURN_APPROVED: "Your return for order {order_number} is approved",
    NotificationEvent.RETURN_REJECTED: "Update on your return for order {order_number}",
    NotificationEvent.EXCHANGE_APPROVED: "Your exchange for order {order_number} is approved",
}

_EMAIL_BODIES = {
    NotificationEvent.ORDER_CONFIRMED: (
        "Hi {customer_name},\n\nThank you for shopping with {company_name}! "
        "Your order {order_number} for \u20b9{amount} has been confirmed and is "
        "being prepared.\n\nWe'll notify you as soon as it ships.\n\n"
        "Need help? Reach us at {support_email}."
    ),
    NotificationEvent.PAYMENT_SUCCESS: (
        "Hi {customer_name},\n\nWe've received your payment of \u20b9{amount} for "
        "order {order_number}. Your order is now confirmed.\n\nThank you for "
        "shopping with {company_name}!"
    ),
    NotificationEvent.PAYMENT_FAILED: (
        "Hi {customer_name},\n\nUnfortunately your payment for order "
        "{order_number} could not be completed. No amount has been charged. "
        "Please try again or choose Cash on Delivery.\n\nNeed help? Reach us "
        "at {support_email}."
    ),
    NotificationEvent.ORDER_PACKED: (
        "Hi {customer_name},\n\nGreat news — your order {order_number} has "
        "been packed and will be handed to our courier partner soon."
    ),
    NotificationEvent.ORDER_SHIPPED: (
        "Hi {customer_name},\n\nYour order {order_number} has shipped via "
        "{courier_name}! Track it using AWB {awb}.\n\nTracking link: {tracking_url}"
    ),
    NotificationEvent.OUT_FOR_DELIVERY: (
        "Hi {customer_name},\n\nYour order {order_number} is out for delivery "
        "today. Please keep your phone handy for the courier's call."
    ),
    NotificationEvent.ORDER_DELIVERED: (
        "Hi {customer_name},\n\nYour order {order_number} has been delivered. "
        "We hope you love it! If anything's wrong, you can request a return "
        "or exchange from your account within our return window."
    ),
    NotificationEvent.ORDER_CANCELLED: (
        "Hi {customer_name},\n\nYour order {order_number} has been cancelled "
        "as requested. If you paid online, your refund of \u20b9{amount} will be "
        "processed within 5-7 business days."
    ),
    NotificationEvent.REFUND_INITIATED: (
        "Hi {customer_name},\n\nA refund of \u20b9{amount} has been initiated for "
        "order {order_number}. It should reflect in your original payment "
        "method within 5-7 business days."
    ),
    NotificationEvent.REFUND_COMPLETED: (
        "Hi {customer_name},\n\nYour refund of \u20b9{amount} for order "
        "{order_number} has been completed successfully."
    ),
    NotificationEvent.RETURN_APPROVED: (
        "Hi {customer_name},\n\nYour return request for order {order_number} "
        "has been approved. Our courier partner will pick up the item soon."
    ),
    NotificationEvent.RETURN_REJECTED: (
        "Hi {customer_name},\n\nWe've reviewed your return request for order "
        "{order_number}. Unfortunately it could not be approved.\nReason: "
        "{reason}\n\nNeed help? Reach us at {support_email}."
    ),
    NotificationEvent.EXCHANGE_APPROVED: (
        "Hi {customer_name},\n\nYour exchange request for order "
        "{order_number} has been approved. We'll arrange a pickup of the "
        "current item and ship your replacement soon."
    ),
}

_WHATSAPP_TEMPLATES = {
    NotificationEvent.ORDER_CONFIRMED: "Hi {customer_name}! Your {company_name} order {order_number} (\u20b9{amount}) is confirmed. Thank you for shopping with us!",
    NotificationEvent.PAYMENT_SUCCESS: "Payment of \u20b9{amount} received for order {order_number}. Your order is confirmed!",
    NotificationEvent.PAYMENT_FAILED: "Your payment for order {order_number} failed. No amount was charged. Please try again.",
    NotificationEvent.ORDER_PACKED: "Your order {order_number} has been packed and is ready to ship!",
    NotificationEvent.ORDER_SHIPPED: "Your order {order_number} has shipped via {courier_name}. Track: {tracking_url}",
    NotificationEvent.OUT_FOR_DELIVERY: "Your order {order_number} is out for delivery today!",
    NotificationEvent.ORDER_DELIVERED: "Your order {order_number} has been delivered. Enjoy your {company_name} purchase!",
    NotificationEvent.ORDER_CANCELLED: "Your order {order_number} has been cancelled. Refund (if applicable) will be processed shortly.",
    NotificationEvent.REFUND_INITIATED: "Refund of \u20b9{amount} initiated for order {order_number}.",
    NotificationEvent.REFUND_COMPLETED: "Refund of \u20b9{amount} completed for order {order_number}.",
    NotificationEvent.RETURN_APPROVED: "Your return for order {order_number} is approved. Pickup will be scheduled soon.",
    NotificationEvent.RETURN_REJECTED: "Update: your return for order {order_number} could not be approved. Reason: {reason}",
    NotificationEvent.EXCHANGE_APPROVED: "Your exchange for order {order_number} is approved.",
}


class NotificationService:
    def __init__(self, db: Database):
        self.notifications = db["notifications"]

    # ── logging ──────────────────────────────────────────────────────────

    def _log(
        self,
        event: NotificationEvent,
        channel: str,
        recipient: str,
        status: str,
        user_id: Optional[str] = None,
        order_id: Optional[str] = None,
        subject: Optional[str] = None,
        body_preview: Optional[str] = None,
        error: Optional[str] = None,
    ) -> None:
        self.notifications.insert_one(
            {
                "user_id": user_id,
                "order_id": order_id,
                "event": event.value,
                "channel": channel,
                "recipient": recipient,
                "subject": subject,
                "body_preview": (body_preview or "")[:300],
                "status": status,
                "error": error,
                "created_at": datetime.now(),
            }
        )

    # ── Email ────────────────────────────────────────────────────────────

    def send_email(
        self,
        event: NotificationEvent,
        to_email: str,
        context: dict,
        user_id: Optional[str] = None,
        order_id: Optional[str] = None,
    ) -> bool:
        ctx = self._default_context(context)
        subject = _EMAIL_SUBJECTS.get(event, "Update on order {order_number}").format(**ctx)
        body = _EMAIL_BODIES.get(
            event, "Hi {customer_name},\n\nThere's an update on your order {order_number}."
        ).format(**ctx)

        if not to_email:
            self._log(event, "email", "", "failed", user_id, order_id, subject, body, error="No recipient email")
            return False

        if not smtp_host:
            self._log(event, "email", to_email, "skipped_no_config", user_id, order_id, subject, body)
            return False

        try:
            msg = MIMEMultipart()
            msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                if smtp_use_tls:
                    server.starttls()
                if smtp_username and smtp_password:
                    server.login(smtp_username, smtp_password)
                server.sendmail(smtp_from_email, [to_email], msg.as_string())

            self._log(event, "email", to_email, "sent", user_id, order_id, subject, body)
            return True
        except Exception as exc:
            self._log(event, "email", to_email, "failed", user_id, order_id, subject, body, error=str(exc))
            return False

    def send_raw_email(self, to_email: str, subject: str, body_html: str, body_text: Optional[str] = None) -> bool:
        """Send custom HTML email (e.g. product recommendation share) using configured SMTP."""
        if not to_email or not smtp_host:
            return False
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            if body_text:
                msg.attach(MIMEText(body_text, "plain"))
            msg.attach(MIMEText(body_html, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                if smtp_use_tls:
                    server.starttls()
                if smtp_username and smtp_password:
                    server.login(smtp_username, smtp_password)
                server.sendmail(smtp_from_email, [to_email], msg.as_string())
            return True
        except Exception as exc:
            print(f"[Email] Failed to send raw email: {exc}")
            return False

    def send_custom_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False,
        event_name: str = "custom_email",
    ) -> bool:
        """Send custom raw/HTML email via configured SMTP."""
        if not to_email or not smtp_host:
            print(f"[Notification] Cannot send custom email to '{to_email}' (smtp_host='{smtp_host}')")
            return False

        try:
            msg = MIMEMultipart()
            msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html" if is_html else "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                if smtp_use_tls:
                    server.starttls()
                if smtp_username and smtp_password:
                    server.login(smtp_username, smtp_password)
                server.sendmail(smtp_from_email, [to_email], msg.as_string())

            self.notifications.insert_one({
                "user_id": None,
                "order_id": None,
                "event": event_name,
                "channel": "email",
                "recipient": to_email,
                "subject": subject,
                "body_preview": body[:300],
                "status": "sent",
                "created_at": datetime.now(),
            })
            return True
        except Exception as exc:
            print(f"[Notification] Error sending custom email to {to_email}: {exc}")
            self.notifications.insert_one({
                "user_id": None,
                "order_id": None,
                "event": event_name,
                "channel": "email",
                "recipient": to_email,
                "subject": subject,
                "body_preview": body[:300],
                "status": "failed",
                "error": str(exc),
                "created_at": datetime.now(),
            })
            return False

    # ── WhatsApp ─────────────────────────────────────────────────────────

    def send_whatsapp(
        self,
        event: NotificationEvent,
        to_phone: str,
        context: dict,
        user_id: Optional[str] = None,
        order_id: Optional[str] = None,
    ) -> bool:
        ctx = self._default_context(context)
        text = _WHATSAPP_TEMPLATES.get(
            event, "Update on your {company_name} order {order_number}."
        ).format(**ctx)

        if not to_phone:
            self._log(event, "whatsapp", "", "failed", user_id, order_id, body_preview=text, error="No recipient phone")
            return False

        if not whatsapp_access_token or not whatsapp_phone_number_id:
            self._log(event, "whatsapp", to_phone, "skipped_no_config", user_id, order_id, body_preview=text)
            return False

        phone = self._normalize_phone(to_phone)

        try:
            url = (
                f"https://graph.facebook.com/{whatsapp_api_version}/"
                f"{whatsapp_phone_number_id}/messages"
            )
            payload = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {"body": text},
            }
            headers = {"Authorization": f"Bearer {whatsapp_access_token}"}
            resp = httpx.post(url, json=payload, headers=headers, timeout=15)
            if resp.status_code >= 400:
                raise RuntimeError(f"WhatsApp API error {resp.status_code}: {resp.text[:200]}")

            self._log(event, "whatsapp", phone, "sent", user_id, order_id, body_preview=text)
            return True
        except Exception as exc:
            self._log(event, "whatsapp", phone, "failed", user_id, order_id, body_preview=text, error=str(exc))
            return False

    # ── Combined helper ──────────────────────────────────────────────────

    def notify(
        self,
        event: NotificationEvent,
        context: dict,
        to_email: Optional[str] = None,
        to_phone: Optional[str] = None,
        user_id: Optional[str] = None,
        order_id: Optional[str] = None,
    ) -> None:
        """Fire both channels for a lifecycle event. Never raises."""
        try:
            if to_email:
                self.send_email(event, to_email, context, user_id, order_id)
        except Exception:
            pass
        try:
            if to_phone:
                self.send_whatsapp(event, to_phone, context, user_id, order_id)
        except Exception:
            pass

    # ── helpers ──────────────────────────────────────────────────────────

    def _default_context(self, context: dict) -> dict:
        ctx = {
            "company_name": company_name,
            "support_email": company_support_email,
            "support_phone": company_support_phone,
            "customer_name": "Customer",
            "order_number": "",
            "amount": "0",
            "courier_name": "our courier partner",
            "awb": "",
            "tracking_url": "",
            "reason": "",
        }
        ctx.update(context or {})
        return ctx

    def _normalize_phone(self, phone: str) -> str:
        """WhatsApp Cloud API expects E.164 without a leading '+'. Assumes
        Indian numbers if no country code is present (10 digits)."""
        digits = "".join(c for c in phone if c.isdigit())
        if len(digits) == 10:
            return f"91{digits}"
        return digits


def get_notification_service(db: Database) -> NotificationService:
    return NotificationService(db)
