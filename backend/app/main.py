"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api import api_router
from app.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.db.session import engine
from app.middleware.security_headers import SecurityHeadersMiddleware

setup_logging("DEBUG" if settings.ENVIRONMENT == "development" else "INFO")
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(_: FastAPI):  # noqa: ANN001
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.ENVIRONMENT)
    Path(settings.STORAGE_LOCAL_DIR).mkdir(parents=True, exist_ok=True)
    yield
    logger.info("Shutting down")


docs_url = "/docs" if settings.ENABLE_OPENAPI_DOCS else None
redoc_url = "/redoc" if settings.ENABLE_OPENAPI_DOCS else None
openapi_url = "/openapi.json" if settings.ENABLE_OPENAPI_DOCS else None

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Dynamic portfolio & professional profile platform API for Redwan Ahmed Khan.",
    lifespan=lifespan,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Serve locally-stored media (swap for CDN/object storage URLs in production)
_storage = Path(settings.STORAGE_LOCAL_DIR)
_storage.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(_storage)), name="media")


@app.get("/health", tags=["ops"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready", tags=["ops"])
def ready() -> dict:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:  # noqa: BLE001
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=503, content={"status": "not ready"})
