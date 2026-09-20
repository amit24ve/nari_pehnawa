# 📱 Nari Pehnawa - Complete Mobile Application API Documentation

> **Version**: 2.0.0  
> **Backend**: FastAPI + MongoDB (Async & Scalable)  
> **Base Production URL**: `https://naripehnawa.com:7100` (or `https://naripehnawa.com/api` through reverse proxy)  
> **Media Static URL**: `https://naripehnawa.com:7100/uploads/<filename>`  
> **Interactive Swagger UI**: `https://naripehnawa.com:7100/docs`  
> **Interactive ReDoc**: `https://naripehnawa.com:7100/redoc`

## 🔑 Mobile App Integration Guidelines

### 1. Common Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <YOUR_ACCESS_TOKEN>  # (Required for authenticated customer/admin endpoints)
```

### 2. Authentication Flow
- **Registration**: Call `POST /auth/send-otp` with user email -> Enter OTP and details in `POST /auth/register` -> Store `access_token` securely in Flutter / React Native Secure Storage / iOS Keychain / Android EncryptedSharedPreferences.
- **Login**: Call `POST /auth/login` with email + password -> Store `access_token`.
- **Guest User Cart & Wishlist Sync**: Mobile users can browse as guests. When they log in, call `POST /cart/merge` and `POST /wishlist/merge` to sync local guest items seamlessly.

---
## 📚 Table of Contents
1. [🔐 Authentication & Authorization](#-1-authentication--authorization)
2. [👤 User Profile & Settings](#-2-user-profile--settings)
3. [👗 Products & Catalog](#-3-products--catalog)
4. [📂 Categories & Subcategories](#-4-categories--subcategories)
5. [🛒 Shopping Cart](#-5-shopping-cart)
6. [💖 Wishlist](#-6-wishlist)
7. [📍 Delivery Addresses](#-7-delivery-addresses)
8. [💳 Payment & Checkout (Razorpay + COD)](#-8-payment--checkout-razorpay--cod)
9. [📦 Orders & Tracking](#-9-orders--tracking)
10. [🚚 Shipping & Logistics (Shiprocket)](#-10-shipping--logistics-shiprocket)
11. [🏷️ Coupons & Discounts](#-11-coupons--discounts)
12. [⭐ Reviews & Ratings](#-12-reviews--ratings)
13. [🔄 Returns & Refunds](#-13-returns--refunds)
14. [🔁 Exchange Requests](#-14-exchange-requests)
15. [🎬 Reels & Video Commerce](#-15-reels--video-commerce)
16. [🌟 Celebrity Looks](#-16-celebrity-looks)
17. [🖼️ Banners & Sliders](#-17-banners--sliders)
18. [🏷️ Brands](#-18-brands)
19. [💬 Inquiries & Contact](#-19-inquiries--contact)
20. [📄 Invoices](#-20-invoices)
21. [📤 Media File Upload](#-21-media-file-upload)
22. [📊 Admin & Analytics](#-22-admin--analytics)

---


## 🔐 1. Authentication & Authorization

### `GET` `/auth/check-email`
**Summary**: Check Email  
**Description**: Check if an email already exists in the database  

**Parameters / Query Params**:
- `email` (query, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/auth/forgot-password/reset`
**Summary**: Forgot Password Reset  
**Description**: Verify OTP and reset password  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
  - `otp`: `string` (required)
  - `new_password`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/auth/forgot-password/send-otp`
**Summary**: Forgot Password Send Otp  
**Description**: Send reset password OTP to email  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/auth/google/callback`
**Summary**: Google Callback  
**Description**: Handles Google's redirect back, logs the user in (or auto-creates
a new "customer" account), then redirects to the frontend with a
ready-to-use access token. Google sign-in can NEVER log in or create
an admin account — admins must still use the password login.  

**Parameters / Query Params**:
- `code` (query, `string`, optional)
- `error` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/auth/google/login`
**Summary**: Google Login  
**Description**: Redirects the browser to Google's OAuth consent screen.  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/auth/login`
**Summary**: Login  
**Description**: Login endpoint - returns access token and user info  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
  - `password`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/auth/logout`
**Summary**: Logout  
**Description**: Logout endpoint - clears user session  

**Parameters / Query Params**:
- `authorization` (header, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/auth/register`
**Summary**: Register  
**Description**: Register new user endpoint with mandatory Email OTP verification  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
  - `password`: `string` (required)
  - `name`: `string` (required)
  - `otp`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/auth/send-otp`
**Summary**: Send Otp  
**Description**: Send verification OTP to email during registration  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 👤 2. User Profile & Settings

### `GET` `/users/`
**Summary**: Get Users  
**Description**: Get all users with pagination and filters (Admin only)  

**Parameters / Query Params**:
- `skip` (query, `integer`, optional)
- `limit` (query, `integer`, optional)
- `role` (query, `string`, optional)
- `status` (query, `string`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `User`
```

---

### `POST` `/users/`
**Summary**: Create User  
**Description**: Create a new user with hashed password  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
  - `name`: `string` (required)
  - `password`: `string` (required)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  - `id`: `string` (required)
  - `email`: `string` (required)
  - `name`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `joined_date`: `string` (optional)
  - `last_login`: `string` (optional)
  - `orders_count`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
  - `auth_provider`: `string` (optional)
  - `avatar`: `string` (optional)
```

---

### `GET` `/users/email/{email}`
**Summary**: Get User By Email  
**Description**: Get a user by email address  

**Parameters / Query Params**:
- `email` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `email`: `string` (required)
  - `name`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `joined_date`: `string` (optional)
  - `last_login`: `string` (optional)
  - `orders_count`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
  - `auth_provider`: `string` (optional)
  - `avatar`: `string` (optional)
```

---

### `GET` `/users/me`
**Summary**: Get Current User Profile  
**Description**: Get current authenticated user's profile  

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `email`: `string` (required)
  - `name`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `joined_date`: `string` (optional)
  - `last_login`: `string` (optional)
  - `orders_count`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
  - `auth_provider`: `string` (optional)
  - `avatar`: `string` (optional)
```

---

### `PUT` `/users/me`
**Summary**: Update Current User Profile V2  
**Description**: Update current authenticated user's profile  

**Request Body** (`application/json`):
```json
  - `name`: `string` (optional)
  - `email`: `string` (optional)
  - `password`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `phone`: `string` (optional)
  - `last_login`: `string` (optional)
  - `bio`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `email`: `string` (required)
  - `name`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `joined_date`: `string` (optional)
  - `last_login`: `string` (optional)
  - `orders_count`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
  - `auth_provider`: `string` (optional)
  - `avatar`: `string` (optional)
```

---

### `POST` `/users/me/change-password`
**Summary**: Change Password  
**Description**: Change current user's password  

**Request Body** (`application/json`):
```json
  - `current_password`: `string` (optional)
  - `new_password`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/users/me/settings`
**Summary**: Get User Settings  
**Description**: Get current user's settings  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/users/me/settings`
**Summary**: Update User Settings  
**Description**: Update current user's settings  

**Request Body** (`application/json`):
```json
  - `notifications`: `string` (optional)
  - `privacy`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `DELETE` `/users/{user_id}`
**Summary**: Delete User  
**Description**: Delete a user (Admin only)  

**Parameters / Query Params**:
- `user_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/users/{user_id}`
**Summary**: Get User  
**Description**: Get a specific user by ID (Authenticated users only)  

**Parameters / Query Params**:
- `user_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `email`: `string` (required)
  - `name`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `joined_date`: `string` (optional)
  - `last_login`: `string` (optional)
  - `orders_count`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
  - `auth_provider`: `string` (optional)
  - `avatar`: `string` (optional)
