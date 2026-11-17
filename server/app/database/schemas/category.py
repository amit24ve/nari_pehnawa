from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    department: Optional[str] = "Women"
    tagline: Optional[str] = None
    image: str
    link: str
    border_color: str = "#8B0000"
    display_order: int = 0
    is_active: bool = True
    sub_categories: Optional[List[str]] = []
    category_type: Optional[str] = "regular"  # "regular" | "special_collection" | "sale" | "new_arrival"
    icon: Optional[str] = None
    badge: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    tagline: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    border_color: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    sub_categories: Optional[List[str]] = None
    category_type: Optional[str] = None
    icon: Optional[str] = None
    badge: Optional[str] = None


class Category(CategoryBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "Sleeveless Kurtis",
                "department": "Women",
                "tagline": "Fresh Floral Ethnic Designs",
                "image": "/category_card_1.jpg",
                "link": "/category/sleeveless-kurtis",
                "border_color": "#8B0000",
                "sub_categories": ["Cotton Sleeveless", "Printed Sleeveless", "Short Sleeveless"],
                "category_type": "regular",
                "badge": "POPULAR"
            }
        }
