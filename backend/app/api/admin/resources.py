"""Generic admin CRUD for every registry resource.

Uniform surface per resource:
    GET    /admin/{key}                 list (pagination, status filter, search, sort)
    POST   /admin/{key}                 create
    GET    /admin/{key}/{id}            detail
    PATCH  /admin/{key}/{id}            partial update
    DELETE /admin/{key}/{id}            delete
    POST   /admin/{key}/{id}/publish    publish
    POST   /admin/{key}/{id}/unpublish  back to draft
    POST   /admin/{key}/{id}/archive    archive
    POST   /admin/{key}/reorder         explicit display_order
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import EDITOR_OR_ABOVE, DbDep
from app.schemas import MessageResponse, ReorderRequest
from app.services.base import ContentService
from app.services.registry import REGISTRY
from app.utils.pagination import Page

router = APIRouter(tags=["admin"])

# resource key → (Read schema, List response schema)
from app import schemas  # noqa: E402

_READ_SCHEMAS: dict[str, type] = {
    "education": schemas.EducationRead,
    "experience": schemas.ExperienceRead,
    "projects": schemas.ProjectRead,
    "ml-projects": schemas.MLProjectRead,
    "research": schemas.ResearchPaperRead,
    "open-source": schemas.OpenSourceRead,
    "achievements": schemas.AchievementRead,
    "certifications": schemas.CertificationRead,
    "testimonials": schemas.TestimonialRead,
    "blog": schemas.BlogPostRead,
    "social-links": schemas.SocialLinkRead,
    "skill-categories": schemas.SkillCategoryRead,
    "skills": schemas.SkillRead,
}


def _svc(db, key: str) -> ContentService:  # noqa: ANN001
    return ContentService(db, REGISTRY[key])


for _key, _config in REGISTRY.items():
    _read = _READ_SCHEMAS[_key]

    def make_list(key: str = _key, read=_read):  # noqa: ANN202
        def endpoint(
            db: DbDep,
            _user=EDITOR_OR_ABOVE,  # type: ignore[assignment]
            page: Annotated[int, Query(ge=1)] = 1,
            page_size: Annotated[int, Query(ge=1, le=200)] = 50,
            status: Annotated[str | None, Query(pattern="^(draft|published|archived)$")] = None,
            q: Annotated[str | None, Query(max_length=100)] = None,
            sort: Annotated[str | None, Query(max_length=40)] = None,
            direction: Annotated[str, Query(pattern="^(asc|desc)$")] = "asc",
        ):  # noqa: ANN202
            items, total = _svc(db, key).admin_list(
                page=page, page_size=page_size, status=status, q=q, sort=sort, direction=direction
            )
            return Page[read].create(
                [read.model_validate(i) for i in items], total, page, page_size
            )  # type: ignore[valid-type]

        endpoint.__name__ = f"admin_list_{key.replace('-', '_')}"
        return endpoint

    def make_create(key: str = _key, read=_read, config=_config):  # noqa: ANN202
        def endpoint(db: DbDep, payload: config.create_schema, user=EDITOR_OR_ABOVE):  # noqa: ANN001, ANN202
            obj = _svc(db, key).create(payload, actor=user)
            return read.model_validate(obj)

        endpoint.__name__ = f"admin_create_{key.replace('-', '_')}"
        endpoint.__annotations__["payload"] = config.create_schema
        return endpoint

    def make_get(key: str = _key, read=_read):  # noqa: ANN202
        def endpoint(db: DbDep, entity_id: uuid.UUID, _user=EDITOR_OR_ABOVE):  # noqa: ANN202
            return read.model_validate(_svc(db, key).admin_get(entity_id))

        endpoint.__name__ = f"admin_get_{key.replace('-', '_')}"
        return endpoint

    def make_update(key: str = _key, read=_read, config=_config):  # noqa: ANN202
        def endpoint(
            db: DbDep, entity_id: uuid.UUID, payload: config.update_schema, user=EDITOR_OR_ABOVE
        ):  # noqa: ANN001, ANN202
            obj = _svc(db, key).update(entity_id, payload, actor=user)
            return read.model_validate(obj)

        endpoint.__name__ = f"admin_update_{key.replace('-', '_')}"
        endpoint.__annotations__["payload"] = config.update_schema
        return endpoint

    def make_delete(key: str = _key, config=_config):  # noqa: ANN202
        def endpoint(db: DbDep, entity_id: uuid.UUID, user=EDITOR_OR_ABOVE):  # noqa: ANN001, ANN202
            _svc(db, key).delete(entity_id, actor=user)
            return MessageResponse(message=f"{config.label} deleted")

        endpoint.__name__ = f"admin_delete_{key.replace('-', '_')}"
        return endpoint

    def make_status(
        key: str = _key, read=_read, action: str = "publish", new_status: str = "published"
    ):  # noqa: ANN202
        def endpoint(db: DbDep, entity_id: uuid.UUID, user=EDITOR_OR_ABOVE):  # noqa: ANN001, ANN202
            obj = _svc(db, key).set_status(entity_id, new_status, actor=user)
            return read.model_validate(obj)

        endpoint.__name__ = f"admin_{action}_{key.replace('-', '_')}"
        return endpoint

    def make_reorder(key: str = _key, config=_config):  # noqa: ANN202
        def endpoint(db: DbDep, payload: ReorderRequest, user=EDITOR_OR_ABOVE):  # noqa: ANN001, ANN202
            _svc(db, key).reorder(payload.ordered_ids, actor=user)
            return MessageResponse(message=f"{config.label} order updated")

        endpoint.__name__ = f"admin_reorder_{key.replace('-', '_')}"
        return endpoint

    router.add_api_route(
        f"/{_key}", make_list(), methods=["GET"], response_model=Page[_read], dependencies=[]
    )  # type: ignore[valid-type]
    router.add_api_route(
        f"/{_key}", make_create(), methods=["POST"], response_model=_read, status_code=201
    )
    router.add_api_route(
        f"/{_key}/reorder", make_reorder(), methods=["POST"], response_model=MessageResponse
    )
    router.add_api_route(
        f"/{_key}/{{entity_id}}", make_get(), methods=["GET"], response_model=_read
    )
    router.add_api_route(
        f"/{_key}/{{entity_id}}", make_update(), methods=["PATCH"], response_model=_read
    )
    router.add_api_route(
        f"/{_key}/{{entity_id}}", make_delete(), methods=["DELETE"], response_model=MessageResponse
    )
    if _config.publishable:
        router.add_api_route(
            f"/{_key}/{{entity_id}}/publish",
            make_status(action="publish", new_status="published"),
            methods=["POST"],
            response_model=_read,
        )
        router.add_api_route(
            f"/{_key}/{{entity_id}}/unpublish",
            make_status(action="unpublish", new_status="draft"),
            methods=["POST"],
            response_model=_read,
        )
        router.add_api_route(
            f"/{_key}/{{entity_id}}/archive",
            make_status(action="archive", new_status="archived"),
            methods=["POST"],
            response_model=_read,
        )
