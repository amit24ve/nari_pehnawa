# 📱 NARI PEHNAWA - COMPLETE MOBILE APP API DOCUMENTATION & INTEGRATION MANUAL

**Platform**: Nari Pehnawa E-Commerce (Ethnic & Festive Wear)
**API Architecture**: RESTful JSON API with FastAPI & MongoDB
**API Version**: `2.0.0`
**Generated Date**: 2026-09-08

---

## 🌐 1. Server Configuration & Endpoints

| Environment | Base URL | Usage |
| :--- | :--- | :--- |
| **Production (Direct Port)** | `https://naripehnawa.com:7100` | Direct backend port |
| **Production (Reverse Proxy)** | `https://naripehnawa.com/api` | Web & Mobile API endpoint |
| **Static Uploads / Media** | `https://naripehnawa.com:7100/uploads/{filename}` | Product, banner, profile images |
| **Interactive Swagger UI** | `https://naripehnawa.com:7100/docs` | Live API testing in browser |
| **Interactive ReDoc** | `https://naripehnawa.com:7100/redoc` | Interactive API documentation |

### Standard HTTP Request Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT_ACCESS_TOKEN>  # (Required for authenticated customer/admin endpoints)
```

### Standard HTTP Response Status Codes

| HTTP Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | Request succeeded with data payload |
| `201 Created` | Created | Resource successfully created (User, Order, Address, Review) |
| `400 Bad Request` | Client Error | Invalid input parameters, validation failed, or duplicate entry |
| `401 Unauthorized` | Auth Error | Missing, invalid, or expired JWT access token |
| `403 Forbidden` | Access Denied | Normal customer trying to access an Admin-restricted route |
| `404 Not Found` | Not Found | Requested resource ID or endpoint does not exist |
| `500 Server Error` | Server Error | Internal backend exception |

Error Response JSON Format:
```json
{
  "detail": "Error description message"
}
```

---

## 📑 2. Table of API Modules
1. [🔐 1. Authentication & User Onboarding](#1-authentication--user-onboarding)
2. [👤 2. User Profile, Security & Preferences](#2-user-profile,-security--preferences)
3. [👗 3. Products Catalog & Details](#3-products-catalog--details)
4. [📂 4. Categories & Subcategories](#4-categories--subcategories)
5. [🛒 5. Shopping Cart & Guest Cart Sync](#5-shopping-cart--guest-cart-sync)
6. [💖 6. Wishlist & Guest Sync](#6-wishlist--guest-sync)
7. [📍 7. Delivery Addresses Management](#7-delivery-addresses-management)
8. [💳 8. Payment & Checkout (Razorpay + COD)](#8-payment--checkout-razorpay-+-cod)
9. [📦 9. Order Management & Tracking](#9-order-management--tracking)
10. [🚚 10. Shipping, Courier & Logistics (Shiprocket)](#10-shipping,-courier--logistics-shiprocket)
11. [🏷️ 11. Coupons, Vouchers & Discounts](#11-coupons,-vouchers--discounts)
12. [⭐ 12. Product Ratings & Customer Reviews](#12-product-ratings--customer-reviews)
13. [🔄 13. Returns & Refunds Management](#13-returns--refunds-management)
14. [🔁 14. Product Exchange Requests](#14-product-exchange-requests)
15. [🎬 15. Video Commerce & Reels](#15-video-commerce--reels)
16. [🌟 16. Celebrity Looks & Shop the Look](#16-celebrity-looks--shop-the-look)
17. [🖼️ 17. Banners & Home Sliders](#17-banners--home-sliders)
18. [🏷️ 18. Featured Brands](#18-featured-brands)
19. [💬 19. Customer Inquiries & Support](#19-customer-inquiries--support)
20. [📄 20. Invoices & Receipts](#20-invoices--receipts)
21. [📤 21. Media File Upload](#21-media-file-upload)
22. [📊 22. Analytics & Reports](#22-analytics--reports)
23. [⚙️ 23. Admin General Operations](#23-admin-general-operations)

---


## 🔐 1. Authentication & User Onboarding

### `GET` `/auth/check-email`
- **Summary**: Check Email
- **Description**: Check if an email already exists in the database
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `query` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/auth/forgot-password/reset`
- **Summary**: Forgot Password Reset
- **Description**: Verify OTP and reset password
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com",
  "otp": "sample_otp",
  "new_password": "Secret@123"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/auth/forgot-password/send-otp`
- **Summary**: Forgot Password Send Otp
- **Description**: Send reset password OTP to email
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/auth/google/callback`
- **Summary**: Google Callback
- **Description**: Handles Google's redirect back, logs the user in (or auto-creates
a new "customer" account), then redirects to the frontend with a
ready-to-use access token. Google sign-in can NEVER log in or create
an admin account — admins must still use the password login.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `code` | `query` | `string` | ❌ No | - |
| `error` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/auth/google/login`
- **Summary**: Google Login
- **Description**: Redirects the browser to Google's OAuth consent screen.
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/auth/login`
- **Summary**: Login
- **Description**: Login endpoint - returns access token and user info
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com",
  "password": "Secret@123"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/auth/logout`
- **Summary**: Logout
- **Description**: Logout endpoint - clears user session
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `authorization` | `header` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/auth/register`
- **Summary**: Register
- **Description**: Register new user endpoint with mandatory Email OTP verification
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com",
  "password": "Secret@123",
  "name": "sample_name",
  "otp": "sample_otp"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/auth/send-otp`
- **Summary**: Send Otp
- **Description**: Send verification OTP to email during registration
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 👤 2. User Profile, Security & Preferences

### `GET` `/users/`
- **Summary**: Get Users
- **Description**: Get all users with pagination and filters (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skip` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |
| `role` | `query` | `string` | ❌ No | - |
| `status` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "name": "User",
    "role": "customer",
    "is_admin": false,
    "age": "sample_age",
    "status": "active",
    "joined_date": "2026-09-08T10:00:00Z",
    "last_login": "sample_last_login",
    "orders_count": 0,
    "phone": "+919876543210",
    "bio": "sample_bio",
    "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
    "avatar": "sample_avatar"
  }
]
```

---

### `POST` `/users/`
- **Summary**: Create User
- **Description**: Create a new user with hashed password
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com",
  "name": "sample_name",
  "password": "Secret@123",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "phone": "+919876543210",
  "bio": "sample_bio"
}
```

**Success Response `201`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "name": "User",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "joined_date": "2026-09-08T10:00:00Z",
  "last_login": "sample_last_login",
  "orders_count": 0,
  "phone": "+919876543210",
  "bio": "sample_bio",
  "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
  "avatar": "sample_avatar"
}
```

---

### `GET` `/users/email/{email}`
- **Summary**: Get User By Email
- **Description**: Get a user by email address
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "name": "User",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "joined_date": "2026-09-08T10:00:00Z",
  "last_login": "sample_last_login",
  "orders_count": 0,
  "phone": "+919876543210",
  "bio": "sample_bio",
  "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
  "avatar": "sample_avatar"
}
```

---

### `GET` `/users/me`
- **Summary**: Get Current User Profile
- **Description**: Get current authenticated user's profile
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "name": "User",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "joined_date": "2026-09-08T10:00:00Z",
  "last_login": "sample_last_login",
  "orders_count": 0,
  "phone": "+919876543210",
  "bio": "sample_bio",
  "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
  "avatar": "sample_avatar"
}
```

---

### `PUT` `/users/me`
- **Summary**: Update Current User Profile V2
- **Description**: Update current authenticated user's profile
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "email": "user@example.com",
  "password": "Secret@123",
  "role": "sample_role",
  "is_admin": "sample_is_admin",
  "age": "sample_age",
  "status": "sample_status",
  "phone": "+919876543210",
  "last_login": "sample_last_login",
  "bio": "sample_bio"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "name": "User",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "joined_date": "2026-09-08T10:00:00Z",
  "last_login": "sample_last_login",
  "orders_count": 0,
  "phone": "+919876543210",
  "bio": "sample_bio",
  "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
  "avatar": "sample_avatar"
}
```

---

### `POST` `/users/me/change-password`
- **Summary**: Change Password
- **Description**: Change current user's password
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "current_password": "Secret@123",
  "new_password": "Secret@123"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/users/me/settings`
- **Summary**: Get User Settings
- **Description**: Get current user's settings
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/users/me/settings`
- **Summary**: Update User Settings
- **Description**: Update current user's settings
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "notifications": "sample_notifications",
  "privacy": "sample_privacy"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `DELETE` `/users/{user_id}`
