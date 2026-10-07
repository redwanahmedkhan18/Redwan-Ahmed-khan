"""Input sanitization helpers (defense-in-depth alongside output encoding in the frontend)."""

from __future__ import annotations

import html
import re

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_text(value: str | None, max_length: int = 20_000) -> str | None:
    if value is None:
        return None
    value = _CONTROL_CHARS.sub("", value).strip()
    return value[:max_length]


def escape_html(value: str | None) -> str | None:
    return html.escape(value) if value is not None else None
