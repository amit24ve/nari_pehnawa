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

_SMS_TEMPLATES = {
    NotificationEvent.ORDER_CONFIRMED: "Dear {customer_name}, your Nari Pehnawa order {order_number} for Rs.{amount} is confirmed! We will prepare and ship it soon. - NARI PEHNAWA",
    NotificationEvent.PAYMENT_SUCCESS: "Dear {customer_name}, payment for your Nari Pehnawa order {order_number} (Rs.{amount}) is successful. Your order is confirmed. - NARI PEHNAWA",
    NotificationEvent.ORDER_SHIPPED: "Dear {customer_name}, your Nari Pehnawa order {order_number} has shipped via {courier_name} (AWB: {awb}). - NARI PEHNAWA",
    NotificationEvent.ORDER_DELIVERED: "Dear {customer_name}, your Nari Pehnawa order {order_number} has been delivered. Thank you for shopping with us! - NARI PEHNAWA",
    NotificationEvent.ORDER_CANCELLED: "Dear {customer_name}, your Nari Pehnawa order {order_number} has been cancelled. - NARI PEHNAWA",
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

    # ── SMTP Connection Helper ────────────────────────────────────────────

    def _get_smtp_connection(self):
        """Create SMTP or SMTP_SSL connection with auto port detection."""
        if not smtp_host:
            return None
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            if smtp_use_tls:
                server.starttls()
        if smtp_username and smtp_password:
            server.login(smtp_username, smtp_password)
        return server

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
        plain_body = _EMAIL_BODIES.get(
            event, "Hi {customer_name},\n\nThere's an update on your order {order_number}."
        ).format(**ctx)

        if not to_email:
            self._log(event, "email", "", "failed", user_id, order_id, subject, plain_body, error="No recipient email")
            return False

        if not smtp_host:
            self._log(event, "email", to_email, "skipped_no_config", user_id, order_id, subject, plain_body)
            return False

        # Build Rich HTML Email Template
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6f0; color: #2D2D2D;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f6f0; padding: 24px 12px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #efe8da;">
                  
                  <!-- Top Decorative Bar -->
                  <tr>
                    <td style="background: linear-gradient(90deg, #8B0000 0%, #D4AF37 50%, #8B0000 100%); height: 6px;"></td>
                  </tr>

                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 28px 24px 18px 24px; border-bottom: 1px solid #f2ece1;">
                      <h1 style="margin: 0; font-size: 26px; font-family: 'Playfair Display', Georgia, serif; color: #8B0000; letter-spacing: 1px; font-weight: 800;">
                        NARI PEHNAWA
                      </h1>
                      <p style="margin: 4px 0 0 0; font-size: 11px; color: #9E7D3B; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                        Timeless Indian Ethnic Wear
                      </p>
                    </td>
                  </tr>

                  <!-- Main Content Card -->
                  <tr>
                    <td style="padding: 32px 28px 24px 28px;">
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">
                        {subject}
                      </h2>
                      <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4a4a4a;">
                        Dear <strong>{ctx.get('customer_name', 'Customer')}</strong>,
                      </p>
                      <div style="background-color: #fdfbf7; border-left: 4px solid #8B0000; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333333; white-space: pre-line;">
                          {plain_body}
                        </p>
                      </div>

                      <!-- Order Summary Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f4; border: 1px dashed #d8cbb5; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 6px 12px; font-size: 13px; color: #666;">Order Number:</td>
                          <td align="right" style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #8B0000;">{ctx.get('order_number', 'N/A')}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 12px; font-size: 13px; color: #666;">Total Amount:</td>
                          <td align="right" style="padding: 6px 12px; font-size: 14px; font-weight: 700; color: #1a1a1a;">&#8377;{ctx.get('amount', '0.00')}</td>
                        </tr>
                      </table>

                      <!-- Call to Action Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; margin-bottom: 20px;">
                        <tr>
                          <td align="center">
                            <a href="https://www.naripehnawa.com/account/orders" target="_blank" style="display: inline-block; background-color: #8B0000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 10px rgba(139,0,0,0.25);">
                              View Order Details
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #faf8f4; padding: 22px 28px; border-top: 1px solid #efe8da; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; color: #666666;">
                        Need help with your order? Reach us at <a href="mailto:{ctx.get('support_email', 'support@naripehnawa.com')}" style="color: #8B0000; font-weight: 600; text-decoration: none;">{ctx.get('support_email', 'support@naripehnawa.com')}</a>
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #999999;">
                        &copy; 2026 Nari Pehnawa. All rights reserved. &bull; <a href="https://www.naripehnawa.com" style="color: #999999; text-decoration: underline;">www.naripehnawa.com</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(plain_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with self._get_smtp_connection() as server:
                server.sendmail(smtp_from_email, [to_email], msg.as_string())

            self._log(event, "email", to_email, "sent", user_id, order_id, subject, plain_body)
            return True
        except Exception as exc:
            self._log(event, "email", to_email, "failed", user_id, order_id, subject, plain_body, error=str(exc))
            return False

    def send_raw_email(self, to_email: str, subject: str, body_html: str, body_text: Optional[str] = None) -> bool:
        """Send custom HTML email using configured SMTP with SSL/TLS auto-detection."""
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

            with self._get_smtp_connection() as server:
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

    # ── SMS (MSG91) ───────────────────────────────────────────────────────

    def send_sms(
        self,
        event: NotificationEvent,
        to_phone: str,
        context: dict,
        user_id: Optional[str] = None,
        order_id: Optional[str] = None,
    ) -> bool:
        """Send transactional SMS via MSG91 Flow API (/api/v5/flow) or OTP API (/api/v5/otp)."""
        ctx = self._default_context(context)
        text = _SMS_TEMPLATES.get(
            event, "Update on your {company_name} order {order_number}."
        ).format(**ctx)

        if not to_phone:
            self._log(event, "sms", "", "failed", user_id, order_id, body_preview=text, error="No recipient phone")
            return False

        phone = self._normalize_phone(to_phone)
        import os
        import json
        import requests

        msg91_authkey = os.getenv("MSG91_AUTHKEY", "571630AZ2xbnTitma6aa98569P1")
        flow_template_id = os.getenv("MSG91_ORDER_TEMPLATE_ID") or os.getenv("MSG91_FLOW_TEMPLATE_ID", "")

        try:
            headers = {
                "authkey": msg91_authkey,
                "content-type": "application/json",
                "accept": "application/json",
            }

            # 1. If Flow template ID is configured, use official MSG91 Flow API (/api/v5/flow)
            if flow_template_id:
                flow_url = "https://control.msg91.com/api/v5/flow"
                flow_payload = {
                    "template_id": flow_template_id,
                    "short_url": "0",
                    "recipients": [
                        {
                            "mobiles": phone,
                            "VAR1": ctx.get("customer_name", "Customer"),
                            "VAR2": ctx.get("order_number", ""),
                            "VAR3": str(ctx.get("amount", "")),
                            "name": ctx.get("customer_name", "Customer"),
                            "order_number": ctx.get("order_number", ""),
                            "amount": str(ctx.get("amount", "")),
                        }
                    ],
                }
                resp = requests.post(flow_url, headers=headers, json=flow_payload, timeout=10)
            else:
                # 2. Standard MSG91 OTP/SMS endpoint
                otp_url = "https://control.msg91.com/api/v5/otp"
                params = {
                    "authkey": msg91_authkey,
                    "mobile": phone,
                    "message": text,
                }
                resp = requests.post(otp_url, headers=headers, params=params, json={}, timeout=10)

            if resp.status_code >= 400:
                raise RuntimeError(f"MSG91 SMS error {resp.status_code}: {resp.text[:200]}")

            self._log(event, "sms", phone, "sent", user_id, order_id, body_preview=text)
            return True
        except Exception as exc:
            self._log(event, "sms", phone, "failed", user_id, order_id, body_preview=text, error=str(exc))
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
        """Fire Email, WhatsApp, and MSG91 SMS for a lifecycle event. Never raises."""
        try:
            if to_email:
                self.send_email(event, to_email, context, user_id, order_id)
        except Exception:
            pass
        try:
            if to_phone:
                self.send_sms(event, to_phone, context, user_id, order_id)
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
