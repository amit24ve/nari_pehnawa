import json
import os

with open("/www/wwwroot/nari_pehnawa/API_DOCUMENTATION_OPENAPI.json") as f:
    spec = json.load(f)

paths = spec.get("paths", {})
components = spec.get("components", {}).get("schemas", {})

def resolve_schema(schema):
    if not schema:
        return {}
    if "$ref" in schema:
        ref_name = schema["$ref"].split("/")[-1]
        return components.get(ref_name, {})
    return schema

def build_sample_json(schema_obj, depth=0):
    if depth > 3:
        return "{...}"
    s = resolve_schema(schema_obj)
    stype = s.get("type", "object")
    
    if stype == "object":
        props = s.get("properties", {})
        result = {}
        for k, v in props.items():
            vres = resolve_schema(v)
            vtype = vres.get("type", "string")
            default_val = vres.get("default")
            example = vres.get("example")
            
            if example is not None:
                result[k] = example
            elif default_val is not None:
                result[k] = default_val
            elif vtype == "string":
                if "email" in k.lower():
                    result[k] = "user@example.com"
                elif "password" in k.lower():
                    result[k] = "Secret@123"
                elif "id" in k.lower():
                    result[k] = "65f1a2b3c4d5e6f7a8b9c0d1"
                elif "date" in k.lower() or "time" in k.lower():
                    result[k] = "2026-09-08T10:00:00Z"
                elif "url" in k.lower() or "image" in k.lower():
                    result[k] = "https://naripehnawa.com:7100/uploads/sample.jpg"
                elif "phone" in k.lower():
                    result[k] = "+919876543210"
                elif "pincode" in k.lower() or "postal" in k.lower():
                    result[k] = "110001"
                else:
                    result[k] = f"sample_{k}"
            elif vtype in ["integer", "number"]:
                if "price" in k.lower() or "amount" in k.lower() or "total" in k.lower():
                    result[k] = 1999.0
                elif "quantity" in k.lower() or "qty" in k.lower():
                    result[k] = 1
                elif "rating" in k.lower():
                    result[k] = 5
                else:
                    result[k] = 1
            elif vtype == "boolean":
                result[k] = True
            elif vtype == "array":
                item_schema = vres.get("items", {})
                result[k] = [build_sample_json(item_schema, depth+1)]
            else:
                result[k] = "value"
        return result
    elif stype == "array":
        item_schema = s.get("items", {})
        return [build_sample_json(item_schema, depth+1)]
    elif stype in ["integer", "number"]:
        return 1
    elif stype == "boolean":
        return True
    else:
        return "sample_string"

doc = []
doc.append("# 📱 NARI PEHNAWA - COMPLETE MOBILE APP API DOCUMENTATION & INTEGRATION MANUAL")
doc.append("\n**Platform**: Nari Pehnawa E-Commerce (Ethnic & Festive Wear)")
doc.append("**API Architecture**: RESTful JSON API with FastAPI & MongoDB")
doc.append("**API Version**: `2.0.0`")
doc.append("**Generated Date**: 2026-09-08")
doc.append("\n---\n")

doc.append("## 🌐 1. Server Configuration & Endpoints\n")
doc.append("| Environment | Base URL | Usage |")
doc.append("| :--- | :--- | :--- |")
doc.append("| **Production (Direct Port)** | `https://naripehnawa.com:7100` | Direct backend port |")
doc.append("| **Production (Reverse Proxy)** | `https://naripehnawa.com/api` | Web & Mobile API endpoint |")
doc.append("| **Static Uploads / Media** | `https://naripehnawa.com:7100/uploads/{filename}` | Product, banner, profile images |")
doc.append("| **Interactive Swagger UI** | `https://naripehnawa.com:7100/docs` | Live API testing in browser |")
doc.append("| **Interactive ReDoc** | `https://naripehnawa.com:7100/redoc` | Interactive API documentation |")

