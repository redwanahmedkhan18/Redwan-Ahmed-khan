"""Notification service — sends admin emails for contact/hire submissions.

Runs as a FastAPI BackgroundTask. If SMTP is not configured (local dev), the
notification is logged instead of failing the request. No private message
content is logged — only the fact that a notification was queued.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger("app.notifications")


def send_notification(subject: str, body: str, to: str | None = None) -> bool:
    recipient = to or settings.NOTIFY_EMAIL
    if not recipient:
        logger.info("Notification queued (SMTP/NOTIFY_EMAIL not configured): %s", subject)
        return False
    if not settings.SMTP_HOST:
        logger.info("SMTP not configured; skipping email: %s", subject)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = recipient
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD or "")
            server.send_message(msg)
        logger.info("Notification email sent: %s", subject)
        return True
    except Exception:  # noqa: BLE001 — email failure must never break the public API
        logger.exception("Failed to send notification email: %s", subject)
        return False
