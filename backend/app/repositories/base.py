"""Generic data-access layer.

All queries go through SQLAlchemy (parameterized) — no string-built SQL anywhere.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]
    #: columns used for `q=` search in admin lists
    search_fields: tuple[str, ...] = ()
    default_sort: tuple[str, str] = ("display_order", "asc")

    def __init__(self, db: Session):
        self.db = db

    # --- reads -------------------------------------------------------------
    def get(self, entity_id: uuid.UUID | str) -> ModelT | None:
        return self.db.get(self.model, uuid.UUID(str(entity_id)))

    def get_by(self, **kwargs: Any) -> ModelT | None:
        stmt = select(self.model).filter_by(**kwargs)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_slug(self, slug: str) -> ModelT | None:
        return self.get_by(slug=slug)  # type: ignore[attr-defined]

    def list(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        status: str | None = None,
        q: str | None = None,
        sort: str | None = None,
        direction: str = "asc",
        extra_filters: Sequence[Any] = (),
        paginate: bool = True,
    ) -> tuple[list[ModelT], int]:
        stmt: Select = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)
        for f in extra_filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)
        if status:
            stmt = stmt.where(self.model.status == status)  # type: ignore[attr-defined]
            count_stmt = count_stmt.where(self.model.status == status)  # type: ignore[attr-defined]
        if q and self.search_fields:
            like = f"%{q.strip()}%"
            cond = or_(
                *[
                    getattr(self.model, f).ilike(like)
                    for f in self.search_fields
                    if hasattr(self.model, f)
                ]
            )
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        sort_field = sort or self.default_sort[0]
        sort_dir = direction if sort else self.default_sort[1]
        column = getattr(self.model, sort_field, None)
        if column is not None:
            stmt = stmt.order_by(column.desc() if sort_dir == "desc" else column.asc())

        total = self.db.execute(count_stmt).scalar_one()
        if paginate:
            stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        items = list(self.db.execute(stmt).scalars().unique().all())
        return items, total

    # --- writes ------------------------------------------------------------
    def create(self, **data: Any) -> ModelT:
        obj = self.model(**data)
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelT, data: dict[str, Any]) -> ModelT:
        for key, value in data.items():
            setattr(obj, key, value)
        self.db.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.flush()

    def save(self) -> None:
        self.db.commit()
