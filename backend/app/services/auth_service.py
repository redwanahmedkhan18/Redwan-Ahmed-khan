"""Authentication service: login with lockout, refresh rotation with reuse detection, logout."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from app.models import AuditLog, RefreshToken, User


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------ #
    def authenticate(
        self, email: str, password: str, *, ip: str | None = None, user_agent: str | None = None
    ) -> tuple[User, str, str]:
        user = self.db.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()
        generic_error = AppError("Invalid email or password", "INVALID_CREDENTIALS", 401)

        if user is None:
            raise generic_error
        if not user.is_active:
            raise AppError("Account is disabled", "ACCOUNT_DISABLED", 403)
        if user.locked_until and user.locked_until > datetime.now(UTC):
            raise AppError(
                "Account temporarily locked due to repeated failed logins", "ACCOUNT_LOCKED", 423
            )

        if not verify_password(password, user.hashed_password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.now(UTC) + timedelta(
                    seconds=settings.LOGIN_LOCKOUT_SECONDS
                )
                user.failed_login_attempts = 0
            self.db.add(
                AuditLog(
                    action="login_failed",
                    entity_type="users",
                    entity_id=str(user.id),
                    ip_address=ip,
                )
            )
            self.db.commit()
            raise generic_error

        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(UTC)

        access = create_access_token(str(user.id), user.role.name)
        raw_refresh, refresh_hash = generate_refresh_token()
        self.db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=refresh_hash,
                expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
                user_agent=(user_agent or "")[:255] or None,
            )
        )
        self.db.add(
            AuditLog(action="login", entity_type="users", entity_id=str(user.id), ip_address=ip)
        )
        self.db.commit()
        self.db.refresh(user)
        return user, access, raw_refresh

    # ------------------------------------------------------------------ #
    def rotate_refresh(self, raw_token: str, *, ip: str | None = None) -> tuple[User, str, str]:
        token_hash = hash_refresh_token(raw_token)
        record = self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        ).scalar_one_or_none()
        invalid = AppError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN", 401)
        if record is None:
            raise invalid

        # Reuse detection: a revoked token being replayed ⇒ revoke the whole chain for safety.
        if record.revoked_at is not None:
            self.db.execute(
                RefreshToken.__table__.update()
                .where(RefreshToken.user_id == record.user_id, RefreshToken.revoked_at.is_(None))
                .values(revoked_at=datetime.now(UTC))
            )
            self.db.add(
                AuditLog(
                    action="refresh_reuse_detected",
                    entity_type="users",
                    entity_id=str(record.user_id),
                    ip_address=ip,
                )
            )
            self.db.commit()
            raise invalid

        if record.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise invalid

        user = self.db.get(User, record.user_id)
        if user is None or not user.is_active:
            raise invalid

        record.revoked_at = datetime.now(UTC)
        access = create_access_token(str(user.id), user.role.name)
        new_raw, new_hash = generate_refresh_token()
        new_record = RefreshToken(
            user_id=user.id,
            token_hash=new_hash,
            expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            replaced_by_id=None,
        )
        record.replaced_by_id = new_record.id or uuid.uuid4()
        self.db.add(new_record)
        self.db.flush()
        record.replaced_by_id = new_record.id
        self.db.commit()
        self.db.refresh(user)
        return user, access, new_raw

    # ------------------------------------------------------------------ #
    def logout(self, raw_token: str | None) -> None:
        if not raw_token:
            return
        record = self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(raw_token))
        ).scalar_one_or_none()
        if record and record.revoked_at is None:
            record.revoked_at = datetime.now(UTC)
            self.db.add(
                AuditLog(action="logout", entity_type="users", entity_id=str(record.user_id))
            )
            self.db.commit()

    # ------------------------------------------------------------------ #
    def get_user(self, user_id: uuid.UUID | str) -> User | None:
        return self.db.get(User, uuid.UUID(str(user_id)))

    def change_password(self, user: User, new_password: str, actor: Any | None = None) -> None:
        from app.core.security import hash_password

        user.hashed_password = hash_password(new_password)
        # Revoke all refresh tokens on password change
        self.db.execute(
            RefreshToken.__table__.update()
            .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        self.db.add(
            AuditLog(
                action="password_changed",
                entity_type="users",
                entity_id=str(user.id),
                actor_id=getattr(actor, "id", None),
            )
        )
        self.db.commit()
