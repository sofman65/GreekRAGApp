from datetime import datetime, timedelta
from uuid import uuid4
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.session import Session
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
)


class AuthService:

    # -------------------------------------------------------
    # GETTERS
    # -------------------------------------------------------
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalars().first()

    @staticmethod
    async def get_user_by_apex_id(db: AsyncSession, apex_user_id: str) -> Optional[User]:
        result = await db.execute(
            select(User).where(User.apex_user_id == apex_user_id)
        )
        return result.scalars().first()

    # -------------------------------------------------------
    # CREATE LOCAL USER (email + password)
    # -------------------------------------------------------
    @staticmethod
    async def create_local_user(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: Optional[str] = None,
    ) -> User:

        email = email.lower()

        # Check if user already exists
        existing = await AuthService.get_user_by_email(db, email)
        if existing:
            raise ValueError("Το email χρησιμοποιείται ήδη")

        user = User(
            id=uuid4(),
            email=email,
            password_hash=get_password_hash(password),
            full_name=full_name or email,
            role="user",
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    # -------------------------------------------------------
    # LOCAL AUTH (email + password)
    # -------------------------------------------------------
    @staticmethod
    async def authenticate_local(db: AsyncSession, email: str, password: str) -> Optional[User]:
        email = email.lower()
        user = await AuthService.get_user_by_email(db, email)

        if not user:
            return None

        # APEX users cannot log in locally
        if user.password_hash is None:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    # -------------------------------------------------------
    # APEX AUTH (NO PASSWORD)
    # ALWAYS CREATES/UPDATES LOCAL BACKUP USER
    # -------------------------------------------------------
    @staticmethod
    async def authenticate_apex(
        db: AsyncSession,
        *,
        apex_user_id: str,
        email: str,
        full_name: str,
    ) -> User:

        email = email.lower()

        user = await AuthService.get_user_by_apex_id(db, apex_user_id)

        # 1️⃣ User does NOT exist → create
        if not user:
            user = User(
                id=uuid4(),
                apex_user_id=apex_user_id,
                email=email,
                full_name=full_name,
                role="user",
                password_hash=None,  # important → APEX users never store passwords
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user

        # 2️⃣ User exists → update local backup
        updated = False

        if user.email != email:
            user.email = email
            updated = True

        if user.full_name != full_name:
            user.full_name = full_name
            updated = True

        if updated:
            await db.commit()
            await db.refresh(user)

        return user

    # -------------------------------------------------------
    # SESSION + TOKENS
    # -------------------------------------------------------
    @staticmethod
    async def create_session(
        db: AsyncSession,
        user: User,
        user_agent: str = None,
        ip: str = None,
    ):
        refresh_token = create_refresh_token(str(user.id))

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
