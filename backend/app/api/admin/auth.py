"""Admin auth endpoints: login / refresh / logout / me / change-password."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Cookie, Request, Response
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DbDep
from app.config import settings
from app.core.errors import AppError
from app.middleware.rate_limit import check_rate_limit
from app.schemas import LoginRequest, TokenResponse, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["admin-auth"])

REFRESH_COOKIE = "refresh_token"


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        raw_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path=f"{settings.API_V1_PREFIX}/admin/auth",
    )


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    response: Response,
    db: DbDep,
    payload: LoginRequest,
) -> TokenResponse:
    check_rate_limit(request, "login", settings.RATE_LIMIT_LOGIN_PER_MINUTE, 60)
    user, access, refresh = AuthService(db).authenticate(
        payload.email,
        payload.password,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    _set_refresh_cookie(response, refresh)
    return TokenResponse(
        access_token=access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    db: DbDep,
    refresh_token: Annotated[str | None, Cookie(alias=REFRESH_COOKIE)] = None,
) -> TokenResponse:
    if not refresh_token:
        raise AppError("Missing refresh token", "INVALID_REFRESH_TOKEN", 401)
    user, access, new_refresh = AuthService(db).rotate_refresh(
        refresh_token, ip=request.client.host if request.client else None
    )
    _set_refresh_cookie(response, new_refresh)
    return TokenResponse(
        access_token=access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.post("/logout")
def logout(
    response: Response,
    db: DbDep,
    refresh_token: Annotated[str | None, Cookie(alias=REFRESH_COOKIE)] = None,
):  # noqa: ANN201
    AuthService(db).logout(refresh_token)
    response.delete_cookie(REFRESH_COOKIE, path=f"{settings.API_V1_PREFIX}/admin/auth")
    return {"success": True, "message": "Logged out"}


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=10, max_length=128)


@router.post("/change-password")
def change_password(
    db: DbDep, user: CurrentUser, payload: ChangePasswordRequest, background: BackgroundTasks
):  # noqa: ANN202
    from app.core.security import verify_password

    if not verify_password(payload.current_password, user.hashed_password):
        raise AppError("Current password is incorrect", "INVALID_CREDENTIALS", 401)
    AuthService(db).change_password(user, payload.new_password, actor=user)
    return {"success": True, "message": "Password changed. All sessions were signed out."}
