"""Shared API dependencies: DB session, current user, RBAC guards."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User
from app.services.auth_service import AuthService

bearer_scheme = HTTPBearer(auto_error=False)

DbDep = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> User:
    if credentials is None:
        raise AppError(
            "Not authenticated", "NOT_AUTHENTICATED", 401, headers={"WWW-Authenticate": "Bearer"}
        )
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise AppError(
            "Invalid or expired token", "INVALID_TOKEN", 401, headers={"WWW-Authenticate": "Bearer"}
        )
    user = AuthService(db).get_user(uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise AppError("User no longer exists or is disabled", "INVALID_TOKEN", 401)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: str):
    def guard(user: CurrentUser) -> User:
        if user.role.name not in roles:
            raise AppError("Insufficient permissions", "FORBIDDEN", 403)
        return user

    return Depends(guard)


SUPER_ADMIN = require_roles("SUPER_ADMIN")
EDITOR_OR_ABOVE = require_roles("SUPER_ADMIN", "EDITOR")
