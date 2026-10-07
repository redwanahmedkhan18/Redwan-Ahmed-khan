
FROM python:3.12-slim AS base

# ------------------------------------------------------------------
# Python runtime configuration
# ------------------------------------------------------------------

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/srv

WORKDIR /srv


# ------------------------------------------------------------------
# System dependencies
# ------------------------------------------------------------------

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*


# ------------------------------------------------------------------
# Python dependencies
# ------------------------------------------------------------------

COPY backend/pyproject.toml ./

RUN pip install --no-cache-dir .


# ------------------------------------------------------------------
# Application source
# ------------------------------------------------------------------

COPY backend/ ./


# ------------------------------------------------------------------
# Application storage
# ------------------------------------------------------------------

RUN mkdir -p /srv/storage


# ------------------------------------------------------------------
# FastAPI port
# ------------------------------------------------------------------

EXPOSE 8000


# ------------------------------------------------------------------
# Docker health check
# ------------------------------------------------------------------

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=15s \
    --retries=3 \
    CMD curl -fsS http://localhost:8000/ready || exit 1


# ------------------------------------------------------------------
# Database migration + seed + FastAPI
# ------------------------------------------------------------------
#
# 1. Run Alembic migrations
# 2. Seed initial portfolio/admin data
# 3. Start Uvicorn
#
# `exec` ensures Uvicorn becomes PID 1 and receives
# Docker signals correctly.
# ------------------------------------------------------------------

CMD ["sh", "-c", "python -m alembic upgrade head && python -m app.db.seed && exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
