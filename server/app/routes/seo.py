"""
Nari Pehnawa - SEO, Open Graph & Social Share Preview System.

Provides authoritative server-rendered metadata (Open Graph, Twitter Cards, Schema.org)
for WhatsApp, Facebook, Instagram, Twitter, Telegram, LinkedIn, and human browser visitors.
Generates dynamic 1200x630 (1.91:1) high-resolution preview cards with live pricing,
authoritative MRP, and genuine discounts directly from MongoDB.
"""

import io
import html
import os
import re
import urllib.request
from pathlib import Path
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import HTMLResponse
from PIL import Image, ImageDraw, ImageFont

from app.database import get_database

router = APIRouter(tags=["SEO & Social Previews"])

BASE_URL = "https://naripehnawa.com"

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
CLIENT_DIST_DIR = BASE_DIR.parent / "client" / "dist"
CLIENT_PUBLIC_DIR = BASE_DIR.parent / "client" / "public"
INDEX_PATH = CLIENT_DIST_DIR / "index.html"
DEV_INDEX_PATH = BASE_DIR.parent / "client" / "index.html"
UPLOADS_DIR = BASE_DIR / "uploads"
OG_CACHE_DIR = UPLOADS_DIR / "og_cache"
OG_CACHE_DIR.mkdir(parents=True, exist_ok=True)

LOGO_PATH = CLIENT_DIST_DIR / "logo.png"
if not LOGO_PATH.exists():
    LOGO_PATH = CLIENT_PUBLIC_DIR / "logo.png"

# System font fallback
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# In-memory HTML cache with mtime check
_cached_index_html: Optional[str] = None
_cached_mtime: float = 0.0


def is_crawler_request(user_agent: str) -> bool:
    """Detects social media crawlers and link preview scrapers."""
    if not user_agent:
        return False
    ua = user_agent.lower()
    crawlers = [
        "whatsapp",
        "facebookexternalhit",
        "facebot",
        "twitterbot",
        "telegrambot",
        "linkedinbot",
        "pinterest",
        "slackbot",
        "discordbot",
        "applebot",
        "bingbot",
        "googlebot",
        "google-inspectiontool",
        "vkshare",
        "skypeuripreview",
        "meta-externalagent",
        "outbrain",
        "w3c_validator",
    ]
    return any(c in ua for c in crawlers)


def get_base_html() -> str:
    """Reads dist/index.html with auto-invalidation on build update."""
    global _cached_index_html, _cached_mtime
    target = INDEX_PATH if INDEX_PATH.exists() else DEV_INDEX_PATH
    if not target.exists():
        return """<!doctype html><html><head><title>Nari Pehnawa</title></head><body><div id="root"></div></body></html>"""

    mtime = os.path.getmtime(target)
    if _cached_index_html is None or mtime != _cached_mtime:
        _cached_index_html = target.read_text(encoding="utf-8")
        _cached_mtime = mtime
    return _cached_index_html


