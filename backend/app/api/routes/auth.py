"""
Authentication routes for login, signup, and user management
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)
from app.models.auth import Token, UserCreate, User

router = APIRouter()

# In-memory user store (replace with database in production)
users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": get_password_hash("1234"),
        "full_name": "Διαχειριστής Συστήματος",
        "role": "admin"
    }
}


def get_user(username: str):
    """Get user from database"""
    if username in users_db:
        return users_db[username]
    return None


@router.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    """Register a new user"""
    if user.username in users_db:
        raise HTTPException(
            status_code=400,
            detail="Το όνομα χρήστη υπάρχει ήδη"
        )
    
    users_db[user.username] = {
        "username": user.username,
        "hashed_password": get_password_hash(user.password),
        "full_name": user.full_name or user.username,
        "role": "operator"
    }
    
    return {
        "status": "success",
        "message": "Ο λογαριασμός δημιουργήθηκε επιτυχώς"
    }


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return token"""
    user = get_user(form_data.username)
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Λανθασμένα στοιχεία σύνδεσης",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }


@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user = get_user(current_user["username"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(
        username=user["username"],
        full_name=user["full_name"],
        role=user["role"]
    )


@router.post("/logout")
async def logout():
    """Logout endpoint (client should remove token)"""
    return {
        "status": "success",
        "message": "Αποσυνδεθήκατε επιτυχώς"
    }

