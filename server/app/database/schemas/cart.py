from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1
    size: str
    color: Optional[str] = None
    price: float


class CartItemCreate(CartItemBase):
    pass


class CartItem(CartItemBase):
    added_at: datetime = Field(default_factory=datetime.now)


class CartBase(BaseModel):
    user_id: str
    items: List[CartItem] = []


class CartCreate(CartBase):
    pass


class CartUpdate(BaseModel):
    items: Optional[List[CartItem]] = None


class Cart(CartBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    total_amount: float = 0.0
    total_items: int = 0

    class Config:
        populate_by_name = True
