"""Consistent API error envelope and centralized exception handling.

Every error response has the shape:
    {"success": false, "message": "...", "error_code": "..."}
Internal stack traces are never exposed in production.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app.errors")


class AppError(Exception):
    """Domain error with a stable machine-readable code."""

    def __init__(
        self, message: str, error_code: str, status_code: int = 400, headers: dict | None = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.headers = headers or {}


class NotFoundError(AppError):
    def __init__(self, entity: str = "Resource"):
        super().__init__(
            f"{entity} not found", f"{entity.upper().replace(' ', '_')}_NOT_FOUND", 404
        )


class ConflictError(AppError):
    def __init__(self, message: str, error_code: str = "CONFLICT"):
        super().__init__(message, error_code, 409)


class ValidationError(AppError):
    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR"):
        super().__init__(message, error_code, 422)


def _envelope(message: str, error_code: str) -> dict:
    return {"success": False, "message": message, "error_code": error_code}


def register_exception_handlers(app: FastAPI) -> None:
    from app.config import settings

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:  # noqa: ANN001
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.message, exc.error_code),
            headers=exc.headers,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:  # noqa: ANN001
        code = (
            str(exc.detail).upper().replace(" ", "_")
            if isinstance(exc.detail, str)
            else "HTTP_ERROR"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(str(exc.detail), code),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:  # noqa: ANN001
        first = exc.errors()[0] if exc.errors() else {}
        loc = ".".join(str(x) for x in first.get("loc", []) if x != "body")
        message = (
            f"{loc}: {first.get('msg', 'Invalid request')}"
            if loc
            else first.get("msg", "Invalid request")
        )
        return JSONResponse(status_code=422, content=_envelope(message, "VALIDATION_ERROR"))

    @app.exception_handler(IntegrityError)
    async def integrity_handler(_: Request, exc: IntegrityError) -> JSONResponse:  # noqa: ANN001
        logger.warning("Integrity error: %s", exc.orig)
        return JSONResponse(
            status_code=409,
            content=_envelope(
                "Database integrity conflict (duplicate or constraint violation).",
                "INTEGRITY_CONFLICT",
            ),
        )

    @app.exception_handler(SQLAlchemyError)
    async def db_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:  # noqa: ANN001
        logger.exception("Database error", exc_info=exc)
        return JSONResponse(
            status_code=500, content=_envelope("A database error occurred.", "DATABASE_ERROR")
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:  # noqa: ANN001
        logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
        message = str(exc) if not settings.is_production else "Internal server error."
        return JSONResponse(status_code=500, content=_envelope(message, "INTERNAL_ERROR"))
