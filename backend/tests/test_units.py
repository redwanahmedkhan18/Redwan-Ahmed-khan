"""Unit tests: security primitives, slugify, sanitization."""

from __future__ import annotations

from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.utils.sanitize import sanitize_text
from app.utils.slugify import slugify


def test_argon2id_hash_and_verify():  # noqa: ANN201
    h = hash_password("S3cure-password!")
    assert h.startswith("$argon2id$")
    assert verify_password("S3cure-password!", h)
    assert not verify_password("wrong", h)


def test_jwt_roundtrip():  # noqa: ANN201
    token = create_access_token("user-1", "SUPER_ADMIN")
    payload = decode_access_token(token)
    assert payload is not None and payload["sub"] == "user-1" and payload["role"] == "SUPER_ADMIN"
    assert decode_access_token(token + "x") is None
    assert decode_access_token("garbage") is None


def test_refresh_token_hashing():  # noqa: ANN201
    raw, hashed = generate_refresh_token()
    assert hashed == hash_refresh_token(raw)
    assert raw not in hashed


def test_slugify():  # noqa: ANN201
    assert slugify("CARE-RAG: Risk-Aware Retrieval!") == "care-rag-risk-aware-retrieval"
    assert slugify("  Hello   World  ") == "hello-world"
    assert slugify("") == "item"


def test_sanitize_text():  # noqa: ANN201
    assert sanitize_text("  hi\x00there\x1f  ") == "hithere"
    assert sanitize_text("x" * 50, max_length=10) == "x" * 10
    assert sanitize_text(None) is None
