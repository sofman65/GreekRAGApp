"""
Authentication models
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str
    user: dict


class UserCreate(BaseModel):
    """User registration model"""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class User(BaseModel):
    """User information model"""
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"
