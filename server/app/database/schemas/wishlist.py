from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WishlistItem(BaseModel):
    id: str
    user_id: str
    product_id: str
    added_at: str


class WishlistItemCreate(BaseModel):
    product_id: str


class WishlistItemWithProduct(BaseModel):
    id: str
    user_id: str
    product_id: str
    added_at: str
    product: Optional[dict] = None
