"""Test fixtures — isolated SQLite DB, TestClient, seeded admin."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Configure environment BEFORE importing the app
_tmpdir = tempfile.mkdtemp(prefix="portfolio-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmpdir) / 'test.db'}"
os.environ["ENVIRONMENT"] = "testing"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "ChangeMe!123"
os.environ["STORAGE_LOCAL_DIR"] = str(Path(_tmpdir) / "storage")
os.environ["SECRET_KEY"] = "test-secret"
os.environ["JWT_SECRET"] = "test-jwt-secret"
os.environ["RATE_LIMIT_LOGIN_PER_MINUTE"] = "10000"
os.environ["RATE_LIMIT_CONTACT_PER_HOUR"] = "6"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.logging import setup_logging  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.seed import run_seed  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402

setup_logging("WARNING")


@pytest.fixture(scope="session", autouse=True)
def _database():  # noqa: ANN202
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        run_seed(db)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():  # noqa: ANN202
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def admin_headers(client: TestClient) -> dict:  # noqa: ANN202
    r = client.post(
        "/api/v1/admin/auth/login", json={"email": "admin@example.com", "password": "ChangeMe!123"}
    )
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