```

---

### `PUT` `/users/{user_id}`
**Summary**: Update User  
**Description**: Update user information (User can update own profile, Admin can update any)  

**Parameters / Query Params**:
- `user_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `name`: `string` (optional)
  - `email`: `string` (optional)
  - `password`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `phone`: `string` (optional)
  - `last_login`: `string` (optional)
  - `bio`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `email`: `string` (required)
  - `name`: `string` (optional)
  - `role`: `string` (optional)
  - `is_admin`: `string` (optional)
  - `age`: `string` (optional)
  - `status`: `string` (optional)
  - `joined_date`: `string` (optional)
  - `last_login`: `string` (optional)
  - `orders_count`: `string` (optional)
  - `phone`: `string` (optional)
  - `bio`: `string` (optional)
  - `auth_provider`: `string` (optional)
  - `avatar`: `string` (optional)
```

---

### `GET` `/users/{user_id}/details`
**Summary**: Get User Detailed View  
**Description**: Get full user details including addresses and complete order history (Admin only)  

**Parameters / Query Params**:
- `user_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/users/{user_id}/reset-password`
**Summary**: Admin Reset User Password  
**Description**: Admin endpoint to reset any user's password directly  

**Parameters / Query Params**:
- `user_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 👗 3. Products & Catalog

### `GET` `/products/`
**Summary**: Get Products  
**Description**: Get all products with filters and pagination  

