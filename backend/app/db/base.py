"""Declarative base, naming conventions and shared mixins."""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Index, Integer, MetaData, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column

from app.db.types import GUID

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


def utcnow() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=utcnow, nullable=False
    )


class PublishableMixin(UUIDPrimaryKeyMixin, TimestampMixin):
    """Shared lifecycle columns for every content entity."""

    status: Mapped[str] = mapped_column(String(16), default="draft", nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    @declared_attr
    def __table_args__(cls):  # noqa: N805
        return (
            CheckConstraint("status IN ('draft','published','archived')", name="status_valid"),
            Index(f"ix_{cls.__tablename__}_status_order", "status", "display_order"),
        )


class SluggedMixin:
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)


class DatedMixin:
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
