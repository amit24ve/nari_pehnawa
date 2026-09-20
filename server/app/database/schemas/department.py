from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Department(BaseModel):
    id: Optional[str] = None
    _id: Optional[str] = None
    name: str
    icon: Optional[str] = "📁"
    slug: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True
    category_count: Optional[int] = 0
    product_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DepartmentCreate(BaseModel):
    name: str
    icon: Optional[str] = "📁"
    slug: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