- **Summary**: Delete User
- **Description**: Delete a user (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/users/{user_id}`
- **Summary**: Get User
- **Description**: Get a specific user by ID (Authenticated users only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "name": "User",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "joined_date": "2026-09-08T10:00:00Z",
  "last_login": "sample_last_login",
  "orders_count": 0,
  "phone": "+919876543210",
  "bio": "sample_bio",
  "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
  "avatar": "sample_avatar"
}
```

---

### `PUT` `/users/{user_id}`
- **Summary**: Update User
- **Description**: Update user information (User can update own profile, Admin can update any)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "email": "user@example.com",
  "password": "Secret@123",
  "role": "sample_role",
  "is_admin": "sample_is_admin",
  "age": "sample_age",
  "status": "sample_status",
  "phone": "+919876543210",
  "last_login": "sample_last_login",
  "bio": "sample_bio"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "name": "User",
  "role": "customer",
  "is_admin": false,
  "age": "sample_age",
  "status": "active",
  "joined_date": "2026-09-08T10:00:00Z",
  "last_login": "sample_last_login",
  "orders_count": 0,
  "phone": "+919876543210",
  "bio": "sample_bio",
  "auth_provider": "65f1a2b3c4d5e6f7a8b9c0d1",
  "avatar": "sample_avatar"
}
```

---

### `GET` `/users/{user_id}/details`
- **Summary**: Get User Detailed View
- **Description**: Get full user details including addresses and complete order history (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/users/{user_id}/reset-password`
- **Summary**: Admin Reset User Password
- **Description**: Admin endpoint to reset any user's password directly
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 👗 3. Products Catalog & Details

### `GET` `/products/`
- **Summary**: Get Products
- **Description**: Get all products with filters and pagination
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skip` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |
| `category` | `query` | `string` | ❌ No | - |
| `on_sale` | `query` | `string` | ❌ No | - |
| `is_new` | `query` | `string` | ❌ No | - |
| `min_price` | `query` | `string` | ❌ No | - |
| `max_price` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |
| `sort_by` | `query` | `string` | ❌ No | - |
| `sort_order` | `query` | `integer` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "name": "sample_name",
    "brand": "Nari Pehnawa",
    "price": 1999.0,
    "original_price": "sample_original_price",
    "discount": "sample_discount",
    "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
    "images": [],
    "category": "sample_category",
    "sub_category": "sample_sub_category",
    "description": "sample_description",
    "highlights": [],
    "style_tip": "sample_style_tip",
    "fit_type": "sample_fit_type",
    "viewers_count": 0,
    "sold_24h": 0,
    "wishlist_count": 0,
    "q_and_a": [],
    "on_sale": false,
    "is_new": false,
    "in_stock": true,
    "stock_quantity": 100,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "size_stock": {},
    "colors": [],
    "fabric": "sample_fabric",
    "pattern": "sample_pattern",
    "sleeve_type": "sample_sleeve_type",
    "rating": 0.0,
    "review_count": 0,
    "tags": [],
    "hsn_code": "sample_hsn_code",
    "delivery_charge": 0.0,
    "pickup_location": "sample_pickup_location",
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z"
  }
]
```

---

