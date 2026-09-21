import io
import csv
import xml.sax.saxutils as saxutils
from fastapi import APIRouter, Response
from app.database import get_database

router = APIRouter(prefix="/feed", tags=["Product Catalog Feeds"])

BASE_FRONTEND_URL = "https://naripehnawa.com"


def _clean_text(text: str) -> str:
    if not text:
        return ""
    # Strip HTML tags and normalize whitespace
    import re
    cleaned = re.sub(r"<[^>]+>", " ", str(text))
    return " ".join(cleaned.split())


def _resolve_full_image_url(image_path: str) -> str:
    if not image_path:
        return f"{BASE_FRONTEND_URL}/logo_square.png"
    img = str(image_path).strip()
    if img.startswith("http://") or img.startswith("https://"):
        return img
    if img.startswith("/"):
        return f"{BASE_FRONTEND_URL}{img}"
    return f"{BASE_FRONTEND_URL}/{img}"


@router.get("/facebook-catalog.xml", response_class=Response)
@router.get("/meta.xml", response_class=Response)
@router.get("/google-merchant.xml", response_class=Response)
def get_meta_xml_feed():
    """
    Dynamic XML Product Feed for Meta Commerce Manager / Facebook Catalog & Google Merchant.
    Guarantees 100% ID matching with Meta Pixel and Conversions API events.
    """
    db = get_database()
    products = list(db["products"].find({}))

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
        "<channel>",
        f"  <title>Nari Pehnawa - Official Product Catalog</title>",
        f"  <link>{BASE_FRONTEND_URL}</link>",
        "  <description>Luxury Women Ethnic Wear, Designer Kurtis, Chikankari &amp; Sarees</description>",
    ]

    for p in products:
        p_id = str(p["_id"])
        catalog_id = str(p.get("meta_catalog_id") or p.get("sku") or p_id).strip()
        title = saxutils.escape(_clean_text(p.get("name", "Ethnic Outfit")))
        description = saxutils.escape(_clean_text(p.get("description") or p.get("name") or "Luxury Women Ethnic Wear"))
        link = f"{BASE_FRONTEND_URL}/product/{p_id}"
        image_url = saxutils.escape(_resolve_full_image_url(p.get("image", "")))
        brand = saxutils.escape(str(p.get("brand") or "Nari Pehnawa").strip())
        price = float(p.get("price", 0.0) or 0.0)
        in_stock = p.get("in_stock", True) is not False
        availability = "in stock" if in_stock else "out of stock"
        category = saxutils.escape(str(p.get("category", "Women's Ethnic Wear")).strip())

        xml_lines.append("  <item>")
        xml_lines.append(f"    <g:id>{catalog_id}</g:id>")
        xml_lines.append(f"    <g:title>{title}</g:title>")
        xml_lines.append(f"    <g:description>{description}</g:description>")
        xml_lines.append(f"    <g:link>{link}</g:link>")
        xml_lines.append(f"    <g:image_link>{image_url}</g:image_link>")
        xml_lines.append(f"    <g:brand>{brand}</g:brand>")
        xml_lines.append(f"    <g:condition>new</g:condition>")
        xml_lines.append(f"    <g:availability>{availability}</g:availability>")
        xml_lines.append(f"    <g:price>{price:.2f} INR</g:price>")
        xml_lines.append(f"    <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Traditional &amp; Ceremonial Clothing</g:google_product_category>")
        xml_lines.append(f"    <g:product_type>{category}</g:product_type>")
        xml_lines.append("  </item>")

    xml_lines.append("</channel>")
    xml_lines.append("</rss>")

    content = "\n".join(xml_lines)
    return Response(content=content, media_type="application/xml; charset=utf-8")


@router.get("/products.csv", response_class=Response)
def get_meta_csv_feed():
    """
    Dynamic CSV Product Feed for Meta Commerce Manager / Facebook Catalog.
    """
    db = get_database()
    products = list(db["products"].find({}))

    output = io.StringIO()
    writer = csv.writer(output)

    # Standard Meta Catalog CSV Header
    writer.writerow([
        "id",
        "title",
        "description",
        "availability",
        "condition",
        "price",
        "link",
        "image_link",
        "brand",
        "google_product_category",
        "fb_product_category",
    ])

    for p in products:
        p_id = str(p["_id"])
        catalog_id = str(p.get("meta_catalog_id") or p.get("sku") or p_id).strip()
        title = _clean_text(p.get("name", "Ethnic Outfit"))
        description = _clean_text(p.get("description") or p.get("name") or "Luxury Women Ethnic Wear")
        link = f"{BASE_FRONTEND_URL}/product/{p_id}"
        image_url = _resolve_full_image_url(p.get("image", ""))
        brand = str(p.get("brand") or "Nari Pehnawa").strip()
        price = f"{float(p.get('price', 0.0) or 0.0):.2f} INR"
        in_stock = p.get("in_stock", True) is not False
        availability = "in stock" if in_stock else "out of stock"

        writer.writerow([
            catalog_id,
            title,
            description,
            availability,
            "new",
            price,
            link,
            image_url,
            brand,
            "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing",
            "clothing > traditional & cultural wear",
        ])

    csv_content = output.getvalue()
    return Response(content=csv_content, media_type="text/csv; charset=utf-8")
