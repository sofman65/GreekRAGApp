from pydantic import BaseModel, EmailStr
from typing import Optional


class UserOut(BaseModel):
    id: str
    email: Optional[EmailStr]
    full_name: Optional[str]
    role: str
    refresh_token: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str]


class ApexLoginSchema(BaseModel):
    apex_user_id: str
    email: EmailStr
    full_name: str


class RefreshRequest(BaseModel):
    refresh_token: str


# Backwards compatibility alias for routes using `User`
class User(UserOut):
    """Alias of UserOut used in route response models."""
    pass
