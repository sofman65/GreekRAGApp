"""
Authentication routes for login, signup, and user management
"""

import secrets
from datetime import timedelta, datetime

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.db.session import get_db
from app.schemas.auth import Token, UserCreate, User
from app.models.user import User as UserModel
from app.models.session import Session as SessionModel
from app.schemas.auth import ApexLoginSchema
from app.services.auth import AuthService
from fastapi import Request

router = APIRouter()


async def _get_user_by_email(db: AsyncSession, email: str) -> UserModel | None:
    stmt = select(UserModel).where(UserModel.email == email)
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def _create_session(db: AsyncSession, user_id, expires_at: datetime) -> str:
    refresh_token = secrets.token_urlsafe(48)
    session_obj = SessionModel(
        user_id=user_id,
        refresh_token=refresh_token,
        expires_at=expires_at,
    )
    db.add(session_obj)
    await db.commit()
    return refresh_token


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user in the database."""
    existing = await _get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Το email υπάρχει ήδη")

    hashed = get_password_hash(payload.password)
    user = UserModel(
        email=payload.email,
        password_hash=hashed,
        full_name=payload.full_name or payload.email,
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"status": "success", "user_id": str(user.id)}


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    user = await AuthService.authenticate_local(
        db,
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=401, detail="Λανθασμένα στοιχεία σύνδεσης")

    session_data = await AuthService.create_session(
        db,
        user,
        user_agent=request.headers.get("User-Agent"),
        ip=request.client.host,
    )

    return {
        "access_token": session_data["access_token"],
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "refresh_token": session_data["refresh_token"],
        }
    }


@router.post("/apex-login", response_model=Token)
async def apex_login(
    payload: ApexLoginSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Login from APEX (no password).
    If user doesn't exist → create.
    If user exists → update profile.
    Then create session + return tokens.
    """

    user = await AuthService.authenticate_apex(
        db,
        apex_user_id=payload.apex_user_id,
        email=payload.email,
        full_name=payload.full_name,
    )

    session_data = await AuthService.create_session(
        db,
        user,
        user_agent=request.headers.get("User-Agent"),
        ip=request.client.host,
    )

    return {
        "access_token": session_data["access_token"],
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "refresh_token": session_data["refresh_token"],
        },
    }


@router.get("/me", response_model=User)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """Get current user information."""
    return User(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
    )


@router.post("/logout")
async def logout(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke refresh tokens for current user (client should discard access token)."""
    await db.execute(delete(SessionModel).where(SessionModel.user_id == current_user.id))
    await db.commit()
    return {"status": "success", "message": "Αποσυνδεθήκατε επιτυχώς"}
