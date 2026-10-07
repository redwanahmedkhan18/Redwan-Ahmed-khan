"""Generic content service: CRUD + publishing workflow + child-entity sync + audit trail.

Business logic lives here (never in routers). One service class per resource,
parameterized by a ResourceConfig so the layering stays explicit and DRY.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.db.base import Base
from app.models import AuditLog
from app.repositories.base import BaseRepository
from app.utils.slugify import slugify, unique_slug


@dataclass
class ChildConfig:
    """Describes a normalized child collection replaced wholesale on update."""

    attr: str  # relationship attribute on parent, e.g. "technologies"
    model: type[Base]  # e.g. ProjectTechnology
    fields: tuple[str, ...]  # fields copied from the incoming payload dicts


@dataclass
class ResourceConfig:
    key: str  # URL segment, e.g. "projects"
    label: str  # human label for errors/audit, e.g. "Project"
    model: type[Base]
    create_schema: type[BaseModel]
    update_schema: type[BaseModel]
    search_fields: tuple[str, ...] = ()
    slug_field: str | None = None  # model attr holding the slug
    slug_source: str | None = None  # field used to generate the slug (e.g. "name"/"title")
    default_sort: tuple[str, str] = ("display_order", "asc")
    children: list[ChildConfig] = field(default_factory=list)
    publishable: bool = True  # False for resources without the draft/published lifecycle
    before_save: Callable[[Base, dict, Session], None] | None = None  # hook for extra rules


class ContentService:
    def __init__(self, db: Session, config: ResourceConfig):
        self.db = db
        self.config = config
        self.repo = BaseRepository[config.model](db)  # type: ignore[valid-type]
        self.repo.model = config.model  # type: ignore[assignment]
        self.repo.search_fields = config.search_fields
        self.repo.default_sort = config.default_sort

    # --- public reads -------------------------------------------------------
    def list_published(
        self, *, page: int = 1, page_size: int = 50, extra_filters: list | None = None
    ) -> tuple[list, int]:
        return self.repo.list(
            status="published", page=page, page_size=page_size, extra_filters=extra_filters or []
        )

    def get_published_by_slug(self, slug: str):  # noqa: ANN201
        obj = self.repo.get_by_slug(slug)
        if obj is None or obj.status != "published":
            raise NotFoundError(self.config.label)
        return obj

    # --- admin reads --------------------------------------------------------
    def admin_list(self, **kwargs: Any) -> tuple[list, int]:
        return self.repo.list(**kwargs)

    def admin_get(self, entity_id: uuid.UUID | str):  # noqa: ANN201
        obj = self.repo.get(entity_id)
        if obj is None:
            raise NotFoundError(self.config.label)
        return obj

    # --- writes -------------------------------------------------------------
    def _prepare_data(self, payload: BaseModel, *, existing=None) -> dict[str, Any]:  # noqa: ANN001
        data = payload.model_dump(exclude_unset=True)
        child_keys = {c.attr for c in self.config.children}
        scalar = {k: v for k, v in data.items() if k not in child_keys}

        # Slug handling
        if self.config.slug_field and self.config.slug_source:
            source_value = scalar.get(self.config.slug_source) or (
                getattr(existing, self.config.slug_source, None) if existing else None
            )
            explicit = scalar.pop(self.config.slug_field, None)
            base = slugify(explicit or source_value or self.config.key)
            exclude = existing.id if existing is not None else None
            if (
                existing is None
                or explicit
                or (source_value and getattr(existing, self.config.slug_field, None) != base)
            ):
                scalar[self.config.slug_field] = unique_slug(
                    self.db, self.config.model, base, exclude_id=exclude
                )

        # Date/boolean business rules delegated to model constraints + hooks
        if self.config.before_save:
            obj = (
                existing
                if existing is not None
                else self.config.model(
                    **{k: v for k, v in scalar.items() if hasattr(self.config.model, k)}
                )
            )
            self.config.before_save(obj, scalar, self.db)

        return {"scalar": scalar, "children": {k: data[k] for k in child_keys if k in data}}

    def _sync_children(self, obj: Any, children: dict[str, list]) -> None:
        for child in self.config.children:
            if child.attr not in children:
                continue
            setattr(obj, child.attr, [])
            self.db.flush()
            for i, item in enumerate(children[child.attr]):
                values = {f: item.get(f) for f in child.fields if f in item}
                if hasattr(child.model, "display_order"):
                    values.setdefault("display_order", i)
                setattr(obj, child.attr, list(getattr(obj, child.attr)) + [child.model(**values)])
        self.db.flush()

    def create(self, payload: BaseModel, actor: Any | None = None) -> Any:  # noqa: ANN001, ANN401
        prepared = self._prepare_data(payload)
        obj = self.config.model(**prepared["scalar"])
        self._sync_children(obj, prepared["children"])
        if (
            getattr(obj, "status", None) == "published"
            and getattr(obj, "published_at", None) is None
        ):
            obj.published_at = datetime.now(UTC)
        self.db.add(obj)
        self.db.flush()
        self._audit("create", obj, actor)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(
        self, entity_id: uuid.UUID | str, payload: BaseModel, actor: Any | None = None
    ) -> Any:  # noqa: ANN001, ANN401
        obj = self.admin_get(entity_id)
        prepared = self._prepare_data(payload, existing=obj)
        self.repo.update(obj, prepared["scalar"])
        self._sync_children(obj, prepared["children"])
        self._audit(
            "update",
            obj,
            actor,
            detail_keys=list(prepared["scalar"].keys()) + list(prepared["children"].keys()),
        )
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, entity_id: uuid.UUID | str, actor: Any | None = None) -> None:  # noqa: ANN001
        obj = self.admin_get(entity_id)
        self._audit("delete", obj, actor)
        self.repo.delete(obj)
        self.db.commit()

    def set_status(self, entity_id: uuid.UUID | str, status: str, actor: Any | None = None) -> Any:  # noqa: ANN001, ANN401
        if status not in {"draft", "published", "archived"}:
            raise ValidationError("Invalid status")
        if not self.config.publishable:
            raise ValidationError(
                f"{self.config.label} does not use the publishing workflow", "NOT_PUBLISHABLE"
            )
        obj = self.admin_get(entity_id)
        obj.status = status
        if status == "published" and obj.published_at is None:
            obj.published_at = datetime.now(UTC)
        self._audit(
            {"published": "publish", "draft": "unpublish", "archived": "archive"}[status],
            obj,
            actor,
        )
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def reorder(self, ordered_ids: list[uuid.UUID], actor: Any | None = None) -> None:  # noqa: ANN001
        for i, entity_id in enumerate(ordered_ids):
            obj = self.repo.get(entity_id)
            if obj is None:
                raise NotFoundError(self.config.label)
            obj.display_order = i
        self._audit("reorder", None, actor, detail={"count": len(ordered_ids)})
        self.db.commit()

    # --- audit ---------------------------------------------------------------
    def _audit(
        self,
        action: str,
        obj: Any | None,
        actor: Any | None,
        detail: Any = None,
        detail_keys: list | None = None,
    ) -> None:  # noqa: ANN001, ANN401
        payload: dict[str, Any] = {
            "action": action,
            "entity_type": self.config.key,
            "entity_id": str(obj.id) if obj is not None else None,
            "actor_id": getattr(actor, "id", None),
        }
        if detail is not None:
            payload["detail"] = detail
        elif detail_keys is not None:
            payload["detail"] = {"fields": detail_keys}  # field names only — no content logged
        self.db.add(AuditLog(**payload))
        self.db.flush()


class SlugUniquenessError(ConflictError):
    def __init__(self) -> None:
        super().__init__("Slug already exists", "SLUG_CONFLICT")