def load_source_image(image_raw: Optional[str]) -> Image.Image:
    """Loads product image from local uploads directory or remote URL with safe fallback."""
    raw_img = None
    if image_raw and str(image_raw).strip():
        img_str = str(image_raw).strip()
        clean_name = os.path.basename(img_str.split("?")[0])
        local_file = UPLOADS_DIR / clean_name
        if local_file.exists():
            try:
                raw_img = Image.open(local_file)
            except Exception as e:
                print(f"Error opening local image {local_file}: {e}")

        # Check public directory
        if raw_img is None:
            public_file = CLIENT_PUBLIC_DIR / clean_name
            if public_file.exists():
                try:
                    raw_img = Image.open(public_file)
                except Exception:
                    pass

        # If it's a remote URL
        if raw_img is None and (img_str.startswith("http://") or img_str.startswith("https://")):
            try:
                req = urllib.request.Request(
                    img_str,
                    headers={"User-Agent": "Mozilla/5.0 (compatible; NariPehnawa-SEO/1.0)"},
                )
                with urllib.request.urlopen(req, timeout=4) as resp:
                    raw_img = Image.open(io.BytesIO(resp.read()))
            except Exception as e:
                print(f"Error fetching remote image {img_str}: {e}")

    # Fallback to store logo
    if raw_img is None and LOGO_PATH.exists():
        try:
            raw_img = Image.open(LOGO_PATH)
        except Exception:
            pass

    if raw_img is None:
        return Image.new("RGB", (800, 800), (255, 255, 255))

    # Convert to RGB with clean white background for transparent images
    try:
        if raw_img.mode in ("RGBA", "LA") or (raw_img.mode == "P" and "transparency" in raw_img.info):
            raw_img = raw_img.convert("RGBA")
            bg = Image.new("RGBA", raw_img.size, (255, 255, 255, 255))
            return Image.alpha_composite(bg, raw_img).convert("RGB")
        return raw_img.convert("RGB")
    except Exception:
        return raw_img.convert("RGB")


def parse_pricing_details(product: dict) -> dict:
    """
    Authoritative pricing parser. Never invents discounts.
    Extracts price, MRP, and discount percentage strictly from MongoDB record.
    """
    selling_price = product.get("price")
    try:
        selling_price = float(selling_price) if selling_price is not None else None
    except Exception:
        selling_price = None

    original_price = product.get("original_price") or product.get("originalPrice")
    try:
        original_price = float(original_price) if original_price is not None else None
    except Exception:
        original_price = None

    discount_val = product.get("discount")
    try:
        discount_val = int(discount_val) if discount_val is not None else None
    except Exception:
        discount_val = None

    # Determine if discount is genuine and MRP > selling price
    has_discount = False
    if selling_price and original_price and original_price > selling_price:
        has_discount = True
        if not discount_val or discount_val <= 0:
            discount_val = int(round(((original_price - selling_price) / original_price) * 100))

    formatted_selling = f"₹{int(selling_price):,}" if (selling_price and selling_price.is_integer()) else (f"₹{selling_price:,.2f}" if selling_price else "")
    formatted_original = f"₹{int(original_price):,}" if (original_price and original_price.is_integer()) else (f"₹{original_price:,.2f}" if original_price else "")

    if has_discount and formatted_selling and formatted_original:
        summary_text = f"Price: {formatted_selling} | MRP: {formatted_original} | {discount_val}% OFF"
        badge_short = f"{formatted_selling} ({discount_val}% OFF)"
    elif formatted_selling:
        summary_text = f"Price: {formatted_selling}"
        badge_short = formatted_selling
    else:
        summary_text = ""
        badge_short = ""

    return {
        "selling_price": selling_price,
        "original_price": original_price,
        "discount_val": discount_val,
        "has_discount": has_discount,
        "formatted_selling": formatted_selling,
        "formatted_original": formatted_original,
        "summary_text": summary_text,
        "badge_short": badge_short,
    }


