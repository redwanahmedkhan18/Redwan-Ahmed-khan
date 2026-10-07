# """FastAPI application entrypoint."""

# from __future__ import annotations

# import logging
# from contextlib import asynccontextmanager
# from pathlib import Path

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from sqlalchemy import text

# from app.api import api_router
# from app.config import settings
# from app.core.errors import register_exception_handlers
# from app.core.logging import setup_logging
# from app.db.session import engine
# from app.middleware.security_headers import SecurityHeadersMiddleware

# setup_logging("DEBUG" if settings.ENVIRONMENT == "development" else "INFO")
# logger = logging.getLogger("app.main")


# @asynccontextmanager
# async def lifespan(_: FastAPI):  # noqa: ANN001
#     logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.ENVIRONMENT)
#     Path(settings.STORAGE_LOCAL_DIR).mkdir(parents=True, exist_ok=True)
#     yield
#     logger.info("Shutting down")


# docs_url = "/docs" if settings.ENABLE_OPENAPI_DOCS else None
# redoc_url = "/redoc" if settings.ENABLE_OPENAPI_DOCS else None
# openapi_url = "/openapi.json" if settings.ENABLE_OPENAPI_DOCS else None

# app = FastAPI(
#     title=settings.APP_NAME,
#     version="1.0.0",
#     description="Dynamic portfolio & professional profile platform API for Redwan Ahmed Khan.",
#     lifespan=lifespan,
#     docs_url=docs_url,
#     redoc_url=redoc_url,
#     openapi_url=openapi_url,
# )

# app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
#     allow_headers=["Authorization", "Content-Type"],
# )

# register_exception_handlers(app)

# app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# # Serve locally-stored media (swap for CDN/object storage URLs in production)
# _storage = Path(settings.STORAGE_LOCAL_DIR)
# _storage.mkdir(parents=True, exist_ok=True)
# app.mount("/media", StaticFiles(directory=str(_storage)), name="media")


# @app.get("/health", tags=["ops"])
# def health() -> dict:
#     return {"status": "ok"}


# @app.get("/ready", tags=["ops"])
# def ready() -> dict:
#     try:
#         with engine.connect() as conn:
#             conn.execute(text("SELECT 1"))
#         return {"status": "ready"}
#     except Exception:  # noqa: BLE001
#         from fastapi.responses import JSONResponse

#         return JSONResponse(status_code=503, content={"status": "not ready"})


"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api import api_router
from app.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.db.session import engine
from app.middleware.security_headers import SecurityHeadersMiddleware


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

setup_logging(
    "DEBUG" if settings.ENVIRONMENT == "development" else "INFO"
)

logger = logging.getLogger("app.main")


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Application startup/shutdown lifecycle.

    Startup:
        - Log application startup.
        - Ensure local storage directory exists.

    Shutdown:
        - Log application shutdown.
    """

    logger.info(
        "Starting %s | environment=%s",
        settings.APP_NAME,
        settings.ENVIRONMENT,
    )

    # Ensure local media/storage directory exists.
    storage_path = Path(settings.STORAGE_LOCAL_DIR)
    storage_path.mkdir(parents=True, exist_ok=True)

    logger.info(
        "Local storage directory ready: %s",
        storage_path,
    )

    yield

    logger.info(
        "Shutting down %s",
        settings.APP_NAME,
    )


# ---------------------------------------------------------------------------
# OpenAPI / documentation configuration
# ---------------------------------------------------------------------------

docs_url = "/docs" if settings.ENABLE_OPENAPI_DOCS else None
redoc_url = "/redoc" if settings.ENABLE_OPENAPI_DOCS else None
openapi_url = "/openapi.json" if settings.ENABLE_OPENAPI_DOCS else None


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Dynamic portfolio & professional profile platform API "
        "for Redwan Ahmed Khan."
    ),
    lifespan=lifespan,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
)


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

register_exception_handlers(app)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX,
)


# ---------------------------------------------------------------------------
# Static media
# ---------------------------------------------------------------------------

_storage = Path(settings.STORAGE_LOCAL_DIR)
_storage.mkdir(parents=True, exist_ok=True)

app.mount(
    "/media",
    StaticFiles(directory=str(_storage)),
    name="media",
)


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/",
    tags=["root"],
    summary="API information",
)
def root() -> dict[str, object]:
    """
    API landing endpoint.

    This prevents GET / from returning the application's custom 404 response
    and provides useful links to the API documentation and operational
    endpoints.
    """

    return {
        "success": True,
        "message": f"{settings.APP_NAME} API is running",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.ENABLE_OPENAPI_DOCS else None,
        "redoc": "/redoc" if settings.ENABLE_OPENAPI_DOCS else None,
        "openapi": "/openapi.json" if settings.ENABLE_OPENAPI_DOCS else None,
        "health": "/health",
        "readiness": "/ready",
        "api_prefix": settings.API_V1_PREFIX,
    }


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    tags=["ops"],
    summary="Health check",
)
def health() -> dict[str, str]:
    """
    Lightweight liveness check.

    This endpoint does not query the database.
    It only confirms that the API process is alive.
    """

    return {
        "status": "ok",
    }


# ---------------------------------------------------------------------------
# Readiness endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/ready",
    tags=["ops"],
    summary="Readiness check",
)
def ready() -> dict[str, str]:
    """
    Readiness check.

    Verifies that the application can communicate with the database.
    """

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {
            "status": "ready",
        }

    except Exception:
        logger.exception("Readiness check failed")

        return JSONResponse(
            status_code=503,
            content={
                "status": "not ready",
            },
        )