### `POST` `/products/`
- **Summary**: Create Product
- **Description**: Create a new product (Admin only)
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "brand": "Nari Pehnawa",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "discount": "sample_discount",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "images": [],
  "category": "sample_category",
  "sub_category": "sample_sub_category",
  "description": "sample_description",
  "highlights": [],
  "style_tip": "sample_style_tip",
  "fit_type": "sample_fit_type",
  "viewers_count": 0,
  "sold_24h": 0,
  "wishlist_count": 0,
  "q_and_a": [],
  "on_sale": false,
  "is_new": false,
  "in_stock": true,
  "stock_quantity": 100,
  "sizes": [
    "S",
    "M",
    "L",
    "XL"
  ],
  "size_stock": {},
  "colors": [],
  "fabric": "sample_fabric",
  "pattern": "sample_pattern",
  "sleeve_type": "sample_sleeve_type",
  "rating": 0.0,
  "review_count": 0,
  "tags": [],
  "hsn_code": "sample_hsn_code",
  "delivery_charge": 0.0,
  "pickup_location": "sample_pickup_location"
}
```

**Success Response `201`** (Successful Response):
```json
{
  "name": "sample_name",
  "brand": "Nari Pehnawa",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "discount": "sample_discount",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "images": [],
  "category": "sample_category",
  "sub_category": "sample_sub_category",
  "description": "sample_description",
  "highlights": [],
  "style_tip": "sample_style_tip",
  "fit_type": "sample_fit_type",
  "viewers_count": 0,
  "sold_24h": 0,
  "wishlist_count": 0,
  "q_and_a": [],
  "on_sale": false,
  "is_new": false,
  "in_stock": true,
  "stock_quantity": 100,
  "sizes": [
    "S",
    "M",
    "L",
    "XL"
  ],
  "size_stock": {},
  "colors": [],
  "fabric": "sample_fabric",
  "pattern": "sample_pattern",
  "sleeve_type": "sample_sleeve_type",
  "rating": 0.0,
  "review_count": 0,
  "tags": [],
  "hsn_code": "sample_hsn_code",
  "delivery_charge": 0.0,
  "pickup_location": "sample_pickup_location",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `GET` `/products/count`
- **Summary**: Get Product Count
- **Description**: Get total count of products matching filters
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `category` | `query` | `string` | ❌ No | - |
| `on_sale` | `query` | `string` | ❌ No | - |
| `is_new` | `query` | `string` | ❌ No | - |
| `min_price` | `query` | `string` | ❌ No | - |
| `max_price` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `DELETE` `/products/{product_id}`
- **Summary**: Delete Product
- **Description**: Delete a product (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/products/{product_id}`
- **Summary**: Get Product
- **Description**: Get a single product by ID
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "name": "sample_name",
  "brand": "Nari Pehnawa",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "discount": "sample_discount",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "images": [],
  "category": "sample_category",
  "sub_category": "sample_sub_category",
  "description": "sample_description",
  "highlights": [],
  "style_tip": "sample_style_tip",
  "fit_type": "sample_fit_type",
  "viewers_count": 0,
  "sold_24h": 0,
  "wishlist_count": 0,
  "q_and_a": [],
  "on_sale": false,
  "is_new": false,
  "in_stock": true,
  "stock_quantity": 100,
  "sizes": [
    "S",
    "M",
    "L",
    "XL"
  ],
  "size_stock": {},
  "colors": [],
  "fabric": "sample_fabric",
  "pattern": "sample_pattern",
  "sleeve_type": "sample_sleeve_type",
  "rating": 0.0,
  "review_count": 0,
  "tags": [],
  "hsn_code": "sample_hsn_code",
  "delivery_charge": 0.0,
  "pickup_location": "sample_pickup_location",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `PUT` `/products/{product_id}`
- **Summary**: Update Product
- **Description**: Update a product (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "brand": "sample_brand",
  "price": "sample_price",
  "original_price": "sample_original_price",
  "discount": "sample_discount",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "images": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "category": "sample_category",
  "sub_category": "sample_sub_category",
  "description": "sample_description",
  "highlights": "sample_highlights",
  "style_tip": "sample_style_tip",
  "fit_type": "sample_fit_type",
  "viewers_count": "sample_viewers_count",
  "sold_24h": "sample_sold_24h",
  "wishlist_count": "sample_wishlist_count",
  "q_and_a": "sample_q_and_a",
  "on_sale": "sample_on_sale",
  "is_new": "sample_is_new",
  "in_stock": "sample_in_stock",
  "stock_quantity": "sample_stock_quantity",
  "sizes": "sample_sizes",
  "size_stock": "sample_size_stock",
  "colors": "sample_colors",
  "fabric": "sample_fabric",
  "pattern": "sample_pattern",
  "sleeve_type": "sample_sleeve_type",
  "tags": "sample_tags",
  "hsn_code": "sample_hsn_code",
  "delivery_charge": "sample_delivery_charge",
  "pickup_location": "sample_pickup_location"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "name": "sample_name",
  "brand": "Nari Pehnawa",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "discount": "sample_discount",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "images": [],
  "category": "sample_category",
  "sub_category": "sample_sub_category",
  "description": "sample_description",
  "highlights": [],
  "style_tip": "sample_style_tip",
  "fit_type": "sample_fit_type",
  "viewers_count": 0,
  "sold_24h": 0,
  "wishlist_count": 0,
  "q_and_a": [],
  "on_sale": false,
  "is_new": false,
  "in_stock": true,
  "stock_quantity": 100,
  "sizes": [
    "S",
    "M",
    "L",
    "XL"
  ],
  "size_stock": {},
  "colors": [],
  "fabric": "sample_fabric",
  "pattern": "sample_pattern",
  "sleeve_type": "sample_sleeve_type",
  "rating": 0.0,
  "review_count": 0,
  "tags": [],
  "hsn_code": "sample_hsn_code",
  "delivery_charge": 0.0,
  "pickup_location": "sample_pickup_location",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `POST` `/products/{product_id}/share-email`
- **Summary**: Share Product Email
- **Description**: Send product link email to customer (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com",
  "custom_message": "sample_custom_message"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📂 4. Categories & Subcategories

### `GET` `/categories/`
- **Summary**: Get Categories
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `is_active` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "name": "sample_name",
    "tagline": "sample_tagline",
    "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
    "link": "sample_link",
    "border_color": "#dc2626",
    "display_order": 0,
    "is_active": true,
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z"
  }
]
```

---

### `POST` `/categories/`
- **Summary**: Create Category
- **Description**: Create a new category (Admin only)
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "tagline": "sample_tagline",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "link": "sample_link",
  "border_color": "#dc2626",
  "display_order": 0,
  "is_active": true
}
```

**Success Response `201`** (Successful Response):
```json
{
  "name": "sample_name",
  "tagline": "sample_tagline",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "link": "sample_link",
  "border_color": "#dc2626",
  "display_order": 0,
  "is_active": true,
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `DELETE` `/categories/{category_id}`
- **Summary**: Delete Category
- **Description**: Delete a category (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `category_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/categories/{category_id}`
- **Summary**: Get Category
- **Description**: Get a specific category by ID
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `category_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "name": "sample_name",
  "tagline": "sample_tagline",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "link": "sample_link",
  "border_color": "#dc2626",
  "display_order": 0,
  "is_active": true,
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `PUT` `/categories/{category_id}`
- **Summary**: Update Category
- **Description**: Update a category (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `category_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "tagline": "sample_tagline",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "link": "sample_link",
  "border_color": "sample_border_color",
  "display_order": "sample_display_order",
  "is_active": "sample_is_active"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "name": "sample_name",
  "tagline": "sample_tagline",
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "link": "sample_link",
  "border_color": "#dc2626",
  "display_order": 0,
  "is_active": true,
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---


## 🛒 5. Shopping Cart & Guest Cart Sync

### `GET` `/cart/`
- **Summary**: Get Cart
- **Description**: Get current user's cart
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/cart/add`
- **Summary**: Add To Cart
- **Description**: Add item to cart or increase quantity if same product+size exists
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "name": "sample_name",
  "price": 1999.0,
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "size": "sample_size",
  "color": "sample_color",
  "quantity": 1
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `DELETE` `/cart/clear`
- **Summary**: Clear Cart
- **Description**: Clear all items from cart
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `DELETE` `/cart/item/{product_id}`
- **Summary**: Remove Cart Item
- **Description**: Remove a specific item from cart
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |
| `size` | `query` | `string` | ✅ Yes | Product size |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/cart/item/{product_id}`
- **Summary**: Update Cart Item
- **Description**: Update quantity of a specific cart item (product_id + size)
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |
| `size` | `query` | `string` | ✅ Yes | Product size |

**Request Body Example** (`application/json`):
```json
{
  "quantity": 1
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/cart/merge`
- **Summary**: Merge Cart
- **Description**: Merge guest cart items with authenticated user's cart
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "items": [
    {
      "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "name": "sample_name",
      "price": 1999.0,
      "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
      "size": "sample_size",
      "color": "sample_color",
      "quantity": 1
    }
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 💖 6. Wishlist & Guest Sync

### `DELETE` `/wishlist/`
- **Summary**: Clear Wishlist
- **Description**: Clear all wishlist items for the current user
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/wishlist/`
- **Summary**: Get Wishlist
- **Description**: Get all wishlist items for the current user
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "added_at": "sample_added_at",
    "product": "sample_product"
  }
]
```

---

### `POST` `/wishlist/`
- **Summary**: Add To Wishlist
- **Description**: Add a product to wishlist
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "product_id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Success Response `201`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "added_at": "sample_added_at"
}
```

---

### `GET` `/wishlist/check/{product_id}`
- **Summary**: Check In Wishlist
- **Description**: Check if a product is in the wishlist
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/wishlist/merge`
- **Summary**: Merge Wishlist
- **Description**: Merge guest wishlist items with user wishlist
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "product_ids": [
    "sample_string"
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `DELETE` `/wishlist/{product_id}`
- **Summary**: Remove From Wishlist
- **Description**: Remove a product from wishlist
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📍 7. Delivery Addresses Management

### `GET` `/addresses/`
- **Summary**: Get User Addresses
- **Description**: Get all addresses for the current user
- **Access**: `Bearer Token Required`

**Success Response `200`** (Successful Response):
```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "type": "sample_type",
    "full_name": "sample_full_name",
    "phone": "+919876543210",
    "address_line1": "sample_address_line1",
    "address_line2": "sample_address_line2",
    "city": "sample_city",
    "state": "sample_state",
    "pincode": "110001",
    "is_default": false
  }
]
```

---

### `POST` `/addresses/`
- **Summary**: Create Address
- **Description**: Create a new address for the current user
- **Access**: `Bearer Token Required`

**Request Body Example** (`application/json`):
```json
{
  "type": "home",
  "full_name": "sample_full_name",
  "phone": "+919876543210",
  "address_line1": "sample_address_line1",
  "address_line2": "sample_address_line2",
  "city": "sample_city",
  "state": "sample_state",
  "pincode": "110001",
  "is_default": false
}
```

**Success Response `201`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "type": "sample_type",
  "full_name": "sample_full_name",
  "phone": "+919876543210",
  "address_line1": "sample_address_line1",
  "address_line2": "sample_address_line2",
  "city": "sample_city",
  "state": "sample_state",
  "pincode": "110001",
  "is_default": false
}
```

---

### `DELETE` `/addresses/{address_id}`
- **Summary**: Delete Address
- **Description**: Delete an address
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `address_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/addresses/{address_id}`
- **Summary**: Get Address
- **Description**: Get a specific address by ID
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `address_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "type": "sample_type",
  "full_name": "sample_full_name",
  "phone": "+919876543210",
  "address_line1": "sample_address_line1",
  "address_line2": "sample_address_line2",
  "city": "sample_city",
  "state": "sample_state",
  "pincode": "110001",
  "is_default": false
}
```

---

### `PUT` `/addresses/{address_id}`
- **Summary**: Update Address
- **Description**: Update an address
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `address_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "type": "sample_type",
  "full_name": "sample_full_name",
  "phone": "+919876543210",
  "address_line1": "sample_address_line1",
  "address_line2": "sample_address_line2",
  "city": "sample_city",
  "state": "sample_state",
  "pincode": "110001",
  "is_default": "sample_is_default"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "type": "sample_type",
  "full_name": "sample_full_name",
  "phone": "+919876543210",
  "address_line1": "sample_address_line1",
  "address_line2": "sample_address_line2",
  "city": "sample_city",
  "state": "sample_state",
  "pincode": "110001",
  "is_default": false
}
```

---

### `PUT` `/addresses/{address_id}/set-default`
- **Summary**: Set Default Address
- **Description**: Set an address as default
- **Access**: `Bearer Token Required`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `address_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 💳 8. Payment & Checkout (Razorpay + COD)

### `GET` `/payments/`
- **Summary**: Get All Payments
- **Description**: List all payment records (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skip` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |
| `status` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/payments/cod/create-order`
- **Summary**: Create Cod Order
- **Description**: Create a Cash-on-Delivery order. Unlike Razorpay orders, no payment has
happened yet at this point, so stock IS validated before the order is
created — a customer can never place a COD order for something that's
already out of stock.
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/payments/logs/{razorpay_order_id}`
- **Summary**: Get Payment Logs
- **Description**: Full audit trail for a Razorpay order (Admin only) — every event
from order_created through captured/failed/webhook reconciliation.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `razorpay_order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/payments/razorpay/create-order`
- **Summary**: Create Razorpay Order
- **Description**: Step 1 of online checkout.
Client sends { amount, currency?, idempotency_key?, items? }.
Returns razorpay_order_id + key_id for the Razorpay checkout widget.

idempotency_key (optional, backward compatible): if the same key is
sent again within a short window (e.g. the customer double-clicks "Pay
Now" or the request is retried after a network blip), the SAME
Razorpay order is returned instead of creating a second one.

items (optional, backward compatible): if provided, stock is
pre-validated before the Razorpay order is created, so customers never
get to the payment screen for something that's already out of stock.
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/payments/razorpay/verify`
- **Summary**: Verify Razorpay Payment
- **Description**: Step 2 of online checkout.
Verifies HMAC signature, records payment, creates order, reduces
inventory, records coupon usage, sends notifications, triggers
Shiprocket.

Retry-safe: if this is called twice for the same razorpay_payment_id
(e.g. the frontend retried after a slow response), the SECOND call
detects the payment is already attached to an order and returns that
same order instead of creating a duplicate.
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/payments/razorpay/webhook`
- **Summary**: Razorpay Webhook
- **Description**: Server-to-server reconciliation endpoint. Configure this URL in the
Razorpay Dashboard -> Settings -> Webhooks:
    https://naripehnawa.com:7100/payments/razorpay/webhook
Subscribe to: payment.captured, payment.failed, refund.created,
refund.processed.

Why this matters even though /razorpay/verify already handles the
happy path: if the customer's browser closes/loses network right after
paying but before the verify call completes, the order would otherwise
never get created/updated. The webhook is Razorpay's own guarantee
that we hear about the payment outcome regardless of what the browser
does.

Note: the webhook alone cannot create a brand-new order (it has no
knowledge of the cart/shipping address) — it reconciles the `payments`
record's status and logs the event. If a captured payment arrives here
with no matching order yet, it's flagged for manual admin review
rather than silently dropped.
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/payments/retry/{order_id}`
- **Summary**: Retry Payment
- **Description**: Creates a fresh Razorpay order for an existing app order whose payment
previously failed, so the customer can pay again without re-entering
their address/cart. Only allowed while the order's payment_status is
still 'pending' or 'failed' — an already-captured or COD order cannot
be "retried".
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/payments/stats`
- **Summary**: Get Payment Stats
- **Description**: Payment statistics for admin dashboard (Admin only).
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📦 9. Order Management & Tracking

### `GET` `/orders/`
- **Summary**: Get Orders
- **Description**: Get all orders with filters (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skip` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |
| `status` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/orders/`
- **Summary**: Create Order
- **Description**: Create a new order
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "items": [
    {
      "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "product_name": "sample_product_name",
      "product_image": "https://naripehnawa.com:7100/uploads/sample.jpg",
      "quantity": 1,
      "size": "sample_size",
      "color": "sample_color",
      "price": 1999.0,
      "total": 1999.0,
      "hsn_code": "sample_hsn_code"
    }
  ],
  "shipping_address": "value",
  "subtotal": 1999.0,
  "discount": 0.0,
  "shipping_cost": 0.0,
  "tax": 0.0,
  "total_amount": 1999.0,
  "payment_method": "COD",
  "notes": "sample_notes"
}
```

**Success Response `201`** (Successful Response):
```json
{
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "items": [
    {
      "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "product_name": "sample_product_name",
      "product_image": "https://naripehnawa.com:7100/uploads/sample.jpg",
      "quantity": 1,
      "size": "sample_size",
      "color": "sample_color",
      "price": 1999.0,
      "total": 1999.0,
      "hsn_code": "sample_hsn_code"
    }
  ],
  "shipping_address": "value",
  "subtotal": 1999.0,
  "discount": 0.0,
  "shipping_cost": 0.0,
  "tax": 0.0,
  "total_amount": 1999.0,
  "payment_method": "COD",
  "notes": "sample_notes",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "order_number": "sample_order_number",
  "status": "pending",
  "payment_status": "pending",
  "tracking_number": "sample_tracking_number",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z",
  "estimated_delivery": "sample_estimated_delivery",
  "staff_assigned": "sample_staff_assigned",
  "warehouse_assigned": "sample_warehouse_assigned",
  "courier_name": "sample_courier_name"
}
```

---

### `GET` `/orders/cancellations/list`
- **Summary**: List Cancellation Requests
- **Description**: Admin: list all cancellation requests, optionally filtered by status.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/orders/cancellations/{cancellation_id}/review`
- **Summary**: Review Cancellation Request
- **Description**: Admin approves or rejects a pending cancellation request.
Body: { "action": "approve" | "reject", "admin_notes": "..." (optional) }
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cancellation_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/orders/my-orders`
- **Summary**: Get My Orders
- **Description**: Get current user's orders with filters
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/orders/user/{user_id}`
- **Summary**: Get User Orders
- **Description**: Get user's orders (Authenticated users only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "items": [
      {
        "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
        "product_name": "sample_product_name",
        "product_image": "https://naripehnawa.com:7100/uploads/sample.jpg",
        "quantity": 1,
        "size": "sample_size",
        "color": "sample_color",
        "price": 1999.0,
        "total": 1999.0,
        "hsn_code": "sample_hsn_code"
      }
    ],
    "shipping_address": "value",
    "subtotal": 1999.0,
    "discount": 0.0,
    "shipping_cost": 0.0,
    "tax": 0.0,
    "total_amount": 1999.0,
    "payment_method": "COD",
    "notes": "sample_notes",
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "order_number": "sample_order_number",
    "status": "pending",
    "payment_status": "pending",
    "tracking_number": "sample_tracking_number",
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z",
    "estimated_delivery": "sample_estimated_delivery",
    "staff_assigned": "sample_staff_assigned",
    "warehouse_assigned": "sample_warehouse_assigned",
    "courier_name": "sample_courier_name"
  }
]
```

---

### `DELETE` `/orders/{order_id}`
- **Summary**: Delete Order
- **Description**: Delete an order (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/orders/{order_id}`
- **Summary**: Get Order
- **Description**: Get order by ID (Authenticated users only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/orders/{order_id}`
- **Summary**: Update Order
- **Description**: Update an order (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "status": "sample_status",
  "payment_status": "sample_payment_status",
  "tracking_number": "sample_tracking_number",
  "notes": "sample_notes",
  "shipping_address": "sample_shipping_address",
  "staff_assigned": "sample_staff_assigned",
  "warehouse_assigned": "sample_warehouse_assigned",
  "courier_name": "sample_courier_name"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "items": [
    {
      "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "product_name": "sample_product_name",
      "product_image": "https://naripehnawa.com:7100/uploads/sample.jpg",
      "quantity": 1,
      "size": "sample_size",
      "color": "sample_color",
      "price": 1999.0,
      "total": 1999.0,
      "hsn_code": "sample_hsn_code"
    }
  ],
  "shipping_address": "value",
  "subtotal": 1999.0,
  "discount": 0.0,
  "shipping_cost": 0.0,
  "tax": 0.0,
  "total_amount": 1999.0,
  "payment_method": "COD",
  "notes": "sample_notes",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "order_number": "sample_order_number",
  "status": "pending",
  "payment_status": "pending",
  "tracking_number": "sample_tracking_number",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z",
  "estimated_delivery": "sample_estimated_delivery",
  "staff_assigned": "sample_staff_assigned",
  "warehouse_assigned": "sample_warehouse_assigned",
  "courier_name": "sample_courier_name"
}
```

---

### `POST` `/orders/{order_id}/cancel-request`
- **Summary**: Request Order Cancellation
- **Description**: Customer requests cancellation of their own order.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "reason": "sample_reason"
}
```

**Success Response `201`** (Successful Response):
```json
{}
```

---

### `GET` `/orders/{order_id}/history`
- **Summary**: Get Order History
- **Description**: Full status-change audit trail for an order — powers a "track order"
timeline on the frontend (e.g. Confirmed -> Packed -> Shipped ->
Delivered with timestamps). Customers may only view their own order's
history; admins may view any.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/orders/{order_id}/resend-notification`
- **Summary**: Resend Order Notification
- **Description**: Re-send customer notification (email/sms/whatsapp) manually from admin dashboard.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/orders/{order_id}/status`
- **Summary**: Update Order Status
- **Description**: Update order status (Admin only). Automatically:
- Logs the transition to `order_logs` (full audit trail).
- Triggers Shiprocket shipment creation the first time an order
  becomes 'confirmed' or 'paid' and doesn't already have a shipment.
- Restores inventory if the new status is 'cancelled' (covers admin
  manually cancelling an order outside the customer cancel-request flow).
- Sends the matching customer notification (packed/shipped/
  out_for_delivery/delivered/cancelled) via email + WhatsApp.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🚚 10. Shipping, Courier & Logistics (Shiprocket)

### `POST` `/shipping/bulk/invoices`
- **Summary**: Bulk Generate Invoices
- **Description**: Generate consolidated invoices for multiple orders in bulk (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "ids": [
    {}
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/bulk/labels`
- **Summary**: Bulk Generate Labels
- **Description**: Generate consolidated shipping labels for multiple shipments in bulk (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_ids": [
    {}
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/bulk/manifests`
- **Summary**: Bulk Generate Manifests
- **Description**: Generate consolidated manifests for multiple shipments in bulk (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_ids": [
    {}
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/bulk/sync`
- **Summary**: Bulk Sync Shipments
- **Description**: Sync tracking/shipping statuses in bulk for multiple shipment IDs (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_ids": [
    {}
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/cancel`
- **Summary**: Cancel Shipment
- **Description**: Cancel a shipment by order_id or a list of AWBs (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "awbs": "sample_awbs"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "success": true,
  "message": "sample_message"
}
```

---

### `GET` `/shipping/courier-serviceability`
- **Summary**: Courier Serviceability
- **Description**: Check courier availability + rates between two pincodes.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `pickup_postcode` | `query` | `string` | ✅ Yes | - |
| `delivery_postcode` | `query` | `string` | ✅ Yes | - |
| `weight` | `query` | `number` | ❌ No | - |
| `cod` | `query` | `boolean` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{
  "available_couriers": [
    {
      "courier_company_id": 1,
      "courier_name": "sample_courier_name",
      "rate": 1,
      "estimated_delivery_days": "sample_estimated_delivery_days",
      "is_cod_available": false,
      "rating": "sample_rating"
    }
  ],
  "recommended_courier_id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

### `POST` `/shipping/create-order`
- **Summary**: Create Shipment
- **Description**: Create a Shiprocket order for an existing app order (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "dimensions": "sample_dimensions"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "success": true,
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "shiprocket_order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "shipment_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "awb_code": "sample_awb_code",
  "courier_name": "sample_courier_name",
  "courier_company_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "pickup_status": "not_scheduled",
  "shipment_status": "new",
  "tracking_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "message": "sample_message"
}
```

---

### `POST` `/shipping/fulfill/{order_id}`
- **Summary**: Fulfill Order
- **Description**: Run the full pipeline for an existing order: create Shiprocket order ->
generate AWB -> assign courier -> schedule pickup -> persist everything.
Optionally accepts a custom pickup_location nickname.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |
| `pickup_location` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/generate-awb`
- **Summary**: Generate Awb
- **Description**: Generate an AWB / assign a courier for a shipment (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_id": 1,
  "courier_id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "success": true,
  "shipment_id": 1,
  "awb_code": "sample_awb_code",
  "courier_name": "sample_courier_name",
  "courier_company_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "message": "sample_message"
}
```

---

### `GET` `/shipping/invoice/{shipment_id}`
- **Summary**: Get Invoice
- **Description**: Generate/fetch the invoice PDF URL for a shipment's Shiprocket order (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `shipment_id` | `path` | `integer` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/shipping/label/{shipment_id}`
- **Summary**: Get Label
- **Description**: Generate/fetch the shipping label PDF URL for a shipment (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `shipment_id` | `path` | `integer` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/manifest/generate`
- **Summary**: Generate Manifest Route
- **Description**: Generate and print manifest for a list of shipment IDs (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_ids": [
    {}
  ]
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/shipping/manifest/{shipment_id}`
- **Summary**: Get Manifest Route
- **Description**: Get or generate the manifest PDF URL for a shipment (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `shipment_id` | `path` | `integer` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/shipping/order/{order_id}`
- **Summary**: Get Order Shipping
- **Description**: Fetch stored shipping/tracking info for an order (owner or admin).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "order_number": "sample_order_number",
  "shiprocket_order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "shipment_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "awb": "sample_awb",
  "tracking_number": "sample_tracking_number",
  "tracking_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "courier_name": "sample_courier_name",
  "pickup_status": "not_scheduled",
  "shipment_status": "new",
  "pickup_date": "2026-09-08T10:00:00Z",
  "delivered_date": "2026-09-08T10:00:00Z",
  "shipping_cost": "sample_shipping_cost",
  "label_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "invoice_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "manifest_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "estimated_delivery": "sample_estimated_delivery",
  "current_status": "sample_current_status"
}
```

---

### `GET` `/shipping/pickup-locations`
- **Summary**: Get Pickup Locations
- **Description**: List all registered pickup addresses/warehouses from Shiprocket (Admin only).
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/reassign-courier`
- **Summary**: Reassign Courier
- **Description**: Cancel the current AWB and reassign a different courier (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_id": 1,
  "courier_id": 1
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/shipping/schedule-pickup`
- **Summary**: Schedule Pickup
- **Description**: Schedule a courier pickup for a shipment (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "shipment_id": 1,
  "pickup_date": "2026-09-08T10:00:00Z"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "success": true,
  "shipment_id": 1,
  "pickup_status": "sample_pickup_status",
  "pickup_scheduled_date": "2026-09-08T10:00:00Z",
  "message": "sample_message"
}
```

---

### `GET` `/shipping/track-public/{query}`
- **Summary**: Track Shipment Public
- **Description**: Unified public order & shipment tracking endpoint.
Supports MongoDB Order ID, Order Number (NP-1002), Shiprocket AWB, or Shipment ID.
No authorization required. Returns customer-safe normalized tracking details.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `query` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/shipping/track/{awb}`
- **Summary**: Track Shipment
- **Description**: Track a shipment by AWB. Any authenticated user may track (order
ownership is enforced at the /shipping/order/{order_id} level).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `awb` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "awb": "sample_awb",
  "current_status": "Unknown",
  "shipment_status": "sample_shipment_status",
  "courier_name": "sample_courier_name",
  "estimated_delivery": "sample_estimated_delivery",
  "delivered_date": "2026-09-08T10:00:00Z",
  "tracking_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "tracking_history": [
    {
      "date": "2026-09-08T10:00:00Z",
      "status": "sample_status",
      "activity": "sample_activity",
      "location": "sample_location"
    }
  ]
}
```

---

### `POST` `/shipping/webhook`
- **Summary**: Shiprocket Webhook
- **Description**: Receives Shiprocket status-update webhooks (order created, pickup
scheduled, in transit, out for delivery, delivered, RTO, cancelled) and
updates the matching order automatically.

Shiprocket calls this endpoint server-to-server, so authentication is
via a shared secret configured on both sides (Shiprocket panel ->
Settings -> API -> Webhook, and SHIPROCKET_WEBHOOK_SECRET here) rather
than a user JWT.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `X-Api-Key` | `header` | `string` | ❌ No | - |

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🏷️ 11. Coupons, Vouchers & Discounts

### `GET` `/coupons/`
- **Summary**: Get Coupons
- **Description**: List all coupons (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `is_active` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "code": "sample_code",
    "type": "sample_type",
    "value": 0.0,
    "description": "sample_description",
    "min_order_value": 0.0,
    "max_discount": "sample_max_discount",
    "usage_limit": "sample_usage_limit",
    "usage_limit_per_user": 1,
    "valid_from": "65f1a2b3c4d5e6f7a8b9c0d1",
    "valid_until": "65f1a2b3c4d5e6f7a8b9c0d1",
    "is_active": true,
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "times_used": 0,
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z"
  }
]
```

---

### `POST` `/coupons/`
- **Summary**: Create Coupon
- **Description**: Create a new coupon (Admin only).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "code": "sample_code",
  "type": "sample_type",
  "value": 0.0,
  "description": "sample_description",
  "min_order_value": 0.0,
  "max_discount": "sample_max_discount",
  "usage_limit": "sample_usage_limit",
  "usage_limit_per_user": 1,
  "valid_from": "65f1a2b3c4d5e6f7a8b9c0d1",
  "valid_until": "65f1a2b3c4d5e6f7a8b9c0d1",
  "is_active": true
}
```

**Success Response `201`** (Successful Response):
```json
{
  "code": "sample_code",
  "type": "sample_type",
  "value": 0.0,
  "description": "sample_description",
  "min_order_value": 0.0,
  "max_discount": "sample_max_discount",
  "usage_limit": "sample_usage_limit",
  "usage_limit_per_user": 1,
  "valid_from": "65f1a2b3c4d5e6f7a8b9c0d1",
  "valid_until": "65f1a2b3c4d5e6f7a8b9c0d1",
  "is_active": true,
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "times_used": 0,
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `POST` `/coupons/validate`
- **Summary**: Validate Coupon
- **Description**: Server-side coupon validation (replaces the old client-only fake
discount codes). Called from the cart/checkout page whenever the
customer applies a code — the returned discount_amount is the only
number the frontend should trust and display.
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "code": "sample_code",
  "subtotal": 1999.0
}
```

**Success Response `200`** (Successful Response):
```json
{
  "valid": true,
  "code": "sample_code",
  "type": "sample_type",
  "discount_amount": 0.0,
  "free_shipping": false,
  "message": "sample_message"
}
```

---

### `DELETE` `/coupons/{coupon_id}`
- **Summary**: Delete Coupon
- **Description**: Delete a coupon (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `coupon_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/coupons/{coupon_id}`
- **Summary**: Get Coupon
- **Description**: Get a single coupon by ID (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `coupon_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "code": "sample_code",
  "type": "sample_type",
  "value": 0.0,
  "description": "sample_description",
  "min_order_value": 0.0,
  "max_discount": "sample_max_discount",
  "usage_limit": "sample_usage_limit",
  "usage_limit_per_user": 1,
  "valid_from": "65f1a2b3c4d5e6f7a8b9c0d1",
  "valid_until": "65f1a2b3c4d5e6f7a8b9c0d1",
  "is_active": true,
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "times_used": 0,
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `PUT` `/coupons/{coupon_id}`
- **Summary**: Update Coupon
- **Description**: Update a coupon (Admin only).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `coupon_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "type": "sample_type",
  "value": "sample_value",
  "description": "sample_description",
  "min_order_value": "sample_min_order_value",
  "max_discount": "sample_max_discount",
  "usage_limit": "sample_usage_limit",
  "usage_limit_per_user": "sample_usage_limit_per_user",
  "valid_from": "65f1a2b3c4d5e6f7a8b9c0d1",
  "valid_until": "65f1a2b3c4d5e6f7a8b9c0d1",
  "is_active": "sample_is_active"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "code": "sample_code",
  "type": "sample_type",
  "value": 0.0,
  "description": "sample_description",
  "min_order_value": 0.0,
  "max_discount": "sample_max_discount",
  "usage_limit": "sample_usage_limit",
  "usage_limit_per_user": 1,
  "valid_from": "65f1a2b3c4d5e6f7a8b9c0d1",
  "valid_until": "65f1a2b3c4d5e6f7a8b9c0d1",
  "is_active": true,
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "times_used": 0,
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---


## ⭐ 12. Product Ratings & Customer Reviews

### `GET` `/reviews/`
- **Summary**: Get All Reviews
- **Description**: Get all reviews with filters (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skip` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |
| `status` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "product_id": "unknown",
    "product_name": "sample_product_name",
    "user_id": "unknown",
    "user_name": "Anonymous",
    "rating": 5,
    "title": "sample_title",
    "comment": "sample_comment",
    "images": [],
    "verified_purchase": false,
    "size_purchased": "sample_size_purchased",
    "color_purchased": "sample_color_purchased",
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "status": "pending",
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z",
    "helpful_count": 0
  }
]
```

---

### `POST` `/reviews/`
- **Summary**: Create Review
- **Description**: Create a new review
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "product_id": "unknown",
  "product_name": "sample_product_name",
  "user_id": "unknown",
  "user_name": "Anonymous",
  "rating": 5,
  "title": "sample_title",
  "comment": "sample_comment",
  "images": [],
  "verified_purchase": false,
  "size_purchased": "sample_size_purchased",
  "color_purchased": "sample_color_purchased"
}
```

**Success Response `201`** (Successful Response):
```json
{
  "product_id": "unknown",
  "product_name": "sample_product_name",
  "user_id": "unknown",
  "user_name": "Anonymous",
  "rating": 5,
  "title": "sample_title",
  "comment": "sample_comment",
  "images": [],
  "verified_purchase": false,
  "size_purchased": "sample_size_purchased",
  "color_purchased": "sample_color_purchased",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "status": "pending",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z",
  "helpful_count": 0
}
```

---

### `GET` `/reviews/product/{product_id}`
- **Summary**: Get Product Reviews
- **Description**: Get reviews for a specific product (only approved reviews for public)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | `path` | `string` | ✅ Yes | - |
| `skip` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "product_id": "unknown",
    "product_name": "sample_product_name",
    "user_id": "unknown",
    "user_name": "Anonymous",
    "rating": 5,
    "title": "sample_title",
    "comment": "sample_comment",
    "images": [],
    "verified_purchase": false,
    "size_purchased": "sample_size_purchased",
    "color_purchased": "sample_color_purchased",
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "status": "pending",
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z",
    "helpful_count": 0
  }
]
```

---

### `DELETE` `/reviews/{review_id}`
- **Summary**: Delete Review
- **Description**: Delete a review (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `review_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/reviews/{review_id}`
- **Summary**: Get Review
- **Description**: Get a specific review
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `review_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "product_id": "unknown",
  "product_name": "sample_product_name",
  "user_id": "unknown",
  "user_name": "Anonymous",
  "rating": 5,
  "title": "sample_title",
  "comment": "sample_comment",
  "images": [],
  "verified_purchase": false,
  "size_purchased": "sample_size_purchased",
  "color_purchased": "sample_color_purchased",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "status": "pending",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z",
  "helpful_count": 0
}
```

---

### `PUT` `/reviews/{review_id}`
- **Summary**: Update Review
- **Description**: Update a review (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `review_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "rating": "sample_rating",
  "title": "sample_title",
  "comment": "sample_comment",
  "images": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "status": "sample_status"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "product_id": "unknown",
  "product_name": "sample_product_name",
  "user_id": "unknown",
  "user_name": "Anonymous",
  "rating": 5,
  "title": "sample_title",
  "comment": "sample_comment",
  "images": [],
  "verified_purchase": false,
  "size_purchased": "sample_size_purchased",
  "color_purchased": "sample_color_purchased",
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "status": "pending",
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z",
  "helpful_count": 0
}
```

---

### `PATCH` `/reviews/{review_id}/approve`
- **Summary**: Approve Review
- **Description**: Approve a review (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `review_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PATCH` `/reviews/{review_id}/reject`
- **Summary**: Reject Review
- **Description**: Reject a review (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `review_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🔄 13. Returns & Refunds Management