doc.append("\n### Standard HTTP Request Headers\n")
doc.append("```http")
doc.append("Content-Type: application/json")
doc.append("Accept: application/json")
doc.append("Authorization: Bearer <JWT_ACCESS_TOKEN>  # (Required for authenticated customer/admin endpoints)")
doc.append("```\n")

doc.append("### Standard HTTP Response Status Codes\n")
doc.append("| HTTP Code | Meaning | Description |")
doc.append("| :--- | :--- | :--- |")
doc.append("| `200 OK` | Success | Request succeeded with data payload |")
doc.append("| `201 Created` | Created | Resource successfully created (User, Order, Address, Review) |")
doc.append("| `400 Bad Request` | Client Error | Invalid input parameters, validation failed, or duplicate entry |")
doc.append("| `401 Unauthorized` | Auth Error | Missing, invalid, or expired JWT access token |")
doc.append("| `403 Forbidden` | Access Denied | Normal customer trying to access an Admin-restricted route |")
doc.append("| `404 Not Found` | Not Found | Requested resource ID or endpoint does not exist |")
doc.append("| `500 Server Error` | Server Error | Internal backend exception |")

doc.append("\nError Response JSON Format:")
doc.append("```json")
doc.append(json.dumps({"detail": "Error description message"}, indent=2))
doc.append("```\n")

doc.append("---\n")
doc.append("## 📑 2. Table of API Modules")
modules_meta = [
    ("Auth", "🔐 1. Authentication & User Onboarding"),
    ("Users", "👤 2. User Profile, Security & Preferences"),
    ("Products", "👗 3. Products Catalog & Details"),
    ("Categories", "📂 4. Categories & Subcategories"),
    ("Cart", "🛒 5. Shopping Cart & Guest Cart Sync"),
    ("Wishlist", "💖 6. Wishlist & Guest Sync"),
    ("Addresses", "📍 7. Delivery Addresses Management"),
    ("Payments", "💳 8. Payment & Checkout (Razorpay + COD)"),
    ("Orders", "📦 9. Order Management & Tracking"),
    ("Shipping", "🚚 10. Shipping, Courier & Logistics (Shiprocket)"),
    ("Coupons", "🏷️ 11. Coupons, Vouchers & Discounts"),
    ("Reviews", "⭐ 12. Product Ratings & Customer Reviews"),
    ("Returns", "🔄 13. Returns & Refunds Management"),
    ("Exchanges", "🔁 14. Product Exchange Requests"),
    ("WatchAndBuyReels", "🎬 15. Video Commerce & Reels"),
    ("CelebLooks", "🌟 16. Celebrity Looks & Shop the Look"),
    ("Slider", "🖼️ 17. Banners & Home Sliders"),
    ("Brands", "🏷️ 18. Featured Brands"),
    ("Inquiries", "💬 19. Customer Inquiries & Support"),
    ("Invoices", "📄 20. Invoices & Receipts"),
    ("Upload", "📤 21. Media File Upload"),
    ("Analytics", "📊 22. Analytics & Reports"),
    ("Admin", "⚙️ 23. Admin General Operations")
]

for idx, (tkey, tname) in enumerate(modules_meta, 1):
    anchor = tname.lower().replace(" ", "-").replace(".", "").replace("&", "").replace("(", "").replace(")", "").replace("🔐", "").replace("👤", "").replace("👗", "").replace("📂", "").replace("🛒", "").replace("💖", "").replace("📍", "").replace("💳", "").replace("📦", "").replace("🚚", "").replace("🏷️", "").replace("⭐", "").replace("🔄", "").replace("🔁", "").replace("🎬", "").replace("🌟", "").replace("🖼️", "").replace("💬", "").replace("📄", "").replace("📤", "").replace("📊", "").replace("⚙️", "").strip("-")
    doc.append(f"{idx}. [{tname}](#{anchor})")

doc.append("\n---\n")