def generate_nari_preview_banner(image_raw: Optional[str], product: Optional[dict] = None) -> bytes:
    """
    Generates a 1200x630 (1.91:1 standard) luxury preview banner for Nari Pehnawa:
    - Pristine white canvas with subtle golden aesthetic
    - Product kurti/dress photo centered, full-height (610px out of 630px)
    - Royal Maroon (#8B0000) & Gold (#D4AF37) badge with Price, MRP, and genuine discount
    """
    src_img = load_source_image(image_raw)
    src_w, src_h = src_img.size
    aspect = src_w / max(src_h, 1)

    canvas_w, canvas_h = 1200, 630
    canvas = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))

    # Fit image neatly inside canvas with 10px vertical padding
    max_pw, max_ph = 1140, 610
    new_ph = min(max_ph, int(max_pw / aspect))
    new_pw = int(new_ph * aspect)
    if new_pw > max_pw:
        new_pw = max_pw
        new_ph = int(new_pw / aspect)

    resized = src_img.resize((new_pw, new_ph), Image.Resampling.LANCZOS)
    px = (canvas_w - new_pw) // 2
    py = (canvas_h - new_ph) // 2
    canvas.paste(resized, (px, py))

    # Draw royal Nari Pehnawa price badge if pricing exists
    if product:
        pricing = parse_pricing_details(product)
        if pricing["formatted_selling"]:
            try:
                draw = ImageDraw.Draw(canvas)
                font_bold = None
                try:
                    font_bold = ImageFont.truetype(FONT_BOLD, 38)
                except Exception:
                    font_bold = ImageFont.load_default()

                # Badge text construction
                price_main = f"Price: {pricing['formatted_selling']}"
                extra_text = ""
                if pricing["has_discount"]:
                    extra_text = f"  |  MRP: {pricing['formatted_original']} ({pricing['discount_val']}% OFF)"

                badge_full = f"{price_main}{extra_text}"
                bbox = draw.textbbox((0, 0), badge_full, font=font_bold)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]

                pad_x, pad_y = 28, 16
                bx0 = 36
                by0 = canvas_h - text_h - (pad_y * 2) - 34
                bx1 = bx0 + text_w + (pad_x * 2)
                by1 = by0 + text_h + (pad_y * 2)

                # Nari Pehnawa Royal Maroon container (#8B0000)
                draw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(139, 0, 0))
                # Gold Accent Border (#D4AF37)
                draw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, outline=(212, 175, 55), width=3)

                # Draw main price text in pure White, extra details in Gold
                draw.text((bx0 + pad_x, by0 + pad_y - 2), badge_full, fill=(255, 255, 255), font=font_bold)
            except Exception as e:
                print(f"Error drawing Nari Pehnawa price badge: {e}")

    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=92, optimize=True)
    return buf.getvalue()


def find_product_by_id_or_slug(product_id: str, db) -> Optional[dict]:
    """Finds product by ObjectId, string _id, id, slug, or name regex."""
    products_col = db["products"]
    product = None

    # 1. Try ObjectId
    if ObjectId.is_valid(product_id):
        try:
            product = products_col.find_one({"_id": ObjectId(product_id)})
            if product:
                return product
        except Exception:
            pass

    # 2. Try _id as string or id field
    product = products_col.find_one({"$or": [{"_id": product_id}, {"id": product_id}]})
    if product:
        return product

    # 3. Try slug field
    product = products_col.find_one({"slug": product_id})
    if product:
        return product

    # 4. If slug format like "black-floral-kurti", try fuzzy name match
    if "-" in product_id:
        words = [re.escape(w) for w in product_id.split("-") if len(w) > 2]
        if words:
            pattern = ".*".join(words)
            product = products_col.find_one({"name": {"$regex": pattern, "$options": "i"}})
            if product:
                return product

    return None


@router.options("/product/{product_id}")
@router.options("/product/{product_id}/og-image.jpg")
@router.options("/p/{product_id}")
@router.options("/p/{product_id}/og-image.jpg")
def seo_cors_preflight(request: Request):
    return Response(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        },
    )