### `GET` `/returns/`
- **Summary**: List All Returns
- **Description**: Admin: list all return requests, optionally filtered by status.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/returns/`
- **Summary**: Create Return Request
- **Description**: Customer requests a return for a delivered order (full or partial —
`items` can be a subset of the order's items).
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "items": [
    {
      "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "quantity": 1,
      "reason": "sample_reason"
    }
  ],
  "reason": "sample_reason",
  "comments": "sample_comments"
}
```

**Success Response `201`** (Successful Response):
```json
{}
```

---

### `GET` `/returns/my-returns`
- **Summary**: List My Returns
- **Description**: Customer's own return requests.
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/returns/{return_id}`
- **Summary**: Get Return
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `return_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/returns/{return_id}/action`
- **Summary**: Perform Return Action
- **Description**: Single endpoint for every admin-driven transition:
    approve | reject | schedule_pickup | mark_picked_up | mark_received
    | start_qc | qc_pass | qc_fail

qc_pass automatically initiates the refund and restores inventory for
the returned items (Return Approved -> Refund Initiated -> Restore
Inventory, matching the spec). qc_fail closes the request without a
refund (item failed quality check — e.g. used/damaged beyond what's
eligible), with the reason recorded for the customer to see.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `return_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "action": "sample_action",
  "reason": "sample_reason"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🔁 14. Product Exchange Requests

