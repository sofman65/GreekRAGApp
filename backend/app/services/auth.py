from datetime import datetime, timedelta
from uuid import uuid4
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.session import Session
from app.core.security import create_access_token, create_refresh_token, verify_password, hash_password


class AuthService:

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_apex_id(db: AsyncSession, apex_user_id: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.apex_user_id == apex_user_id))
        return result.scalars().first()

    # -----------------------------
    # LOCAL LOGIN
    # -----------------------------
    @staticmethod
    async def authenticate_local(db: AsyncSession, email: str, password: str):
        user = await AuthService.get_user_by_email(db, email)
        if not user or not verify_password(password, user.password_hash):
            return None
        return user

    # -----------------------------
    # APEX LOGIN (NO PASSWORD)
    # -----------------------------
    @staticmethod
    async def authenticate_apex(db: AsyncSession, *, apex_user_id: str, email: str, full_name: str):

        user = await AuthService.get_user_by_apex_id(db, apex_user_id)

        if not user:
            user = User(
                id=uuid4(),
                apex_user_id=apex_user_id,
                email=email,
                full_name=full_name,
                role="user",
            )
            db.add(user)
            await db.commit()

        else:
            # Update profile from APEX if changed
            user.email = email
            user.full_name = full_name
            await db.commit()

        return user

    # -----------------------------
    # SESSION CREATION
    # -----------------------------
    @staticmethod
    async def create_session(db: AsyncSession, user: User, user_agent: str = None, ip: str = None):
        refresh_token = create_refresh_token(user.id)

        session = Session(
            id=uuid4(),
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=30),
            user_agent=user_agent,
            ip_address=ip,
        )

        db.add(session)
        await db.commit()

        access_token = create_access_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user,
        }
