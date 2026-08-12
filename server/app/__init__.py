from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.shipping import router as shipping_router
from app.database import close_database_connection, connect_to_database
from app.routes.address import router as address_router
from app.routes.admin import router as admin_router
from app.routes.analytics import router as analytics_router
from app.routes.auth import router as auth_router
from app.routes.cart import router as cart_router
from app.routes.category import router as category_router
from app.routes.coupon import router as coupon_router
from app.routes.exchange import router as exchange_router
from app.routes.invoice import router as invoice_router
from app.routes.order import router as order_router
from app.routes.payment import router as payment_router
from app.routes.product import router as product_router
from app.routes.returns import router as returns_router
from app.routes.review import router as review_router
from app.routes.slider import router as slider_router
from app.routes.upload import router as upload_router
from app.routes.user import router as user_router
from app.routes.wishlist import router as wishlist_router
from app.routes.reels import router as reels_router
from app.routes.celeb_looks import router as celeb_looks_router
from app.routes.inquiries import router as inquiries_router

app = FastAPI(
    title="Nari Pehnawa API",
    description="Backend API for Nari Pehnawa E-commerce Platform with Razorpay & Shiprocket",
    version="2.0.0",
    docs_url="/docs",
    redoc_url=None,
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*","https://naripehnawa.com:7100", "https://www.naripehnawa.com:7100"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connect_to_database()
from app.database.seeder import seed_dummy_data
try:
    seed_dummy_data()
except Exception as seeder_err:
    print(f"Database seeding error at startup: {seeder_err}")



@app.on_event("shutdown")
def shutdown_event():
    close_database_connection()
    print("Application shutdown successfully!")


@app.get("/")
def root():
    return {
        "message": "Welcome to Nari Pehnawa API",
        "version": "2.0.0",
        "status": "online",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/redoc", response_class=HTMLResponse, include_in_schema=False)
def custom_redoc():
    return """<!DOCTYPE html>
<html>
<head>
    <title>Nari Pehnawa API - ReDoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <redoc spec-url="/openapi.json"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>"""


# Register all routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(product_router)
app.include_router(category_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(review_router)
app.include_router(user_router)
app.include_router(address_router)
app.include_router(wishlist_router)
app.include_router(payment_router)
app.include_router(shipping_router)
app.include_router(upload_router)
app.include_router(slider_router)
app.include_router(reels_router)
app.include_router(celeb_looks_router)
app.include_router(inquiries_router)
app.include_router(analytics_router)
app.include_router(coupon_router)
app.include_router(invoice_router)
app.include_router(returns_router)
app.include_router(exchange_router)

# Serve uploaded images as static files
Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
