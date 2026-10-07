"""Production logging configuration.

Never log passwords, JWT secrets, or full private message bodies.
"""

from __future__ import annotations

import logging
import sys

SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "token",
    "secret",
    "authorization",
    "message",
    "project_description",
}


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]
    # Silence noisy libs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def redact(data: dict) -> dict:
    """Strip sensitive values before anything is logged/audited."""
    return {k: ("[redacted]" if k.lower() in SENSITIVE_KEYS else v) for k, v in data.items()}
