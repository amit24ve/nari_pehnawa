from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: str
    email: EmailStr
    name: str = "User"
    role: Optional[str] = "customer"  # customer or admin
    is_admin: Optional[bool] = False
    age: Optional[int] = None
    status: Optional[str] = "active"  # active or inactive
    joined_date: Optional[str] = None
    last_login: Optional[str] = None
    orders_count: Optional[int] = 0
    phone: Optional[str] = None
    bio: Optional[str] = None
    auth_provider: Optional[str] = None
    avatar: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Optional[str] = "customer"
    is_admin: Optional[bool] = False
    age: Optional[int] = None
    status: Optional[str] = "active"
    phone: Optional[str] = None
    bio: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    age: Optional[int] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    last_login: Optional[str] = None
    bio: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: Optional[str] = None
    new_password: str


class UserSettings(BaseModel):
    notifications: Optional[dict] = None
    privacy: Optional[dict] = None