@router.api_route(
    "/product/{product_id}/og-image.jpg",
    methods=["GET", "HEAD", "OPTIONS"],
)
@router.api_route(
    "/p/{product_id}/og-image.jpg",
    methods=["GET", "HEAD", "OPTIONS"],
)
def get_product_preview_image(product_id: str, request: Request):
    """
    Returns the 1200x630 full product preview image banner for social media link cards.
    Disk-cached for instant 1ms response.
    """
    if request.method == "OPTIONS":
        return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*"})

    cache_file = OG_CACHE_DIR / f"nari_{product_id}.jpg"
    if cache_file.exists():
        content = cache_file.read_bytes()
        return Response(
            content=content,
            media_type="image/jpeg",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=604800, immutable",
                "Content-Type": "image/jpeg",
                "Content-Length": str(len(content)),
                "Accept-Ranges": "bytes",
            },
        )

    db = get_database()
    product = find_product_by_id_or_slug(product_id, db)

    image_raw = None
    if product:
        image_raw = product.get("image")
        if not image_raw and product.get("images"):
            valid = [img for img in product.get("images", []) if img]
            if valid:
                image_raw = valid[0]

    jpeg_data = generate_nari_preview_banner(image_raw, product)
    try:
        cache_file.write_bytes(jpeg_data)
    except Exception as e:
        print(f"Error caching Nari Pehnawa OG image: {e}")

    return Response(
        content=jpeg_data,
        media_type="image/jpeg",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=604800, immutable",
            "Content-Type": "image/jpeg",
            "Content-Length": str(len(jpeg_data)),
            "Accept-Ranges": "bytes",
        },
    )


@router.api_route(
    "/product/{product_id}",
    methods=["GET", "HEAD", "OPTIONS"],
    response_class=HTMLResponse,
)
@router.api_route(
    "/p/{product_id}",
    methods=["GET", "HEAD", "OPTIONS"],
    response_class=HTMLResponse,
)
def get_product_page_with_meta(product_id: str, request: Request):
    """
    Renders product detail URL with server-side Open Graph & Twitter Card metadata.
    - Crawlers (WhatsApp, Facebook, Twitter, Telegram, etc.) receive dedicated lightweight HTML.
    - Human visitors receive the full React index.html with pre-injected metadata in <head>.
    - Missing products return an authoritative 404 response.
    """
    if request.method == "OPTIONS":
        return Response(status_code=204, headers={"Access-Control-Allow-Origin": "*"})

    user_agent = request.headers.get("user-agent", "")
    db = get_database()
    product = find_product_by_id_or_slug(product_id, db)

    # 404 for missing products (Requirement 5)
    if not product:
        not_found_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Product Not Found • Nari Pehnawa</title>
    <meta name="description" content="The requested ethnic wear product could not be found. Explore our latest designer kurtis and collections at Nari Pehnawa.">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="{BASE_URL}/product/{product_id}">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 60px 20px; color: #1e293b;">
    <h1 style="color: #8B0000; font-size: 28px;">Product Not Found</h1>
    <p style="color: #64748b; font-size: 16px;">We could not find the product you're looking for.</p>
    <p style="margin-top: 24px;"><a href="{BASE_URL}" style="background: #8B0000; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Explore Nari Pehnawa</a></p>
