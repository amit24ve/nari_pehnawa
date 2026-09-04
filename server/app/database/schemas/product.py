from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    brand: str = "Nari Pehnawa"
    price: float
    original_price: Optional[float] = None
    discount: Optional[int] = None
    image: str
    images: Optional[List[str]] = []
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[List[str]] = []
    style_tip: Optional[str] = None
    fit_type: Optional[str] = None
    viewers_count: Optional[int] = 0
    sold_24h: Optional[int] = 0
    wishlist_count: Optional[int] = 0
    q_and_a: Optional[List[Dict[str, str]]] = []
    on_sale: bool = False
    is_new: bool = False
    in_stock: bool = True
    stock_quantity: int = 100
    sizes: List[str] = ["S", "M", "L", "XL"]
    size_stock: Optional[Dict[str, int]] = {}
    colors: List[str] = []
    fabric: Optional[str] = None
    pattern: Optional[str] = None
    sleeve_type: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    tags: List[str] = []
    hsn_code: Optional[str] = None  # GST HSN/SAC code, used on invoices
    delivery_charge: float = 0.0
    pickup_location: Optional[str] = None  # Shiprocket pickup warehouse nickname


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    discount: Optional[int] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    style_tip: Optional[str] = None
    fit_type: Optional[str] = None
    viewers_count: Optional[int] = None
    sold_24h: Optional[int] = None
    wishlist_count: Optional[int] = None
    q_and_a: Optional[List[Dict[str, str]]] = None
    on_sale: Optional[bool] = None
    is_new: Optional[bool] = None
    in_stock: Optional[bool] = None
    stock_quantity: Optional[int] = None
    sizes: Optional[List[str]] = None
    size_stock: Optional[Dict[str, int]] = None
    colors: Optional[List[str]] = None
    fabric: Optional[str] = None
    pattern: Optional[str] = None
    sleeve_type: Optional[str] = None
    tags: Optional[List[str]] = None
    hsn_code: Optional[str] = None
    delivery_charge: Optional[float] = None
    pickup_location: Optional[str] = None


class Product(ProductBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "Blush Glow Anarkali Kurta Set",
                "brand": "Bunaai",
                "price": 4000,
                "original_price": 4500,
                "discount": 11,
                "image": "/product_anarkali_1.png",
                "category": "Anarkali",
                "on_sale": True,
                "is_new": True
            }
        }
