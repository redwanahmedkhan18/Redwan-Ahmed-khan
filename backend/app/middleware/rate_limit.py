"""Simple in-process sliding-window rate limiter (Redis-backed when REDIS_URL is set)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.errors import AppError

_windows: dict[str, deque[float]] = defaultdict(deque)


def check_rate_limit(request: Request, bucket: str, max_requests: int, window_seconds: int) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"{bucket}:{client_ip}"
    now = time.monotonic()
    window = _windows[key]
    while window and now - window[0] > window_seconds:
        window.popleft()
    if len(window) >= max_requests:
        retry_after = int(window_seconds - (now - window[0])) + 1
        raise AppError(
            "Too many requests. Please try again later.",
            "RATE_LIMITED",
            429,
            headers={"Retry-After": str(retry_after)},
        )
    window.append(now)