</body>
</html>"""
        return HTMLResponse(content=not_found_html, status_code=404)

    # Canonical identification
    canonical_id = str(product.get("_id") or product.get("id") or product_id)
    canonical_url = f"{BASE_URL}/product/{canonical_id}"
    large_image_url = f"{BASE_URL}/product/{canonical_id}/og-image.jpg"

    # Product details & Pricing
    raw_name = (product.get("name") or product.get("title") or "Designer Kurti").strip()
    pricing = parse_pricing_details(product)

    # Page Title & Open Graph Title
    if pricing["badge_short"]:
        card_title = f"{raw_name} • {pricing['badge_short']}"
    else:
        card_title = f"{raw_name} • Nari Pehnawa"
    safe_title = html.escape(card_title)
    safe_product_name = html.escape(raw_name)

    # Description
    category_name = (product.get("category") or "Ethnic Wear").strip()
    fabric = (product.get("fabric") or "Premium Fabric").strip()
    if pricing["summary_text"]:
        desc_text = f"{pricing['summary_text']} • {category_name} ({fabric}). Handcrafted luxury Indian ethnic wear by Nari Pehnawa. Free Shipping & COD available."
    else:
        desc_text = f"{raw_name} • {category_name}. Handcrafted luxury Indian ethnic wear by Nari Pehnawa. Free Shipping & COD available."
    safe_desc = html.escape(desc_text)

    # Ensure OG image is generated and cached
    cache_file = OG_CACHE_DIR / f"nari_{canonical_id}.jpg"
    if not cache_file.exists():
        try:
            image_raw = product.get("image")
            if not image_raw and product.get("images"):
                valid = [img for img in product.get("images", []) if img]
                if valid:
                    image_raw = valid[0]
            jpeg_data = generate_nari_preview_banner(image_raw, product)
            cache_file.write_bytes(jpeg_data)
        except Exception as e:
            print(f"Error pre-generating Nari Pehnawa preview image: {e}")

    # CRAWLER / BOT OPTIMIZATION (WhatsApp, Facebook, Twitter, Telegram, etc.):
    if is_crawler_request(user_agent):
        bot_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{safe_title}</title>
    <meta name="description" content="{safe_desc}">
    <link rel="canonical" href="{canonical_url}">

    <!-- Schema.org Microdata -->
    <meta itemprop="name" content="{safe_product_name}">
    <meta itemprop="description" content="{safe_desc}">
    <meta itemprop="image" content="{large_image_url}">

    <!-- Open Graph for WhatsApp, Facebook, LinkedIn -->
    <meta property="og:site_name" content="Nari Pehnawa">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:title" content="{safe_title}">
    <meta property="og:description" content="{safe_desc}">
    <meta property="og:image" content="{large_image_url}">
    <meta property="og:image:secure_url" content="{large_image_url}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{safe_product_name}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@naripehnawa">
    <meta name="twitter:url" content="{canonical_url}">
    <meta name="twitter:title" content="{safe_title}">
    <meta name="twitter:description" content="{safe_desc}">
    <meta name="twitter:image" content="{large_image_url}">
    <meta name="twitter:image:alt" content="{safe_product_name}">
</head>
<body>
    <h1>{safe_title}</h1>
    <p>{safe_desc}</p>
    <img src="{large_image_url}" alt="{safe_product_name}">
    <p><a href="{canonical_url}">View & Order on Nari Pehnawa</a></p>
</body>
</html>"""
        return HTMLResponse(content=bot_html, status_code=200)

    # HUMAN BROWSER VISITORS:
    # Inject authoritative Open Graph and Twitter tags directly into <head> of dist/index.html
    raw_html = get_base_html()
    output_html = re.sub(r"<title>.*?</title>", "", raw_html, flags=re.IGNORECASE)
    # Strip any existing meta tags from base html
    output_html = re.sub(r"<meta[^>]+(?:og:|twitter:|description|name=title)[^>]*>", "", output_html, flags=re.IGNORECASE)
    output_html = re.sub(r"<link[^>]+canonical[^>]*>", "", output_html, flags=re.IGNORECASE)
    meta_tags = f"""<meta charset="UTF-8" />
        <title>{safe_title}</title>
        <meta name="title" content="{safe_title}" />
        <meta name="description" content="{safe_desc}" />
        <link rel="canonical" href="{canonical_url}" />

        <!-- Open Graph / WhatsApp / Facebook Preview -->
        <meta property="og:site_name" content="Nari Pehnawa" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{canonical_url}" />
        <meta property="og:title" content="{safe_title}" />
        <meta property="og:description" content="{safe_desc}" />
        <meta property="og:image" content="{large_image_url}" />
        <meta property="og:image:secure_url" content="{large_image_url}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="{safe_product_name}" />

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@naripehnawa" />
        <meta name="twitter:url" content="{canonical_url}" />
        <meta name="twitter:title" content="{safe_title}" />
        <meta name="twitter:description" content="{safe_desc}" />
        <meta name="twitter:image" content="{large_image_url}" />
        <meta name="twitter:image:alt" content="{safe_product_name}" />"""

    if "<head>" in output_html:
        output_html = output_html.replace("<head>", f"<head>\n        {meta_tags}", 1)
    else:
        output_html = f"<head>{meta_tags}</head>\n" + output_html

    return HTMLResponse(content=output_html, status_code=200)
