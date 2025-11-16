"""
Authentication models
"""

from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str
    user: dict


class UserCreate(BaseModel):
    """User registration model"""
    username: str
    password: str
    full_name: Optional[str] = None


class User(BaseModel):
    """User information model"""
    username: str
    full_name: Optional[str] = None
    role: str = "operator"