### `GET` `/exchanges/`
- **Summary**: List All Exchanges
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/exchanges/`
- **Summary**: Create Exchange Request
- **Description**: Customer requests an exchange (e.g. wrong size) for a delivered order.
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "order_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "product_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "quantity": 1,
  "current_size": "sample_current_size",
  "requested_size": "sample_requested_size",
  "reason": "sample_reason",
  "comments": "sample_comments"
}
```

**Success Response `201`** (Successful Response):
```json
{}
```

---

### `GET` `/exchanges/my-exchanges`
- **Summary**: List My Exchanges
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/exchanges/{exchange_id}`
- **Summary**: Get Exchange
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `exchange_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/exchanges/{exchange_id}/action`
- **Summary**: Perform Exchange Action
- **Description**: Single endpoint for every admin-driven transition:
    approve | reject | schedule_pickup | mark_picked_up | qc_pass
    | qc_fail | ship_new_item | mark_delivered

ship_new_item reduces stock for the replacement item (a fresh unit
leaves the warehouse) — the returned original unit was never restored
to sellable stock unless/until it separately passes QC, matching how
exchanges work in practice (the old unit may be defective/wrong-size
but otherwise fine, so restoring it is a deliberate follow-up action
an admin can do via the returns endpoints if appropriate, not automatic
here).
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `exchange_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "action": "sample_action",
  "reason": "sample_reason"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🎬 15. Video Commerce & Reels

