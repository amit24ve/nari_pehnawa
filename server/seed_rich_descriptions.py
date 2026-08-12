"""
Populates rich Flipkart / Amazon / Meesho style descriptions, highlights, fabric,
pattern, sleeve_type, and style tips for all products in MongoDB.
"""

from pymongo import MongoClient, UpdateOne
from app.config import mongodb_url, mongo_db

client = MongoClient(mongodb_url)
db = client[mongo_db]
products_col = db["products"]

KURTI_HIGHLIGHTS = [
    ["100% Premium Quality Fabric", "Intricate Craftsmanship & Embroidery", "Breathable & Comfortable All-Day Wear", "Regular Fit with Flattering Silhouette", "Color-Fast & Pre-Shrunk Material"],
    ["Traditional Handcrafted Detail", "Soft & Skin-Friendly Texture", "Versatile Design for Festive & Casual", "Side Slits for Easy Movement", "Durable Thread Work"],
    ["Elegant Festive Silhouette", "Lightweight & Flowy Fabric", "Designer Neckline & Sleeve Cut", "Pair with Leggings, Palazzos or Jeans", "Easy Wash & Low Maintenance"],
]

HOME_HIGHLIGHTS = [
    ["Handcrafted Artisan Finish", "Premium Eco-Friendly Materials", "Adds Elegant Warmth to Any Room", "Durable & Easy to Clean", "Perfect Gifting Option"],
    ["Contemporary Modern Design", "Sturdy Construction", "Enhances Living & Dining Aesthetic", "Minimalist & Stylish Accent", "Scratch-Resistant Surface"],
]

STYLE_TIPS = {
    "Anarkali Kurtis": "Pair with statement jhumkas, a contrasting silk dupatta, and embroidered juttis for an effortless wedding or festive look.",
    "Straight Kurtis": "Style with cigarette pants or oxidized silver jewelry for a smart office wear look, or pair with ripped denim for a modern fusion vibe.",
    "A-Line Kurtis": "Team with fitted leggings and wedge sandals for a breezy daytime look. Add a sleek handbag to complete your outfit.",
    "Printed Kurtis": "Accessorize with subtle stud earrings and flat mules to let the vibrant floral and block prints take center stage.",
    "Embroidered Kurtis": "Combine with heavy chandbalis and metallic heels for sangeet or festive celebrations.",
    "Denim Kurtis": "Pair with white sneakers and a tan leather crossbody bag for an off-duty weekend ensemble.",
    "Kaftan Kurtis": "Style with boho beaded neckpieces, metallic bangles, and strappy flats for beach vacations or resort gatherings.",
    "Chikankari Kurtis": "Pair with classic Lucknowi palazzo pants, silver payal, and a pastel organza dupatta for timeless royal elegance.",
    "Palazzo Set Kurtis": "Complete the look with matching dupatta, subtle makeup, and pointed pumps for formal dinners or family functions.",
    "Angrakha Kurtis": "Enhance the wrap tie-up detail with dangling earrings and potli bag for traditional festivities.",
}

def generate_rich_description(name, category, fabric, brand):
    is_kurti = "Kurtis" in category
    if is_kurti:
        return (
            f"Elevate your wardrobe with the elegant {name} from {brand}. "
            f"Expertly crafted from high-grade {fabric or 'Cotton Blend'}, this silhouette combines traditional Indian heritage with contemporary comfort. "
            f"Featuring fine stitch detailing, rich color tones, and an ultra-soft texture, it ensures effortless grace whether you are attending a festive gathering, "
            f"a family celebration, or stepping out for casual daywear. Designed to flatter all body shapes while providing max breathability throughout the day."
        )
    else:
        return (
            f"Transform your home decor with the exquisite {name} from {brand}. "
            f"Meticulously handcrafted to add warmth, texture, and sophisticated aesthetic appeal to your living room, bedroom, or entryway. "
            f"Designed with durable materials and refined finishing, it serves as a stunning centerpiece or thoughtful housewarming gift."
        )

def main():
    products = list(products_col.find({}, {"_id": 1, "name": 1, "category": 1, "fabric": 1, "brand": 1}))
    print(f"Updating rich descriptions for {len(products)} products...")

    updates = []
    for i, p in enumerate(products):
        name = p.get("name", "Product")
        cat = p.get("category", "Chikankari Kurtis")
        fabric = p.get("fabric") or ("Cotton" if "Kurtis" in cat else "Ceramic / Wood")
        brand = p.get("brand") or "Nari Pehnawa"
        is_kurti = "Kurtis" in cat

        desc = generate_rich_description(name, cat, fabric, brand)
        high_pool = KURTI_HIGHLIGHTS if is_kurti else HOME_HIGHLIGHTS
        highlights = high_pool[i % len(high_pool)]
        style_tip = STYLE_TIPS.get(cat, "Pair with subtle accessories and comfortable footwear to elevate your outfit.") if is_kurti else "Place in well-lit corners or tabletops to highlight its handcrafted textures."
        
        sleeves = ["3/4 Sleeves", "Full Sleeves", "Short Sleeves", "Sleeveless"]
        sleeve_type = sleeves[i % len(sleeves)] if is_kurti else None
        
        patterns = ["Embroidered", "Printed", "Solid / Plain", "Floral", "Block Print", "Mirror Work", "Woven"]
        pattern = patterns[i % len(patterns)] if is_kurti else "Handcrafted"

        updates.append(
            UpdateOne(
                {"_id": p["_id"]},
                {
                    "$set": {
                        "description": desc,
                        "highlights": highlights,
                        "style_tip": style_tip,
                        "sleeve_type": sleeve_type,
                        "pattern": pattern,
                        "fabric": fabric,
                        "fit_type": "Regular Fit" if is_kurti else "Standard",
                        "hsn_code": "621133" if is_kurti else "691390",
                    }
                },
            )
        )

    if updates:
        res = products_col.bulk_write(updates)
        print(f"Successfully updated rich descriptions and highlights for {res.modified_count} products!")

if __name__ == "__main__":
    main()
