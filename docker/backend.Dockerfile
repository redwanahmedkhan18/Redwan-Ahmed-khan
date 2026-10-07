FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

RUN apt-get update && apt-get install -y --no-install-recommends curl libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir . 

COPY backend/ ./
RUN mkdir -p storage

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -fsS http://localhost:8000/ready || exit 1

# Migrate + seed on start, then serve.
CMD ["sh", "-c", "python -m alembic upgrade head && python -m app.db.seed && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