### `GET` `/reels/`
- **Summary**: Get Reels
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `active_only` | `query` | `boolean` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "title": "sample_title",
    "video_url": "65f1a2b3c4d5e6f7a8b9c0d1",
    "thumbnail": "sample_thumbnail",
    "price": 1999.0,
    "original_price": "sample_original_price",
    "product_link": "sample_product_link",
    "views": "1.2L",
    "likes": 1200,
    "order": 0,
    "is_active": true,
    "id": "65f1a2b3c4d5e6f7a8b9c0d1"
  }
]
```

---

### `POST` `/reels/`
- **Summary**: Create Reel
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "title": "sample_title",
  "video_url": "65f1a2b3c4d5e6f7a8b9c0d1",
  "thumbnail": "sample_thumbnail",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "product_link": "sample_product_link",
  "views": "1.2L",
  "likes": 1200,
  "order": 0,
  "is_active": true
}
```

**Success Response `201`** (Successful Response):
```json
{
  "title": "sample_title",
  "video_url": "65f1a2b3c4d5e6f7a8b9c0d1",
  "thumbnail": "sample_thumbnail",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "product_link": "sample_product_link",
  "views": "1.2L",
  "likes": 1200,
  "order": 0,
  "is_active": true,
  "id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

### `DELETE` `/reels/{reel_id}`
- **Summary**: Delete Reel
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reel_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/reels/{reel_id}`
- **Summary**: Update Reel
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reel_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "title": "sample_title",
  "video_url": "65f1a2b3c4d5e6f7a8b9c0d1",
  "thumbnail": "sample_thumbnail",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "product_link": "sample_product_link",
  "views": "1.2L",
  "likes": 1200,
  "order": 0,
  "is_active": true
}
```

**Success Response `200`** (Successful Response):
```json
{
  "title": "sample_title",
  "video_url": "65f1a2b3c4d5e6f7a8b9c0d1",
  "thumbnail": "sample_thumbnail",
  "price": 1999.0,
  "original_price": "sample_original_price",
  "product_link": "sample_product_link",
  "views": "1.2L",
  "likes": 1200,
  "order": 0,
  "is_active": true,
  "id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

### `PATCH` `/reels/{reel_id}/toggle`
- **Summary**: Toggle Reel
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reel_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🌟 16. Celebrity Looks & Shop the Look

*No endpoints registered in this section.*


## 🖼️ 17. Banners & Home Sliders

### `GET` `/slider/`
- **Summary**: Get Slides
- **Description**: Public — fetch all slides ordered by `order` field.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `active_only` | `query` | `boolean` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
    "alt": "",
    "title": "sample_title",
    "subtitle": "sample_subtitle",
    "cta_text": "sample_cta_text",
    "cta_link": "sample_cta_link",
    "order": 0,
    "is_active": true,
    "id": "65f1a2b3c4d5e6f7a8b9c0d1"
  }
]
```

---

### `POST` `/slider/`
- **Summary**: Create Slide
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "alt": "",
  "title": "sample_title",
  "subtitle": "sample_subtitle",
  "cta_text": "sample_cta_text",
  "cta_link": "sample_cta_link",
  "order": 0,
  "is_active": true
}
```

