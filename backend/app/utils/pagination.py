"""Pagination helpers."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def create(cls, items: list, total: int, page: int, page_size: int):  # noqa: ANN001
        pages = max(1, -(-total // page_size))
        return cls(items=items, total=total, page=page, page_size=page_size, pages=pages)
