from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReviewBase(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    user_id: str
    user_name: str
    rating: float = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    images: List[str] = []
    verified_purchase: bool = False
    size_purchased: Optional[str] = None
    color_purchased: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None  # pending, approved, rejected


class Review(ReviewBase):
    id: str = Field(alias="_id")
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    helpful_count: int = 0

    class Config:
        populate_by_name = True