**Success Response `201`** (Successful Response):
```json
{
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "alt": "",
  "title": "sample_title",
  "subtitle": "sample_subtitle",
  "cta_text": "sample_cta_text",
  "cta_link": "sample_cta_link",
  "order": 0,
  "is_active": true,
  "id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

### `DELETE` `/slider/{slide_id}`
- **Summary**: Delete Slide
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `slide_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/slider/{slide_id}`
- **Summary**: Update Slide
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `slide_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "alt": "",
  "title": "sample_title",
  "subtitle": "sample_subtitle",
  "cta_text": "sample_cta_text",
  "cta_link": "sample_cta_link",
  "order": 0,
  "is_active": true
}
```

**Success Response `200`** (Successful Response):
```json
{
  "image": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "alt": "",
  "title": "sample_title",
  "subtitle": "sample_subtitle",
  "cta_text": "sample_cta_text",
  "cta_link": "sample_cta_link",
  "order": 0,
  "is_active": true,
  "id": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

### `PATCH` `/slider/{slide_id}/toggle`
- **Summary**: Toggle Slide
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `slide_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 🏷️ 18. Featured Brands

### `GET` `/brands/`
- **Summary**: Get Public Brands
- **Description**: List all active brands for the public storefront
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `is_active` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "sample_name",
    "slug": "sample_slug",
    "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
    "country": "India",
    "description": "sample_description",
    "status": "Active",
    "is_active": true,
    "display_order": 0,
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z"
  }
]
```

---

### `POST` `/brands/`
- **Summary**: Create Brand
- **Description**: Create a new brand (Admin only)
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "slug": "sample_slug",
  "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "country": "India",
  "description": "sample_description",
  "status": "Active",
  "is_active": true,
  "display_order": 0
}
```

**Success Response `201`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "name": "sample_name",
  "slug": "sample_slug",
  "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "country": "India",
  "description": "sample_description",
  "status": "Active",
  "is_active": true,
  "display_order": 0,
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `GET` `/brands/admin/all`
- **Summary**: Get All Brands Admin
- **Description**: List all brands (active and inactive) for admin management
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
[
  {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "sample_name",
    "slug": "sample_slug",
    "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
    "country": "India",
    "description": "sample_description",
    "status": "Active",
    "is_active": true,
    "display_order": 0,
    "created_at": "sample_created_at",
    "updated_at": "2026-09-08T10:00:00Z"
  }
]
```

---

### `DELETE` `/brands/{brand_id}`
- **Summary**: Delete Brand
- **Description**: Delete a brand (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `brand_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/brands/{brand_id}`
- **Summary**: Get Brand
- **Description**: Get single brand details
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `brand_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "name": "sample_name",
  "slug": "sample_slug",
  "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "country": "India",
  "description": "sample_description",
  "status": "Active",
  "is_active": true,
  "display_order": 0,
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---

### `PUT` `/brands/{brand_id}`
- **Summary**: Update Brand
- **Description**: Update a brand (Admin only)
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `brand_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "slug": "sample_slug",
  "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "country": "sample_country",
  "description": "sample_description",
  "status": "sample_status",
  "is_active": "sample_is_active",
  "display_order": "sample_display_order"
}
```

**Success Response `200`** (Successful Response):
```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "name": "sample_name",
  "slug": "sample_slug",
  "logo_url": "https://naripehnawa.com:7100/uploads/sample.jpg",
  "country": "India",
  "description": "sample_description",
  "status": "Active",
  "is_active": true,
  "display_order": 0,
  "created_at": "sample_created_at",
  "updated_at": "2026-09-08T10:00:00Z"
}
```

---


## 💬 19. Customer Inquiries & Support

### `GET` `/inquiries/`
- **Summary**: List Inquiries
- **Description**: Admin API to list customer inquiries
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/inquiries/`
- **Summary**: Submit Inquiry
- **Description**: Public API for customers to submit inquiries / callback requests
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "name": "sample_name",
  "phone": "+919876543210",
  "email": "user@example.com",
  "subject": "General Inquiry",
  "message": "sample_message"
}
```

**Success Response `201`** (Successful Response):
```json
{}
```

---

### `POST` `/inquiries/subscribe`
- **Summary**: Subscribe Newsletter
- **Description**: Subscribe a new email address to the newsletter
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "email": "user@example.com"
}
```

