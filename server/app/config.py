import os
from pathlib import Path

from dotenv import load_dotenv

# Load variables from server/app/.env into the environment (this was
# previously never called, so MONGODB_URL and friends in .env were
# silently ignored and every setting fell back to its default).
load_dotenv(Path(__file__).resolve().parent / ".env")

# MongoDB
mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
mongo_db = os.getenv("MONGO_DB", "naripehnawa")

# Razorpay credentials — MUST be set in .env. No hardcoded fallback secrets
# here on purpose: config.py is source code, .env is the private secret
# store. If these are empty, payment routes raise a clear 503 instead of
# silently using a stale/placeholder key.
razorpay_key_id = os.getenv("RAZORPAY_KEY_ID", "")
razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
# Configured in Razorpay Dashboard -> Settings -> Webhooks. Used to verify
# the X-Razorpay-Signature header on every incoming webhook call.
razorpay_webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

# Pexels (used only by the one-off image seeding scripts, not the API itself)
pexels_api_key = os.getenv("PEXELS_API_KEY", "")

# Shiprocket credentials (set in .env or environment)
shiprocket_email = os.getenv("SHIPROCKET_EMAIL", "")
shiprocket_password = os.getenv("SHIPROCKET_PASSWORD", "")
shiprocket_channel_id = os.getenv("SHIPROCKET_CHANNEL_ID", "0")
shiprocket_base_url = os.getenv(
    "SHIPROCKET_BASE_URL", "https://apiv2.shiprocket.in/v1/external"
)
# Name of the pickup location configured in the Shiprocket panel
# (Settings -> Pickup Addresses). Must match exactly.
shiprocket_pickup_location = os.getenv("SHIPROCKET_PICKUP_LOCATION", "Primary")
# Secret configured on the Shiprocket panel webhook settings page, sent back
# in the "X-Api-Key" header of every webhook call so we can verify authenticity.
shiprocket_webhook_secret = os.getenv("SHIPROCKET_WEBHOOK_SECRET", "")
# Default package dimensions/weight (cm / kg) used when an order doesn't
# specify its own package details.
shiprocket_default_weight_kg = float(os.getenv("SHIPROCKET_DEFAULT_WEIGHT_KG", "0.5"))
shiprocket_default_length_cm = float(os.getenv("SHIPROCKET_DEFAULT_LENGTH_CM", "10"))
shiprocket_default_breadth_cm = float(os.getenv("SHIPROCKET_DEFAULT_BREADTH_CM", "10"))
shiprocket_default_height_cm = float(os.getenv("SHIPROCKET_DEFAULT_HEIGHT_CM", "10"))

# Google OAuth (set in .env or environment) — used for "Sign in with Google"
# on the customer-facing login only (never grants admin access).
google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
# This is the exact URL you must add under Google Cloud Console →
# APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs
google_redirect_uri = os.getenv(
    "GOOGLE_REDIRECT_URI", "https://www.naripehnawa.com:7100/auth/google/callback"
)
# Where to send the user back to once Google sign-in is complete
frontend_url = os.getenv("FRONTEND_URL", "https://www.naripehnawa.com")

# ── Email (SMTP) ──────────────────────────────────────────────────────────────
# If smtp_host is empty, NotificationService logs the email instead of
# sending it (no crash, no silent failure — visible in the notifications
# collection with status="skipped_no_config").
smtp_host = os.getenv("SMTP_HOST", "")
smtp_port = int(os.getenv("SMTP_PORT", "587"))
smtp_username = os.getenv("SMTP_USERNAME", "")
smtp_password = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "support@naripehnawa.com")
smtp_from_name = os.getenv("SMTP_FROM_NAME", "Nari Pehnawa")
smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# ── WhatsApp (Meta WhatsApp Cloud API) ────────────────────────────────────────
# If whatsapp_access_token is empty, NotificationService logs instead of
# sending, same as email.
whatsapp_access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
whatsapp_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
whatsapp_api_version = os.getenv("WHATSAPP_API_VERSION", "v20.0")

# ── Company / invoice (GST) ───────────────────────────────────────────────────
company_name = os.getenv("COMPANY_NAME", "Nari Pehnawa")
company_gstin = os.getenv("COMPANY_GSTIN", "")
company_address = os.getenv("COMPANY_ADDRESS", "India")
company_state = os.getenv("COMPANY_STATE", "Delhi")
company_support_email = os.getenv("COMPANY_SUPPORT_EMAIL", "support@naripehnawa.com")
company_support_phone = os.getenv("COMPANY_SUPPORT_PHONE", "")
invoice_tax_percent = float(os.getenv("INVOICE_TAX_PERCENT", "5"))
