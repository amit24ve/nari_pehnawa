from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Brand(BaseModel):
    id: Optional[str] = None
    _id: Optional[str] = None
    name: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = "India"
    description: Optional[str] = None
    status: Optional[str] = "Active"
    is_active: Optional[bool] = True
    display_order: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BrandCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = "India"
    description: Optional[str] = None
    status: Optional[str] = "Active"
    is_active: Optional[bool] = True
    display_order: Optional[int] = 0


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