**Parameters / Query Params**:
- `skip` (query, `integer`, optional)
- `limit` (query, `integer`, optional)
- `category` (query, `string`, optional)
- `on_sale` (query, `string`, optional)
- `is_new` (query, `string`, optional)
- `min_price` (query, `string`, optional)
- `max_price` (query, `string`, optional)
- `search` (query, `string`, optional)
- `sort_by` (query, `string`, optional)
- `sort_order` (query, `integer`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `Product`
```

---

### `POST` `/products/`
**Summary**: Create Product  
**Description**: Create a new product (Admin only)  

**Request Body** (`application/json`):
```json
  - `name`: `string` (required)
  - `brand`: `string` (optional)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `discount`: `string` (optional)
  - `image`: `string` (required)
  - `images`: `string` (optional)
  - `category`: `string` (required)
  - `sub_category`: `string` (optional)
  - `description`: `string` (optional)
  - `highlights`: `string` (optional)
  - `style_tip`: `string` (optional)
  - `fit_type`: `string` (optional)
  - `viewers_count`: `string` (optional)
  - `sold_24h`: `string` (optional)
  - `wishlist_count`: `string` (optional)
  - `q_and_a`: `string` (optional)
  - `on_sale`: `boolean` (optional)
  - `is_new`: `boolean` (optional)
  - `in_stock`: `boolean` (optional)
  - `stock_quantity`: `integer` (optional)
  - `sizes`: `array` (optional)
  - `size_stock`: `string` (optional)
  - `colors`: `array` (optional)
  - `fabric`: `string` (optional)
  - `pattern`: `string` (optional)
  - `sleeve_type`: `string` (optional)
  - `rating`: `number` (optional)
  - `review_count`: `integer` (optional)
  - `tags`: `array` (optional)
  - `hsn_code`: `string` (optional)
  - `delivery_charge`: `number` (optional)
  - `pickup_location`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  - `name`: `string` (required)
  - `brand`: `string` (optional)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `discount`: `string` (optional)
  - `image`: `string` (required)
  - `images`: `string` (optional)
  - `category`: `string` (required)
  - `sub_category`: `string` (optional)
  - `description`: `string` (optional)
  - `highlights`: `string` (optional)
  - `style_tip`: `string` (optional)
  - `fit_type`: `string` (optional)
  - `viewers_count`: `string` (optional)
  - `sold_24h`: `string` (optional)
  - `wishlist_count`: `string` (optional)
  - `q_and_a`: `string` (optional)
  - `on_sale`: `boolean` (optional)
  - `is_new`: `boolean` (optional)
  - `in_stock`: `boolean` (optional)
  - `stock_quantity`: `integer` (optional)
  - `sizes`: `array` (optional)
  - `size_stock`: `string` (optional)
  - `colors`: `array` (optional)
  - `fabric`: `string` (optional)
  - `pattern`: `string` (optional)
  - `sleeve_type`: `string` (optional)
  - `rating`: `number` (optional)
  - `review_count`: `integer` (optional)
  - `tags`: `array` (optional)
  - `hsn_code`: `string` (optional)
  - `delivery_charge`: `number` (optional)
  - `pickup_location`: `string` (optional)
  - `_id`: `string` (required)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `GET` `/products/count`
**Summary**: Get Product Count  
**Description**: Get total count of products matching filters  

**Parameters / Query Params**:
- `category` (query, `string`, optional)
- `on_sale` (query, `string`, optional)
- `is_new` (query, `string`, optional)
- `min_price` (query, `string`, optional)
- `max_price` (query, `string`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `DELETE` `/products/{product_id}`
**Summary**: Delete Product  
**Description**: Delete a product (Admin only)  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/products/{product_id}`
**Summary**: Get Product  
**Description**: Get a single product by ID  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `name`: `string` (required)
  - `brand`: `string` (optional)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `discount`: `string` (optional)
  - `image`: `string` (required)
  - `images`: `string` (optional)
  - `category`: `string` (required)
  - `sub_category`: `string` (optional)
  - `description`: `string` (optional)
  - `highlights`: `string` (optional)
  - `style_tip`: `string` (optional)
  - `fit_type`: `string` (optional)
  - `viewers_count`: `string` (optional)
  - `sold_24h`: `string` (optional)
  - `wishlist_count`: `string` (optional)
  - `q_and_a`: `string` (optional)
  - `on_sale`: `boolean` (optional)
  - `is_new`: `boolean` (optional)
  - `in_stock`: `boolean` (optional)
  - `stock_quantity`: `integer` (optional)
  - `sizes`: `array` (optional)
  - `size_stock`: `string` (optional)
  - `colors`: `array` (optional)
  - `fabric`: `string` (optional)
  - `pattern`: `string` (optional)
  - `sleeve_type`: `string` (optional)
  - `rating`: `number` (optional)
  - `review_count`: `integer` (optional)
  - `tags`: `array` (optional)
  - `hsn_code`: `string` (optional)
  - `delivery_charge`: `number` (optional)
  - `pickup_location`: `string` (optional)
  - `_id`: `string` (required)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `PUT` `/products/{product_id}`
**Summary**: Update Product  
**Description**: Update a product (Admin only)  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `name`: `string` (optional)
  - `brand`: `string` (optional)
  - `price`: `string` (optional)
  - `original_price`: `string` (optional)
  - `discount`: `string` (optional)
  - `image`: `string` (optional)
  - `images`: `string` (optional)
  - `category`: `string` (optional)
  - `sub_category`: `string` (optional)
  - `description`: `string` (optional)
  - `highlights`: `string` (optional)
  - `style_tip`: `string` (optional)
  - `fit_type`: `string` (optional)
  - `viewers_count`: `string` (optional)
  - `sold_24h`: `string` (optional)
  - `wishlist_count`: `string` (optional)
  - `q_and_a`: `string` (optional)
  - `on_sale`: `string` (optional)
  - `is_new`: `string` (optional)
  - `in_stock`: `string` (optional)
  - `stock_quantity`: `string` (optional)
  - `sizes`: `string` (optional)
  - `size_stock`: `string` (optional)
  - `colors`: `string` (optional)
  - `fabric`: `string` (optional)
  - `pattern`: `string` (optional)
  - `sleeve_type`: `string` (optional)
  - `tags`: `string` (optional)
  - `hsn_code`: `string` (optional)
  - `delivery_charge`: `string` (optional)
  - `pickup_location`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `name`: `string` (required)
  - `brand`: `string` (optional)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `discount`: `string` (optional)
  - `image`: `string` (required)
  - `images`: `string` (optional)
  - `category`: `string` (required)
  - `sub_category`: `string` (optional)
  - `description`: `string` (optional)
  - `highlights`: `string` (optional)
  - `style_tip`: `string` (optional)
  - `fit_type`: `string` (optional)
  - `viewers_count`: `string` (optional)
  - `sold_24h`: `string` (optional)
  - `wishlist_count`: `string` (optional)
  - `q_and_a`: `string` (optional)
  - `on_sale`: `boolean` (optional)
  - `is_new`: `boolean` (optional)
  - `in_stock`: `boolean` (optional)
  - `stock_quantity`: `integer` (optional)
  - `sizes`: `array` (optional)
  - `size_stock`: `string` (optional)
  - `colors`: `array` (optional)
  - `fabric`: `string` (optional)
  - `pattern`: `string` (optional)
  - `sleeve_type`: `string` (optional)
  - `rating`: `number` (optional)
  - `review_count`: `integer` (optional)
  - `tags`: `array` (optional)
  - `hsn_code`: `string` (optional)
  - `delivery_charge`: `number` (optional)
  - `pickup_location`: `string` (optional)
  - `_id`: `string` (required)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `POST` `/products/{product_id}/share-email`
**Summary**: Share Product Email  
**Description**: Send product link email to customer (Admin only).  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
  - `custom_message`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 📂 4. Categories & Subcategories

### `GET` `/categories/`
**Summary**: Get Categories  

**Parameters / Query Params**:
- `is_active` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `Category`
```

---

### `POST` `/categories/`
**Summary**: Create Category  
**Description**: Create a new category (Admin only)  

**Request Body** (`application/json`):
```json
  - `name`: `string` (required)
  - `tagline`: `string` (optional)
  - `image`: `string` (required)
  - `link`: `string` (required)
  - `border_color`: `string` (optional)
  - `display_order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
```

**Response `201`** (Successful Response):
```json
  - `name`: `string` (required)
  - `tagline`: `string` (optional)
  - `image`: `string` (required)
  - `link`: `string` (required)
  - `border_color`: `string` (optional)
  - `display_order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `_id`: `string` (required)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `DELETE` `/categories/{category_id}`
**Summary**: Delete Category  
**Description**: Delete a category (Admin only)  

**Parameters / Query Params**:
- `category_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/categories/{category_id}`
**Summary**: Get Category  
**Description**: Get a specific category by ID  

**Parameters / Query Params**:
- `category_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `name`: `string` (required)
  - `tagline`: `string` (optional)
  - `image`: `string` (required)
  - `link`: `string` (required)
  - `border_color`: `string` (optional)
  - `display_order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `_id`: `string` (required)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `PUT` `/categories/{category_id}`
**Summary**: Update Category  
**Description**: Update a category (Admin only)  

**Parameters / Query Params**:
- `category_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `name`: `string` (optional)
  - `tagline`: `string` (optional)
  - `image`: `string` (optional)
  - `link`: `string` (optional)
  - `border_color`: `string` (optional)
  - `display_order`: `string` (optional)
  - `is_active`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `name`: `string` (required)
  - `tagline`: `string` (optional)
  - `image`: `string` (required)
  - `link`: `string` (required)
  - `border_color`: `string` (optional)
  - `display_order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `_id`: `string` (required)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---


## 🛒 5. Shopping Cart

### `GET` `/cart/`
**Summary**: Get Cart  
**Description**: Get current user's cart  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/cart/add`
**Summary**: Add To Cart  
**Description**: Add item to cart or increase quantity if same product+size exists  

**Request Body** (`application/json`):
```json
  - `product_id`: `string` (required)
  - `name`: `string` (required)
  - `price`: `number` (required)
  - `image`: `string` (optional)
  - `size`: `string` (required)
  - `color`: `string` (optional)
  - `quantity`: `integer` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `DELETE` `/cart/clear`
**Summary**: Clear Cart  
**Description**: Clear all items from cart  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `DELETE` `/cart/item/{product_id}`
**Summary**: Remove Cart Item  
**Description**: Remove a specific item from cart  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)
- `size` (query, `string`, required) - Product size

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/cart/item/{product_id}`
**Summary**: Update Cart Item  
**Description**: Update quantity of a specific cart item (product_id + size)  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)
- `size` (query, `string`, required) - Product size

**Request Body** (`application/json`):
```json
  - `quantity`: `integer` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/cart/merge`
**Summary**: Merge Cart  
**Description**: Merge guest cart items with authenticated user's cart  

**Request Body** (`application/json`):
```json
  - `items`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 💖 6. Wishlist

### `DELETE` `/wishlist/`
**Summary**: Clear Wishlist  
**Description**: Clear all wishlist items for the current user  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/wishlist/`
**Summary**: Get Wishlist  
**Description**: Get all wishlist items for the current user  

**Response `200`** (Successful Response):
```json
  - Array of `WishlistItemWithProduct`
```

---

### `POST` `/wishlist/`
**Summary**: Add To Wishlist  
**Description**: Add a product to wishlist  

**Request Body** (`application/json`):
```json
  - `product_id`: `string` (required)
```

**Response `201`** (Successful Response):
```json
  - `id`: `string` (required)
  - `user_id`: `string` (required)
  - `product_id`: `string` (required)
  - `added_at`: `string` (required)
```

---

### `GET` `/wishlist/check/{product_id}`
**Summary**: Check In Wishlist  
**Description**: Check if a product is in the wishlist  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/wishlist/merge`
**Summary**: Merge Wishlist  
**Description**: Merge guest wishlist items with user wishlist  

**Request Body** (`application/json`):
```json
  - `product_ids`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `DELETE` `/wishlist/{product_id}`
**Summary**: Remove From Wishlist  
**Description**: Remove a product from wishlist  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 📍 7. Delivery Addresses

### `GET` `/addresses/`
**Summary**: Get User Addresses  
**Description**: Get all addresses for the current user  

**Response `200`** (Successful Response):
```json
  - Array of `Address`
```

---

### `POST` `/addresses/`
**Summary**: Create Address  
**Description**: Create a new address for the current user  

**Request Body** (`application/json`):
```json
  - `type`: `string` (optional)
  - `full_name`: `string` (required)
  - `phone`: `string` (required)
  - `address_line1`: `string` (required)
  - `address_line2`: `string` (optional)
  - `city`: `string` (required)
  - `state`: `string` (required)
  - `pincode`: `string` (required)
  - `is_default`: `boolean` (optional)
```

**Response `201`** (Successful Response):
```json
  - `id`: `string` (required)
  - `user_id`: `string` (required)
  - `type`: `string` (required)
  - `full_name`: `string` (required)
  - `phone`: `string` (required)
  - `address_line1`: `string` (required)
  - `address_line2`: `string` (optional)
  - `city`: `string` (required)
  - `state`: `string` (required)
  - `pincode`: `string` (required)
  - `is_default`: `boolean` (optional)
```

---

### `DELETE` `/addresses/{address_id}`
**Summary**: Delete Address  
**Description**: Delete an address  

**Parameters / Query Params**:
- `address_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/addresses/{address_id}`
**Summary**: Get Address  
**Description**: Get a specific address by ID  

**Parameters / Query Params**:
- `address_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `user_id`: `string` (required)
  - `type`: `string` (required)
  - `full_name`: `string` (required)
  - `phone`: `string` (required)
  - `address_line1`: `string` (required)
  - `address_line2`: `string` (optional)
  - `city`: `string` (required)
  - `state`: `string` (required)
  - `pincode`: `string` (required)
  - `is_default`: `boolean` (optional)
```

---

### `PUT` `/addresses/{address_id}`
**Summary**: Update Address  
**Description**: Update an address  

**Parameters / Query Params**:
- `address_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `type`: `string` (optional)
  - `full_name`: `string` (optional)
  - `phone`: `string` (optional)
  - `address_line1`: `string` (optional)
  - `address_line2`: `string` (optional)
  - `city`: `string` (optional)
  - `state`: `string` (optional)
  - `pincode`: `string` (optional)
  - `is_default`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `id`: `string` (required)
  - `user_id`: `string` (required)
  - `type`: `string` (required)
  - `full_name`: `string` (required)
  - `phone`: `string` (required)
  - `address_line1`: `string` (required)
  - `address_line2`: `string` (optional)
  - `city`: `string` (required)
  - `state`: `string` (required)
  - `pincode`: `string` (required)
  - `is_default`: `boolean` (optional)
```

---

### `PUT` `/addresses/{address_id}/set-default`
**Summary**: Set Default Address  
**Description**: Set an address as default  

**Parameters / Query Params**:
- `address_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 💳 8. Payment & Checkout (Razorpay + COD)

### `GET` `/payments/`
**Summary**: Get All Payments  
**Description**: List all payment records (Admin only).  

**Parameters / Query Params**:
- `skip` (query, `integer`, optional)
- `limit` (query, `integer`, optional)
- `status` (query, `string`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/payments/cod/create-order`
**Summary**: Create Cod Order  
**Description**: Create a Cash-on-Delivery order. Unlike Razorpay orders, no payment has
happened yet at this point, so stock IS validated before the order is
created — a customer can never place a COD order for something that's
already out of stock.  

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/payments/logs/{razorpay_order_id}`
**Summary**: Get Payment Logs  
**Description**: Full audit trail for a Razorpay order (Admin only) — every event
from order_created through captured/failed/webhook reconciliation.  

**Parameters / Query Params**:
- `razorpay_order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/payments/razorpay/create-order`
**Summary**: Create Razorpay Order  
**Description**: Step 1 of online checkout.
Client sends { amount, currency?, idempotency_key?, items? }.
Returns razorpay_order_id + key_id for the Razorpay checkout widget.

idempotency_key (optional, backward compatible): if the same key is
sent again within a short window (e.g. the customer double-clicks "Pay
Now" or the request is retried after a network blip), the SAME
Razorpay order is returned instead of creating a second one.

items (optional, backward compatible): if provided, stock is
pre-validated before the Razorpay order is created, so customers never
get to the payment screen for something that's already out of stock.  

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/payments/razorpay/verify`
**Summary**: Verify Razorpay Payment  
**Description**: Step 2 of online checkout.
Verifies HMAC signature, records payment, creates order, reduces
inventory, records coupon usage, sends notifications, triggers
Shiprocket.

Retry-safe: if this is called twice for the same razorpay_payment_id
(e.g. the frontend retried after a slow response), the SECOND call
detects the payment is already attached to an order and returns that
same order instead of creating a duplicate.  

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/payments/razorpay/webhook`
**Summary**: Razorpay Webhook  
**Description**: Server-to-server reconciliation endpoint. Configure this URL in the
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

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/payments/retry/{order_id}`
**Summary**: Retry Payment  
**Description**: Creates a fresh Razorpay order for an existing app order whose payment
previously failed, so the customer can pay again without re-entering
their address/cart. Only allowed while the order's payment_status is
still 'pending' or 'failed' — an already-captured or COD order cannot
be "retried".  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/payments/stats`
**Summary**: Get Payment Stats  
**Description**: Payment statistics for admin dashboard (Admin only).  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 📦 9. Orders & Tracking

### `GET` `/orders/`
**Summary**: Get Orders  
**Description**: Get all orders with filters (Admin only)  

**Parameters / Query Params**:
- `skip` (query, `integer`, optional)
- `limit` (query, `integer`, optional)
- `status` (query, `string`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/orders/`
**Summary**: Create Order  
**Description**: Create a new order  

**Request Body** (`application/json`):
```json
  - `user_id`: `string` (required)
  - `items`: `array` (required)
  - `shipping_address`: `object` (required)
  - `subtotal`: `number` (required)
  - `discount`: `number` (optional)
  - `shipping_cost`: `number` (optional)
  - `tax`: `number` (optional)
  - `total_amount`: `number` (required)
  - `payment_method`: `string` (optional)
  - `notes`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  - `user_id`: `string` (required)
  - `items`: `array` (required)
  - `shipping_address`: `object` (required)
  - `subtotal`: `number` (required)
  - `discount`: `number` (optional)
  - `shipping_cost`: `number` (optional)
  - `tax`: `number` (optional)
  - `total_amount`: `number` (required)
  - `payment_method`: `string` (optional)
  - `notes`: `string` (optional)
  - `_id`: `string` (required)
  - `order_number`: `string` (required)
  - `status`: `string` (optional)
  - `payment_status`: `string` (optional)
  - `tracking_number`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
  - `estimated_delivery`: `string` (optional)
  - `staff_assigned`: `string` (optional)
  - `warehouse_assigned`: `string` (optional)
  - `courier_name`: `string` (optional)
```

---

### `GET` `/orders/cancellations/list`
**Summary**: List Cancellation Requests  
**Description**: Admin: list all cancellation requests, optionally filtered by status.  

**Parameters / Query Params**:
- `status` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/orders/cancellations/{cancellation_id}/review`
**Summary**: Review Cancellation Request  
**Description**: Admin approves or rejects a pending cancellation request.
Body: { "action": "approve" | "reject", "admin_notes": "..." (optional) }  

**Parameters / Query Params**:
- `cancellation_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/orders/my-orders`
**Summary**: Get My Orders  
**Description**: Get current user's orders with filters  

**Parameters / Query Params**:
- `status` (query, `string`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/orders/user/{user_id}`
**Summary**: Get User Orders  
**Description**: Get user's orders (Authenticated users only)  

**Parameters / Query Params**:
- `user_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - Array of `Order`
```

---

### `DELETE` `/orders/{order_id}`
**Summary**: Delete Order  
**Description**: Delete an order (Admin only)  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/orders/{order_id}`
**Summary**: Get Order  
**Description**: Get order by ID (Authenticated users only)  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/orders/{order_id}`
**Summary**: Update Order  
**Description**: Update an order (Admin only)  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `status`: `string` (optional)
  - `payment_status`: `string` (optional)
  - `tracking_number`: `string` (optional)
  - `notes`: `string` (optional)
  - `shipping_address`: `string` (optional)
  - `staff_assigned`: `string` (optional)
  - `warehouse_assigned`: `string` (optional)
  - `courier_name`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `user_id`: `string` (required)
  - `items`: `array` (required)
  - `shipping_address`: `object` (required)
  - `subtotal`: `number` (required)
  - `discount`: `number` (optional)
  - `shipping_cost`: `number` (optional)
  - `tax`: `number` (optional)
  - `total_amount`: `number` (required)
  - `payment_method`: `string` (optional)
  - `notes`: `string` (optional)
  - `_id`: `string` (required)
  - `order_number`: `string` (required)
  - `status`: `string` (optional)
  - `payment_status`: `string` (optional)
  - `tracking_number`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
  - `estimated_delivery`: `string` (optional)
  - `staff_assigned`: `string` (optional)
  - `warehouse_assigned`: `string` (optional)
  - `courier_name`: `string` (optional)
```

---

### `POST` `/orders/{order_id}/cancel-request`
**Summary**: Request Order Cancellation  
**Description**: Customer requests cancellation of their own order.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `order_id`: `string` (required)
  - `reason`: `string` (required)
```

**Response `201`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/orders/{order_id}/history`
**Summary**: Get Order History  
**Description**: Full status-change audit trail for an order — powers a "track order"
timeline on the frontend (e.g. Confirmed -> Packed -> Shipped ->
Delivered with timestamps). Customers may only view their own order's
history; admins may view any.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/orders/{order_id}/resend-notification`
**Summary**: Resend Order Notification  
**Description**: Re-send customer notification (email/sms/whatsapp) manually from admin dashboard.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/orders/{order_id}/status`
**Summary**: Update Order Status  
**Description**: Update order status (Admin only). Automatically:
- Logs the transition to `order_logs` (full audit trail).
- Triggers Shiprocket shipment creation the first time an order
  becomes 'confirmed' or 'paid' and doesn't already have a shipment.
- Restores inventory if the new status is 'cancelled' (covers admin
  manually cancelling an order outside the customer cancel-request flow).
- Sends the matching customer notification (packed/shipped/
  out_for_delivery/delivered/cancelled) via email + WhatsApp.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🚚 10. Shipping & Logistics (Shiprocket)

### `POST` `/shipping/bulk/invoices`
**Summary**: Bulk Generate Invoices  
**Description**: Generate consolidated invoices for multiple orders in bulk (Admin only).  

**Request Body** (`application/json`):
```json
  - `ids`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/bulk/labels`
**Summary**: Bulk Generate Labels  
**Description**: Generate consolidated shipping labels for multiple shipments in bulk (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_ids`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/bulk/manifests`
**Summary**: Bulk Generate Manifests  
**Description**: Generate consolidated manifests for multiple shipments in bulk (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_ids`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/bulk/sync`
**Summary**: Bulk Sync Shipments  
**Description**: Sync tracking/shipping statuses in bulk for multiple shipment IDs (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_ids`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/cancel`
**Summary**: Cancel Shipment  
**Description**: Cancel a shipment by order_id or a list of AWBs (Admin only).  

**Request Body** (`application/json`):
```json
  - `order_id`: `string` (optional)
  - `awbs`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `success`: `boolean` (required)
  - `message`: `string` (required)
```

---

### `GET` `/shipping/courier-serviceability`
**Summary**: Courier Serviceability  
**Description**: Check courier availability + rates between two pincodes.  

**Parameters / Query Params**:
- `pickup_postcode` (query, `string`, required)
- `delivery_postcode` (query, `string`, required)
- `weight` (query, `number`, optional)
- `cod` (query, `boolean`, optional)

**Response `200`** (Successful Response):
```json
  - `available_couriers`: `array` (optional)
  - `recommended_courier_id`: `string` (optional)
```

---

### `POST` `/shipping/create-order`
**Summary**: Create Shipment  
**Description**: Create a Shiprocket order for an existing app order (Admin only).  

**Request Body** (`application/json`):
```json
  - `order_id`: `string` (required)
  - `dimensions`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `success`: `boolean` (required)
  - `order_id`: `string` (required)
  - `shiprocket_order_id`: `string` (optional)
  - `shipment_id`: `string` (optional)
  - `awb_code`: `string` (optional)
  - `courier_name`: `string` (optional)
  - `courier_company_id`: `string` (optional)
  - `pickup_status`: `string` (optional)
  - `shipment_status`: `string` (optional)
  - `tracking_url`: `string` (optional)
  - `message`: `string` (optional)
```

---

### `POST` `/shipping/fulfill/{order_id}`
**Summary**: Fulfill Order  
**Description**: Run the full pipeline for an existing order: create Shiprocket order ->
generate AWB -> assign courier -> schedule pickup -> persist everything.
Optionally accepts a custom pickup_location nickname.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)
- `pickup_location` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/generate-awb`
**Summary**: Generate Awb  
**Description**: Generate an AWB / assign a courier for a shipment (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_id`: `integer` (required)
  - `courier_id`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `success`: `boolean` (required)
  - `shipment_id`: `integer` (required)
  - `awb_code`: `string` (optional)
  - `courier_name`: `string` (optional)
  - `courier_company_id`: `string` (optional)
  - `message`: `string` (optional)
```

---

### `GET` `/shipping/invoice/{shipment_id}`
**Summary**: Get Invoice  
**Description**: Generate/fetch the invoice PDF URL for a shipment's Shiprocket order (Admin only).  

**Parameters / Query Params**:
- `shipment_id` (path, `integer`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/shipping/label/{shipment_id}`
**Summary**: Get Label  
**Description**: Generate/fetch the shipping label PDF URL for a shipment (Admin only).  

**Parameters / Query Params**:
- `shipment_id` (path, `integer`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/manifest/generate`
**Summary**: Generate Manifest Route  
**Description**: Generate and print manifest for a list of shipment IDs (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_ids`: `array` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/shipping/manifest/{shipment_id}`
**Summary**: Get Manifest Route  
**Description**: Get or generate the manifest PDF URL for a shipment (Admin only).  

**Parameters / Query Params**:
- `shipment_id` (path, `integer`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/shipping/order/{order_id}`
**Summary**: Get Order Shipping  
**Description**: Fetch stored shipping/tracking info for an order (owner or admin).  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `order_id`: `string` (required)
  - `order_number`: `string` (optional)
  - `shiprocket_order_id`: `string` (optional)
  - `shipment_id`: `string` (optional)
  - `awb`: `string` (optional)
  - `tracking_number`: `string` (optional)
  - `tracking_url`: `string` (optional)
  - `courier_name`: `string` (optional)
  - `pickup_status`: `string` (optional)
  - `shipment_status`: `string` (optional)
  - `pickup_date`: `string` (optional)
  - `delivered_date`: `string` (optional)
  - `shipping_cost`: `string` (optional)
  - `label_url`: `string` (optional)
  - `invoice_url`: `string` (optional)
  - `manifest_url`: `string` (optional)
  - `estimated_delivery`: `string` (optional)
  - `current_status`: `string` (optional)
```

---

### `GET` `/shipping/pickup-locations`
**Summary**: Get Pickup Locations  
**Description**: List all registered pickup addresses/warehouses from Shiprocket (Admin only).  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/reassign-courier`
**Summary**: Reassign Courier  
**Description**: Cancel the current AWB and reassign a different courier (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_id`: `integer` (required)
  - `courier_id`: `integer` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/shipping/schedule-pickup`
**Summary**: Schedule Pickup  
**Description**: Schedule a courier pickup for a shipment (Admin only).  

**Request Body** (`application/json`):
```json
  - `shipment_id`: `integer` (required)
  - `pickup_date`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `success`: `boolean` (required)
  - `shipment_id`: `integer` (required)
  - `pickup_status`: `string` (required)
  - `pickup_scheduled_date`: `string` (optional)
  - `message`: `string` (optional)
```

---

### `GET` `/shipping/track-public/{query}`
**Summary**: Track Shipment Public  
**Description**: Unified public order & shipment tracking endpoint.
Supports MongoDB Order ID, Order Number (NP-1002), Shiprocket AWB, or Shipment ID.
No authorization required. Returns customer-safe normalized tracking details.  

**Parameters / Query Params**:
- `query` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/shipping/track/{awb}`
**Summary**: Track Shipment  
**Description**: Track a shipment by AWB. Any authenticated user may track (order
ownership is enforced at the /shipping/order/{order_id} level).  

**Parameters / Query Params**:
- `awb` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `awb`: `string` (required)
  - `current_status`: `string` (optional)
  - `shipment_status`: `string` (optional)
  - `courier_name`: `string` (optional)
  - `estimated_delivery`: `string` (optional)
  - `delivered_date`: `string` (optional)
  - `tracking_url`: `string` (optional)
  - `tracking_history`: `array` (optional)
```

---

### `POST` `/shipping/webhook`
**Summary**: Shiprocket Webhook  
**Description**: Receives Shiprocket status-update webhooks (order created, pickup
scheduled, in transit, out for delivery, delivered, RTO, cancelled) and
updates the matching order automatically.

Shiprocket calls this endpoint server-to-server, so authentication is
via a shared secret configured on both sides (Shiprocket panel ->
Settings -> API -> Webhook, and SHIPROCKET_WEBHOOK_SECRET here) rather
than a user JWT.  

**Parameters / Query Params**:
- `X-Api-Key` (header, `string`, optional)

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🏷️ 11. Coupons & Discounts

### `GET` `/coupons/`
**Summary**: Get Coupons  
**Description**: List all coupons (Admin only).  

**Parameters / Query Params**:
- `is_active` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `Coupon`
```

---

### `POST` `/coupons/`
**Summary**: Create Coupon  
**Description**: Create a new coupon (Admin only).  

**Request Body** (`application/json`):
```json
  - `code`: `string` (required)
  - `type`: `string` (required)
  - `value`: `number` (optional)
  - `description`: `string` (optional)
  - `min_order_value`: `number` (optional)
  - `max_discount`: `string` (optional)
  - `usage_limit`: `string` (optional)
  - `usage_limit_per_user`: `string` (optional)
  - `valid_from`: `string` (optional)
  - `valid_until`: `string` (optional)
  - `is_active`: `boolean` (optional)
```

**Response `201`** (Successful Response):
```json
  - `code`: `string` (required)
  - `type`: `string` (required)
  - `value`: `number` (optional)
  - `description`: `string` (optional)
  - `min_order_value`: `number` (optional)
  - `max_discount`: `string` (optional)
  - `usage_limit`: `string` (optional)
  - `usage_limit_per_user`: `string` (optional)
  - `valid_from`: `string` (optional)
  - `valid_until`: `string` (optional)
  - `is_active`: `boolean` (optional)
  - `_id`: `string` (required)
  - `times_used`: `integer` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `POST` `/coupons/validate`
**Summary**: Validate Coupon  
**Description**: Server-side coupon validation (replaces the old client-only fake
discount codes). Called from the cart/checkout page whenever the
customer applies a code — the returned discount_amount is the only
number the frontend should trust and display.  

**Request Body** (`application/json`):
```json
  - `code`: `string` (required)
  - `subtotal`: `number` (required)
```

**Response `200`** (Successful Response):
```json
  - `valid`: `boolean` (required)
  - `code`: `string` (required)
  - `type`: `string` (optional)
  - `discount_amount`: `number` (optional)
  - `free_shipping`: `boolean` (optional)
  - `message`: `string` (required)
```

---

### `DELETE` `/coupons/{coupon_id}`
**Summary**: Delete Coupon  
**Description**: Delete a coupon (Admin only).  

**Parameters / Query Params**:
- `coupon_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/coupons/{coupon_id}`
**Summary**: Get Coupon  
**Description**: Get a single coupon by ID (Admin only).  

**Parameters / Query Params**:
- `coupon_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `code`: `string` (required)
  - `type`: `string` (required)
  - `value`: `number` (optional)
  - `description`: `string` (optional)
  - `min_order_value`: `number` (optional)
  - `max_discount`: `string` (optional)
  - `usage_limit`: `string` (optional)
  - `usage_limit_per_user`: `string` (optional)
  - `valid_from`: `string` (optional)
  - `valid_until`: `string` (optional)
  - `is_active`: `boolean` (optional)
  - `_id`: `string` (required)
  - `times_used`: `integer` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `PUT` `/coupons/{coupon_id}`
**Summary**: Update Coupon  
**Description**: Update a coupon (Admin only).  

**Parameters / Query Params**:
- `coupon_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `type`: `string` (optional)
  - `value`: `string` (optional)
  - `description`: `string` (optional)
  - `min_order_value`: `string` (optional)
  - `max_discount`: `string` (optional)
  - `usage_limit`: `string` (optional)
  - `usage_limit_per_user`: `string` (optional)
  - `valid_from`: `string` (optional)
  - `valid_until`: `string` (optional)
  - `is_active`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `code`: `string` (required)
  - `type`: `string` (required)
  - `value`: `number` (optional)
  - `description`: `string` (optional)
  - `min_order_value`: `number` (optional)
  - `max_discount`: `string` (optional)
  - `usage_limit`: `string` (optional)
  - `usage_limit_per_user`: `string` (optional)
  - `valid_from`: `string` (optional)
  - `valid_until`: `string` (optional)
  - `is_active`: `boolean` (optional)
  - `_id`: `string` (required)
  - `times_used`: `integer` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---


## ⭐ 12. Reviews & Ratings

### `GET` `/reviews/`
**Summary**: Get All Reviews  
**Description**: Get all reviews with filters (Admin only)  

**Parameters / Query Params**:
- `skip` (query, `integer`, optional)
- `limit` (query, `integer`, optional)
- `status` (query, `string`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `Review`
```

---

### `POST` `/reviews/`
**Summary**: Create Review  
**Description**: Create a new review  

**Request Body** (`application/json`):
```json
  - `product_id`: `string` (optional)
  - `product_name`: `string` (optional)
  - `user_id`: `string` (optional)
  - `user_name`: `string` (optional)
  - `rating`: `number` (required)
  - `title`: `string` (optional)
  - `comment`: `string` (optional)
  - `images`: `array` (optional)
  - `verified_purchase`: `boolean` (optional)
  - `size_purchased`: `string` (optional)
  - `color_purchased`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  - `product_id`: `string` (optional)
  - `product_name`: `string` (optional)
  - `user_id`: `string` (optional)
  - `user_name`: `string` (optional)
  - `rating`: `number` (required)
  - `title`: `string` (optional)
  - `comment`: `string` (optional)
  - `images`: `array` (optional)
  - `verified_purchase`: `boolean` (optional)
  - `size_purchased`: `string` (optional)
  - `color_purchased`: `string` (optional)
  - `_id`: `string` (required)
  - `status`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
  - `helpful_count`: `integer` (optional)
```

---

### `GET` `/reviews/product/{product_id}`
**Summary**: Get Product Reviews  
**Description**: Get reviews for a specific product (only approved reviews for public)  

**Parameters / Query Params**:
- `product_id` (path, `string`, required)
- `skip` (query, `integer`, optional)
- `limit` (query, `integer`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `Review`
```

---

### `DELETE` `/reviews/{review_id}`
**Summary**: Delete Review  
**Description**: Delete a review (Admin only)  

**Parameters / Query Params**:
- `review_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/reviews/{review_id}`
**Summary**: Get Review  
**Description**: Get a specific review  

**Parameters / Query Params**:
- `review_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `product_id`: `string` (optional)
  - `product_name`: `string` (optional)
  - `user_id`: `string` (optional)
  - `user_name`: `string` (optional)
  - `rating`: `number` (required)
  - `title`: `string` (optional)
  - `comment`: `string` (optional)
  - `images`: `array` (optional)
  - `verified_purchase`: `boolean` (optional)
  - `size_purchased`: `string` (optional)
  - `color_purchased`: `string` (optional)
  - `_id`: `string` (required)
  - `status`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
  - `helpful_count`: `integer` (optional)
```

---

### `PUT` `/reviews/{review_id}`
**Summary**: Update Review  
**Description**: Update a review (Admin only)  

**Parameters / Query Params**:
- `review_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `rating`: `string` (optional)
  - `title`: `string` (optional)
  - `comment`: `string` (optional)
  - `images`: `string` (optional)
  - `status`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `product_id`: `string` (optional)
  - `product_name`: `string` (optional)
  - `user_id`: `string` (optional)
  - `user_name`: `string` (optional)
  - `rating`: `number` (required)
  - `title`: `string` (optional)
  - `comment`: `string` (optional)
  - `images`: `array` (optional)
  - `verified_purchase`: `boolean` (optional)
  - `size_purchased`: `string` (optional)
  - `color_purchased`: `string` (optional)
  - `_id`: `string` (required)
  - `status`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
  - `helpful_count`: `integer` (optional)
```

---

### `PATCH` `/reviews/{review_id}/approve`
**Summary**: Approve Review  
**Description**: Approve a review (Admin only)  

**Parameters / Query Params**:
- `review_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PATCH` `/reviews/{review_id}/reject`
**Summary**: Reject Review  
**Description**: Reject a review (Admin only)  

**Parameters / Query Params**:
- `review_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🔄 13. Returns & Refunds

### `GET` `/returns/`
**Summary**: List All Returns  
**Description**: Admin: list all return requests, optionally filtered by status.  

**Parameters / Query Params**:
- `status` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/returns/`
**Summary**: Create Return Request  
**Description**: Customer requests a return for a delivered order (full or partial —
`items` can be a subset of the order's items).  

**Request Body** (`application/json`):
```json
  - `order_id`: `string` (required)
  - `items`: `array` (required)
  - `reason`: `string` (required)
  - `comments`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/returns/my-returns`
**Summary**: List My Returns  
**Description**: Customer's own return requests.  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/returns/{return_id}`
**Summary**: Get Return  

**Parameters / Query Params**:
- `return_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/returns/{return_id}/action`
**Summary**: Perform Return Action  
**Description**: Single endpoint for every admin-driven transition:
    approve | reject | schedule_pickup | mark_picked_up | mark_received
    | start_qc | qc_pass | qc_fail

qc_pass automatically initiates the refund and restores inventory for
the returned items (Return Approved -> Refund Initiated -> Restore
Inventory, matching the spec). qc_fail closes the request without a
refund (item failed quality check — e.g. used/damaged beyond what's
eligible), with the reason recorded for the customer to see.  

**Parameters / Query Params**:
- `return_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `action`: `string` (required)
  - `reason`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🔁 14. Exchange Requests

### `GET` `/exchanges/`
**Summary**: List All Exchanges  

**Parameters / Query Params**:
- `status` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/exchanges/`
**Summary**: Create Exchange Request  
**Description**: Customer requests an exchange (e.g. wrong size) for a delivered order.  

**Request Body** (`application/json`):
```json
  - `order_id`: `string` (required)
  - `product_id`: `string` (required)
  - `quantity`: `integer` (required)
  - `current_size`: `string` (optional)
  - `requested_size`: `string` (optional)
  - `reason`: `string` (required)
  - `comments`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/exchanges/my-exchanges`
**Summary**: List My Exchanges  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/exchanges/{exchange_id}`
**Summary**: Get Exchange  

**Parameters / Query Params**:
- `exchange_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/exchanges/{exchange_id}/action`
**Summary**: Perform Exchange Action  
**Description**: Single endpoint for every admin-driven transition:
    approve | reject | schedule_pickup | mark_picked_up | qc_pass
    | qc_fail | ship_new_item | mark_delivered

ship_new_item reduces stock for the replacement item (a fresh unit
leaves the warehouse) — the returned original unit was never restored
to sellable stock unless/until it separately passes QC, matching how
exchanges work in practice (the old unit may be defective/wrong-size
but otherwise fine, so restoring it is a deliberate follow-up action
an admin can do via the returns endpoints if appropriate, not automatic
here).  

**Parameters / Query Params**:
- `exchange_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `action`: `string` (required)
  - `reason`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🎬 15. Reels & Video Commerce

### `GET` `/reels/`
**Summary**: Get Reels  

**Parameters / Query Params**:
- `active_only` (query, `boolean`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `ReelOut`
```

---

### `POST` `/reels/`
**Summary**: Create Reel  

**Request Body** (`application/json`):
```json
  - `title`: `string` (required)
  - `video_url`: `string` (required)
  - `thumbnail`: `string` (required)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `product_link`: `string` (optional)
  - `views`: `string` (optional)
  - `likes`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
```

**Response `201`** (Successful Response):
```json
  - `title`: `string` (required)
  - `video_url`: `string` (required)
  - `thumbnail`: `string` (required)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `product_link`: `string` (optional)
  - `views`: `string` (optional)
  - `likes`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `id`: `string` (required)
```

---

### `DELETE` `/reels/{reel_id}`
**Summary**: Delete Reel  

**Parameters / Query Params**:
- `reel_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/reels/{reel_id}`
**Summary**: Update Reel  

**Parameters / Query Params**:
- `reel_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `title`: `string` (required)
  - `video_url`: `string` (required)
  - `thumbnail`: `string` (required)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `product_link`: `string` (optional)
  - `views`: `string` (optional)
  - `likes`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
```

**Response `200`** (Successful Response):
```json
  - `title`: `string` (required)
  - `video_url`: `string` (required)
  - `thumbnail`: `string` (required)
  - `price`: `number` (required)
  - `original_price`: `string` (optional)
  - `product_link`: `string` (optional)
  - `views`: `string` (optional)
  - `likes`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `id`: `string` (required)
```

---

### `PATCH` `/reels/{reel_id}/toggle`
**Summary**: Toggle Reel  

**Parameters / Query Params**:
- `reel_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🌟 16. Celebrity Looks

*No endpoints listed for this section.*


## 🖼️ 17. Banners & Sliders

### `GET` `/slider/`
**Summary**: Get Slides  
**Description**: Public — fetch all slides ordered by `order` field.  

**Parameters / Query Params**:
- `active_only` (query, `boolean`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `SlideOut`
```

---

### `POST` `/slider/`
**Summary**: Create Slide  

**Request Body** (`application/json`):
```json
  - `image`: `string` (required)
  - `alt`: `string` (optional)
  - `title`: `string` (optional)
  - `subtitle`: `string` (optional)
  - `cta_text`: `string` (optional)
  - `cta_link`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
```

**Response `201`** (Successful Response):
```json
  - `image`: `string` (required)
  - `alt`: `string` (optional)
  - `title`: `string` (optional)
  - `subtitle`: `string` (optional)
  - `cta_text`: `string` (optional)
  - `cta_link`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `id`: `string` (required)
```

---

### `DELETE` `/slider/{slide_id}`
**Summary**: Delete Slide  

**Parameters / Query Params**:
- `slide_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/slider/{slide_id}`
**Summary**: Update Slide  

**Parameters / Query Params**:
- `slide_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `image`: `string` (required)
  - `alt`: `string` (optional)
  - `title`: `string` (optional)
  - `subtitle`: `string` (optional)
  - `cta_text`: `string` (optional)
  - `cta_link`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
```

**Response `200`** (Successful Response):
```json
  - `image`: `string` (required)
  - `alt`: `string` (optional)
  - `title`: `string` (optional)
  - `subtitle`: `string` (optional)
  - `cta_text`: `string` (optional)
  - `cta_link`: `string` (optional)
  - `order`: `integer` (optional)
  - `is_active`: `boolean` (optional)
  - `id`: `string` (required)
```

---

### `PATCH` `/slider/{slide_id}/toggle`
**Summary**: Toggle Slide  

**Parameters / Query Params**:
- `slide_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 🏷️ 18. Brands

### `GET` `/brands/`
**Summary**: Get Public Brands  
**Description**: List all active brands for the public storefront  

**Parameters / Query Params**:
- `is_active` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  - Array of `Brand`
```

---

### `POST` `/brands/`
**Summary**: Create Brand  
**Description**: Create a new brand (Admin only)  

**Request Body** (`application/json`):
```json
  - `name`: `string` (required)
  - `slug`: `string` (optional)
  - `logo_url`: `string` (optional)
  - `country`: `string` (optional)
  - `description`: `string` (optional)
  - `status`: `string` (optional)
  - `is_active`: `string` (optional)
  - `display_order`: `string` (optional)
```

**Response `201`** (Successful Response):
```json
  - `id`: `string` (optional)
  - `name`: `string` (required)
  - `slug`: `string` (optional)
  - `logo_url`: `string` (optional)
  - `country`: `string` (optional)
  - `description`: `string` (optional)
  - `status`: `string` (optional)
  - `is_active`: `string` (optional)
  - `display_order`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `GET` `/brands/admin/all`
**Summary**: Get All Brands Admin  
**Description**: List all brands (active and inactive) for admin management  

**Response `200`** (Successful Response):
```json
  - Array of `Brand`
```

---

### `DELETE` `/brands/{brand_id}`
**Summary**: Delete Brand  
**Description**: Delete a brand (Admin only)  

**Parameters / Query Params**:
- `brand_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/brands/{brand_id}`
**Summary**: Get Brand  
**Description**: Get single brand details  

**Parameters / Query Params**:
- `brand_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  - `id`: `string` (optional)
  - `name`: `string` (required)
  - `slug`: `string` (optional)
  - `logo_url`: `string` (optional)
  - `country`: `string` (optional)
  - `description`: `string` (optional)
  - `status`: `string` (optional)
  - `is_active`: `string` (optional)
  - `display_order`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---

### `PUT` `/brands/{brand_id}`
**Summary**: Update Brand  
**Description**: Update a brand (Admin only)  

**Parameters / Query Params**:
- `brand_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `name`: `string` (optional)
  - `slug`: `string` (optional)
  - `logo_url`: `string` (optional)
  - `country`: `string` (optional)
  - `description`: `string` (optional)
  - `status`: `string` (optional)
  - `is_active`: `string` (optional)
  - `display_order`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  - `id`: `string` (optional)
  - `name`: `string` (required)
  - `slug`: `string` (optional)
  - `logo_url`: `string` (optional)
  - `country`: `string` (optional)
  - `description`: `string` (optional)
  - `status`: `string` (optional)
  - `is_active`: `string` (optional)
  - `display_order`: `string` (optional)
  - `created_at`: `string` (optional)
  - `updated_at`: `string` (optional)
```

---


## 💬 19. Inquiries & Contact

### `GET` `/inquiries/`
**Summary**: List Inquiries  
**Description**: Admin API to list customer inquiries  

**Parameters / Query Params**:
- `status` (query, `string`, optional)
- `search` (query, `string`, optional)
- `limit` (query, `integer`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/inquiries/`
**Summary**: Submit Inquiry  
**Description**: Public API for customers to submit inquiries / callback requests  

**Request Body** (`application/json`):
```json
  - `name`: `string` (required)
  - `phone`: `string` (required)
  - `email`: `string` (optional)
  - `subject`: `string` (optional)
  - `message`: `string` (required)
```

**Response `201`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/inquiries/subscribe`
**Summary**: Subscribe Newsletter  
**Description**: Subscribe a new email address to the newsletter  

**Request Body** (`application/json`):
```json
  - `email`: `string` (required)
```

**Response `201`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `DELETE` `/inquiries/{inquiry_id}`
**Summary**: Delete Inquiry  
**Description**: Admin API to delete inquiry  

**Parameters / Query Params**:
- `inquiry_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/inquiries/{inquiry_id}/reply`
**Summary**: Reply Inquiry  
**Description**: Admin API to reply to customer inquiry and update status  

**Parameters / Query Params**:
- `inquiry_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `reply_message`: `string` (required)
  - `status`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PATCH` `/inquiries/{inquiry_id}/status`
**Summary**: Update Inquiry Status  
**Description**: Admin API to update inquiry status  

**Parameters / Query Params**:
- `inquiry_id` (path, `string`, required)

**Request Body** (`application/json`):
```json
  - `status`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 📄 20. Invoices

### `GET` `/invoices/admin/order/{order_id}`
**Summary**: Admin Get Invoice  
**Description**: Admin: fetch invoice metadata (number, totals) without downloading
the PDF — used by the admin order list to show whether an invoice has
already been generated for an order.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/invoices/order/{order_id}/download`
**Summary**: Download Invoice  
**Description**: Download the GST-ready PDF invoice for an order. Customers may only
download their own order's invoice; admins may download any.  

**Parameters / Query Params**:
- `order_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 📤 21. Media File Upload

### `POST` `/upload/image`
**Summary**: Upload Image  
**Description**: Upload an image or video file.
Returns { url, filename } where url is the public path to the file.  

**Request Body** (`multipart/form-data`):
```json
  - `file`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## 📊 22. Admin & Analytics

### `POST` `/analytics/event`
**Summary**: Track Event  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `event_type`: `string` (required)
  - `event_data`: `object` (optional)
  - `path`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/heatmap/click`
**Summary**: Track Heatmap Click  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `path`: `string` (required)
  - `x`: `number` (required)
  - `y`: `number` (required)
  - `target_tag`: `string` (optional)
  - `target_text`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/heatmap/scroll`
**Summary**: Track Heatmap Scroll  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `path`: `string` (required)
  - `max_scroll`: `number` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/merge`
**Summary**: Merge Visitor  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `user_id`: `string` (required)
  - `login_status`: `string` (required)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/performance`
**Summary**: Track Performance  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `path`: `string` (required)
  - `page_load_time`: `string` (optional)
  - `api_response_time`: `string` (optional)
  - `error_log`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/security`
**Summary**: Track Security  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `alert_type`: `string` (required)
  - `details`: `object` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/session`
**Summary**: Start Session  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `user_id`: `string` (optional)
  - `referrer`: `string` (optional)
  - `traffic_source`: `string` (optional)
  - `utm_source`: `string` (optional)
  - `utm_medium`: `string` (optional)
  - `utm_campaign`: `string` (optional)
  - `utm_term`: `string` (optional)
  - `utm_content`: `string` (optional)
  - `landing_page`: `string` (optional)
  - `screen_resolution`: `string` (optional)
  - `language`: `string` (optional)
  - `timezone`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `POST` `/analytics/track`
**Summary**: Track Pageview  

**Request Body** (`application/json`):
```json
  - `visitor_id`: `string` (required)
  - `session_id`: `string` (required)
  - `path`: `string` (required)
  - `title`: `string` (optional)
  - `referrer`: `string` (optional)
  - `time_spent`: `string` (optional)
  - `scroll_percentage`: `string` (optional)
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/analytics/visitor-dashboard`
**Summary**: Get Visitor Intelligence Dashboard  

**Parameters / Query Params**:
- `date_range` (query, `string`, optional)
- `country` (query, `string`, optional)
- `browser` (query, `string`, optional)
- `os` (query, `string`, optional)
- `device` (query, `string`, optional)
- `source` (query, `string`, optional)
- `visitor_type` (query, `string`, optional)
- `page` (query, `integer`, optional)
- `limit` (query, `integer`, optional)
- `search` (query, `string`, optional)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/analytics/visitor/{visitor_id}`
**Summary**: Get Visitor Profile  

**Parameters / Query Params**:
- `visitor_id` (path, `string`, required)

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---


## ⚙️ 23. Admin General Operations

### `GET` `/admin/orders/summary`
**Summary**: Get Orders Summary  
**Description**: Get summary of orders for admin (Admin only)  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/admin/settings/delivery`
**Summary**: Get Delivery Settings  
**Description**: Get delivery charge settings and free delivery order rules  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `PUT` `/admin/settings/delivery`
**Summary**: Update Delivery Settings  
**Description**: Update delivery charge rules (Admin only)  

**Request Body** (`application/json`):
```json
  None / Any JSON Object
```

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/admin/stats`
**Summary**: Get Dashboard Stats  
**Description**: Get dashboard statistics for admin panel (Admin only)  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---

### `GET` `/admin/users/summary`
**Summary**: Get Users Summary  
**Description**: Get summary of users for admin (Admin only)  

**Response `200`** (Successful Response):
```json
  None / Any JSON Object
```

---
