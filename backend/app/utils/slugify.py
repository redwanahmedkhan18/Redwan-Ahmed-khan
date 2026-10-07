"""Slug utilities."""

from __future__ import annotations

import re
import unicodedata


def slugify(value: str, max_length: int = 180) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^\w\s-]", "", value.lower())
    value = re.sub(r"[-\s_]+", "-", value).strip("-")
    return value[:max_length] or "item"


def unique_slug(session, model, base: str, exclude_id=None) -> str:  # noqa: ANN001
    from sqlalchemy import select

    candidate, n = base, 2
    while True:
        stmt = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if session.execute(stmt).first() is None:
            return candidate
        candidate = f"{base}-{n}"
        n += 1