**Success Response `201`** (Successful Response):
```json
{}
```

---

### `DELETE` `/inquiries/{inquiry_id}`
- **Summary**: Delete Inquiry
- **Description**: Admin API to delete inquiry
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `inquiry_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/inquiries/{inquiry_id}/reply`
- **Summary**: Reply Inquiry
- **Description**: Admin API to reply to customer inquiry and update status
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `inquiry_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "reply_message": "sample_reply_message",
  "status": "Resolved"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PATCH` `/inquiries/{inquiry_id}/status`
- **Summary**: Update Inquiry Status
- **Description**: Admin API to update inquiry status
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `inquiry_id` | `path` | `string` | ✅ Yes | - |

**Request Body Example** (`application/json`):
```json
{
  "status": "sample_status"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📄 20. Invoices & Receipts

### `GET` `/invoices/admin/order/{order_id}`
- **Summary**: Admin Get Invoice
- **Description**: Admin: fetch invoice metadata (number, totals) without downloading
the PDF — used by the admin order list to show whether an invoice has
already been generated for an order.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/invoices/order/{order_id}/download`
- **Summary**: Download Invoice
- **Description**: Download the GST-ready PDF invoice for an order. Customers may only
download their own order's invoice; admins may download any.
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `order_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📤 21. Media File Upload

### `POST` `/upload/image`
- **Summary**: Upload Image
- **Description**: Upload an image or video file.
Returns { url, filename } where url is the public path to the file.
- **Access**: `Public Endpoint`

**Request Body Example** (`multipart/form-data`):
```json
{
  "file": "sample_file"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📊 22. Analytics & Reports

### `POST` `/analytics/event`
- **Summary**: Track Event
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "event_type": "sample_event_type",
  "event_data": {},
  "path": "sample_path"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/heatmap/click`
- **Summary**: Track Heatmap Click
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "path": "sample_path",
  "x": 1,
  "y": 1,
  "target_tag": "sample_target_tag",
  "target_text": "sample_target_text"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/heatmap/scroll`
- **Summary**: Track Heatmap Scroll
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "path": "sample_path",
  "max_scroll": 1
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/merge`
- **Summary**: Merge Visitor
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "login_status": "sample_login_status"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/performance`
- **Summary**: Track Performance
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "path": "sample_path",
  "page_load_time": "2026-09-08T10:00:00Z",
  "api_response_time": "2026-09-08T10:00:00Z",
  "error_log": "sample_error_log"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/security`
- **Summary**: Track Security
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "alert_type": "sample_alert_type",
  "details": {}
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/session`
- **Summary**: Start Session
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "referrer": "sample_referrer",
  "traffic_source": "sample_traffic_source",
  "utm_source": "sample_utm_source",
  "utm_medium": "sample_utm_medium",
  "utm_campaign": "sample_utm_campaign",
  "utm_term": "sample_utm_term",
  "utm_content": "sample_utm_content",
  "landing_page": "sample_landing_page",
  "screen_resolution": "sample_screen_resolution",
  "language": "sample_language",
  "timezone": "2026-09-08T10:00:00Z"
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `POST` `/analytics/track`
- **Summary**: Track Pageview
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{
  "visitor_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "session_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "path": "sample_path",
  "title": "sample_title",
  "referrer": "sample_referrer",
  "time_spent": 0,
  "scroll_percentage": 0.0
}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/analytics/visitor-dashboard`
- **Summary**: Get Visitor Intelligence Dashboard
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `date_range` | `query` | `string` | ❌ No | - |
| `country` | `query` | `string` | ❌ No | - |
| `browser` | `query` | `string` | ❌ No | - |
| `os` | `query` | `string` | ❌ No | - |
| `device` | `query` | `string` | ❌ No | - |
| `source` | `query` | `string` | ❌ No | - |
| `visitor_type` | `query` | `string` | ❌ No | - |
| `page` | `query` | `integer` | ❌ No | - |
| `limit` | `query` | `integer` | ❌ No | - |
| `search` | `query` | `string` | ❌ No | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/analytics/visitor/{visitor_id}`
- **Summary**: Get Visitor Profile
- **Access**: `Public Endpoint`

**Request Parameters:**
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `visitor_id` | `path` | `string` | ✅ Yes | - |

**Success Response `200`** (Successful Response):
```json
{}
```

---


## ⚙️ 23. Admin General Operations

### `GET` `/admin/orders/summary`
- **Summary**: Get Orders Summary
- **Description**: Get summary of orders for admin (Admin only)
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/admin/settings/delivery`
- **Summary**: Get Delivery Settings
- **Description**: Get delivery charge settings and free delivery order rules
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `PUT` `/admin/settings/delivery`
- **Summary**: Update Delivery Settings
- **Description**: Update delivery charge rules (Admin only)
- **Access**: `Public Endpoint`

**Request Body Example** (`application/json`):
```json
{}
```

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/admin/stats`
- **Summary**: Get Dashboard Stats
- **Description**: Get dashboard statistics for admin panel (Admin only)
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---

### `GET` `/admin/users/summary`
- **Summary**: Get Users Summary
- **Description**: Get summary of users for admin (Admin only)
- **Access**: `Public Endpoint`

**Success Response `200`** (Successful Response):
```json
{}
```

---


## 📱 3. Step-by-Step Mobile Integration Workflows

### Flow A: Customer Authentication & Registration
1. **Check Email**: Call `GET /auth/check-email?email=user@example.com`.
2. **Send OTP**: Call `POST /auth/send-otp` with `{"email": "user@example.com"}`.
3. **Verify & Register**: User enters 6-digit OTP. Call `POST /auth/register` with `{name, email, password, otp}`.
4. **Store Token**: Save `access_token` into secure local storage.
5. **Sync Guest Data**: Call `POST /cart/merge` and `POST /wishlist/merge` with locally stored guest items.

### Flow B: Razorpay Online Payment & Order Creation
1. **Create Razorpay Order**: Call `POST /payments/razorpay/create-order` passing `{amount: 1999.0, currency: 'INR'}`.
2. **Open Razorpay Mobile SDK**: Pass `order_id`, `amount`, and `key_id` to Razorpay SDK.
3. **Verify Signature**: Upon success, SDK returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
4. **Finalize Order**: Call `POST /payments/razorpay/verify` with payment signature and full order details.
5. **Clear Cart**: Backend creates order, adjusts stock, and client calls `DELETE /cart/clear`.

### Flow C: Cash on Delivery (COD) Checkout
1. Call `POST /payments/cod/create-order` with customer shipping address, items, and total amount.
2. Backend validates stock, creates order with `payment_method: 'COD'` and `payment_status: 'pending'`.

### Flow D: Live Order Tracking
1. User enters Order Number (e.g. `ORD-9421`) or AWB code in tracking screen.
2. Call `GET /shipping/track-public/{query}`.
3. Returns live Shiprocket status, courier name, tracking timeline, and current location.

### Flow E: Video Commerce & Reels Shopping
1. Fetch reels list via `GET /reels/`.
2. In mobile video player, overlay product details linked to `product_id`.
3. User can tap 'Buy Now' or 'Add to Cart' directly from the playing reel video.

---

## 💻 4. Mobile Code Integration Examples

### Flutter (Dart) Client Example:
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class NariPehnawaApi {
  static const String baseUrl = 'https://naripehnawa.com:7100';
  String? token;

  NariPehnawaApi({this.token});

  Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  Future<List<dynamic>> getProducts({String? category, String? search}) async {
    final queryParams = {
      if (category != null) 'category': category,
      if (search != null) 'search': search,
    };
    final uri = Uri.parse('$baseUrl/products/').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load products: ${response.body}');
  }
}
```

### React Native / Axios Client Example:
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://naripehnawa.com:7100',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ProductService = {
  getAll: (params) => apiClient.get('/products/', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
};
export default apiClient;
```


---

## ✅ Summary of All Available APIs

Total Active API Endpoints: **125 unique paths (164 total operations)**.

This document can be directly uploaded to Postman, Notion, Google Docs, or provided to mobile app developers.