for tag_key, section_title in modules_meta:
    doc.append(f"\n## {section_title}\n")
    endpoints = []
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.upper() in ["HEAD", "OPTIONS"]:
                continue
            tags = details.get("tags", [])
            if tag_key in tags or (tag_key.lower() in [t.lower() for t in tags]):
                endpoints.append((method.upper(), path, details))
    
    if not endpoints:
        doc.append("*No endpoints registered in this section.*\n")
        continue

    for method, path, details in sorted(endpoints, key=lambda x: (x[1], x[0])):
        summary = details.get("summary") or details.get("operationId") or ""
        desc = (details.get("description") or "").strip()
        auth_req = "Bearer Token Required" if "current_user" in str(details) or "require_admin" in str(details) or path.startswith("/users/me") or path.startswith("/cart") or path.startswith("/wishlist") or path.startswith("/addresses") else "Public Endpoint"
        
        doc.append(f"### `{method}` `{path}`")
        doc.append(f"- **Summary**: {summary}")
        if desc:
            doc.append(f"- **Description**: {desc}")
        doc.append(f"- **Access**: `{auth_req}`")
        
        # Parameters
        params = details.get("parameters", [])
        if params:
            doc.append("\n**Request Parameters:**")
            doc.append("| Parameter | In | Type | Required | Description |")
            doc.append("| :--- | :--- | :--- | :--- | :--- |")
            for p in params:
                p_name = p.get("name")
                p_in = p.get("in")
                p_req = "✅ Yes" if p.get("required") else "❌ No"
                p_schema = resolve_schema(p.get("schema", {}))
                p_type = p_schema.get("type", "string")
                p_desc = p.get("description", "-") or "-"
                doc.append(f"| `{p_name}` | `{p_in}` | `{p_type}` | {p_req} | {p_desc} |")
        
        # Request Body
        req_body = details.get("requestBody", {})
        if req_body:
            content = req_body.get("content", {})
            for c_type, c_data in content.items():
                schema = c_data.get("schema", {})
                sample_payload = build_sample_json(schema)
                doc.append(f"\n**Request Body Example** (`{c_type}`):")
                doc.append("```json")
                doc.append(json.dumps(sample_payload, indent=2))
                doc.append("```")
        
        # Responses
        responses = details.get("responses", {})
        for status_code, r_data in sorted(responses.items()):
            if status_code.startswith("2"):
                r_desc = r_data.get("description", "Success")
                r_content = r_data.get("content", {}).get("application/json", {})
                if r_content:
                    r_schema = r_content.get("schema", {})
                    sample_res = build_sample_json(r_schema)
                    doc.append(f"\n**Success Response `{status_code}`** ({r_desc}):")
                    doc.append("```json")
                    doc.append(json.dumps(sample_res, indent=2))
                    doc.append("```")
                else:
                    doc.append(f"\n**Success Response `{status_code}`**: `{r_desc}`")
        
        doc.append("\n---\n")

# Step by Step mobile integration
doc.append("\n## 📱 3. Step-by-Step Mobile Integration Workflows\n")
doc.append("### Flow A: Customer Authentication & Registration")
doc.append("1. **Check Email**: Call `GET /auth/check-email?email=user@example.com`.")
doc.append("2. **Send OTP**: Call `POST /auth/send-otp` with `{\"email\": \"user@example.com\"}`.")
doc.append("3. **Verify & Register**: User enters 6-digit OTP. Call `POST /auth/register` with `{name, email, password, otp}`.")
doc.append("4. **Store Token**: Save `access_token` into secure local storage.")
doc.append("5. **Sync Guest Data**: Call `POST /cart/merge` and `POST /wishlist/merge` with locally stored guest items.\n")

