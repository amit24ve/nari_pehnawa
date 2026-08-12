from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    tagline: Optional[str] = None
    image: str
    link: str
    border_color: str = "#dc2626"
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    border_color: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class Category(CategoryBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "ELEGANT ANARKALI",
                "tagline": "Anarkalis Made For Forever Moments!",
                "image": "/category_card_1.jpg",
                "link": "/category/anarkali",
                "border_color": "#dc2626"
            }
        }