doc.append("### Flow B: Razorpay Online Payment & Order Creation")
doc.append("1. **Create Razorpay Order**: Call `POST /payments/razorpay/create-order` passing `{amount: 1999.0, currency: 'INR'}`.")
doc.append("2. **Open Razorpay Mobile SDK**: Pass `order_id`, `amount`, and `key_id` to Razorpay SDK.")
doc.append("3. **Verify Signature**: Upon success, SDK returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.")
doc.append("4. **Finalize Order**: Call `POST /payments/razorpay/verify` with payment signature and full order details.")
doc.append("5. **Clear Cart**: Backend creates order, adjusts stock, and client calls `DELETE /cart/clear`.\n")

doc.append("### Flow C: Cash on Delivery (COD) Checkout")
doc.append("1. Call `POST /payments/cod/create-order` with customer shipping address, items, and total amount.")
doc.append("2. Backend validates stock, creates order with `payment_method: 'COD'` and `payment_status: 'pending'`.\n")

doc.append("### Flow D: Live Order Tracking")
doc.append("1. User enters Order Number (e.g. `ORD-9421`) or AWB code in tracking screen.")
doc.append("2. Call `GET /shipping/track-public/{query}`.")
doc.append("3. Returns live Shiprocket status, courier name, tracking timeline, and current location.\n")

doc.append("### Flow E: Video Commerce & Reels Shopping")
doc.append("1. Fetch reels list via `GET /reels/`.")
doc.append("2. In mobile video player, overlay product details linked to `product_id`.")
doc.append("3. User can tap 'Buy Now' or 'Add to Cart' directly from the playing reel video.\n")

doc.append("---\n")
doc.append("## 💻 4. Mobile Code Integration Examples\n")
doc.append("### Flutter (Dart) Client Example:")
doc.append("```dart\nimport 'dart:convert';\nimport 'package:http/http.dart' as http;\n\nclass NariPehnawaApi {\n  static const String baseUrl = 'https://naripehnawa.com:7100';\n  String? token;\n\n  NariPehnawaApi({this.token});\n\n  Map<String, String> get headers => {\n    'Content-Type': 'application/json',\n    'Accept': 'application/json',\n    if (token != null) 'Authorization': 'Bearer $token',\n  };\n\n  Future<List<dynamic>> getProducts({String? category, String? search}) async {\n    final queryParams = {\n      if (category != null) 'category': category,\n      if (search != null) 'search': search,\n    };\n    final uri = Uri.parse('$baseUrl/products/').replace(queryParameters: queryParams);\n    final response = await http.get(uri, headers: headers);\n    if (response.statusCode == 200) {\n      return jsonDecode(response.body);\n    }\n    throw Exception('Failed to load products: ${response.body}');\n  }\n}\n```\n")

doc.append("### React Native / Axios Client Example:")
doc.append("```javascript\nimport axios from 'axios';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\nconst apiClient = axios.create({\n  baseURL: 'https://naripehnawa.com:7100',\n  headers: {\n    'Content-Type': 'application/json',\n    'Accept': 'application/json',\n  },\n});\n\napiClient.interceptors.request.use(async (config) => {\n  const token = await AsyncStorage.getItem('user_token');\n  if (token) {\n    config.headers.Authorization = `Bearer ${token}`;\n  }\n  return config;\n});\n\nexport const ProductService = {\n  getAll: (params) => apiClient.get('/products/', { params }),\n  getById: (id) => apiClient.get(`/products/${id}`),\n};\nexport default apiClient;\n```\n")

doc.append("\n---\n")
doc.append("## ✅ Summary of All Available APIs\n")
doc.append(f"Total Active API Endpoints: **{len(paths)} unique paths ({sum(len(m) for m in paths.values())} total operations)**.")
doc.append("\nThis document can be directly uploaded to Postman, Notion, Google Docs, or provided to mobile app developers.")

final_text = "\n".join(doc)
target_file = "/www/wwwroot/nari_pehnawa/NARI_PEHNAWA_COMPLETE_API_DOCUMENTATION.md"
with open(target_file, "w", encoding="utf-8") as f:
    f.write(final_text)

print(f"File written successfully: {target_file} ({len(final_text)} bytes)")
