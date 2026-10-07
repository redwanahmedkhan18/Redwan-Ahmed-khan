"""Admin inbox: contact messages + hire requests, profile, site settings, SEO metadata, audit log."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app import models, schemas
from app.api.deps import EDITOR_OR_ABOVE, SUPER_ADMIN, DbDep
from app.core.errors import NotFoundError
from app.utils.pagination import Page

router = APIRouter(tags=["admin"])


# --- contact messages ---------------------------------------------------------
@router.get(
    "/messages", response_model=Page[schemas.ContactMessageRead], dependencies=[EDITOR_OR_ABOVE]
)
def list_messages(
    db: DbDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    status: Annotated[str | None, Query(pattern="^(new|read|archived)$")] = None,
):  # noqa: ANN202
    stmt = select(models.ContactMessage)
    if status:
        stmt = stmt.where(models.ContactMessage.status == status)
    total = len(db.execute(stmt.with_only_columns(models.ContactMessage.id)).all())
    rows = (
        db.execute(
            stmt.order_by(models.ContactMessage.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return Page[schemas.ContactMessageRead].create(
        [schemas.ContactMessageRead.model_validate(r) for r in rows], total, page, page_size
    )


@router.patch(
    "/messages/{message_id}/status",
    response_model=schemas.ContactMessageRead,
    dependencies=[EDITOR_OR_ABOVE],
)
def set_message_status(db: DbDep, message_id: uuid.UUID, status: str) -> schemas.ContactMessageRead:  # noqa: ANN202
    if status not in {"new", "read", "archived"}:
        raise NotFoundError("Status")
    msg = db.get(models.ContactMessage, message_id)
    if msg is None:
        raise NotFoundError("Message")
    msg.status = status
    db.commit()
    db.refresh(msg)
    return schemas.ContactMessageRead.model_validate(msg)


@router.delete(
    "/messages/{message_id}", response_model=schemas.MessageResponse, dependencies=[SUPER_ADMIN]
)
def delete_message(db: DbDep, message_id: uuid.UUID) -> schemas.MessageResponse:  # noqa: ANN202
    msg = db.get(models.ContactMessage, message_id)
    if msg is None:
        raise NotFoundError("Message")
    db.delete(msg)
    db.commit()
    return schemas.MessageResponse(message="Message deleted")


# --- hire requests -------------------------------------------------------------
@router.get(
    "/hire-requests", response_model=Page[schemas.HireRequestRead], dependencies=[EDITOR_OR_ABOVE]
)
def list_hire_requests(
    db: DbDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    status: Annotated[str | None, Query(pattern="^(new|read|archived)$")] = None,
):  # noqa: ANN202
    stmt = select(models.HireRequest)
    if status:
        stmt = stmt.where(models.HireRequest.status == status)
    total = len(db.execute(stmt.with_only_columns(models.HireRequest.id)).all())
    rows = (
        db.execute(
            stmt.order_by(models.HireRequest.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return Page[schemas.HireRequestRead].create(
        [schemas.HireRequestRead.model_validate(r) for r in rows], total, page, page_size
    )


@router.patch(
    "/hire-requests/{request_id}/status",
    response_model=schemas.HireRequestRead,
    dependencies=[EDITOR_OR_ABOVE],
)
def set_hire_status(db: DbDep, request_id: uuid.UUID, status: str) -> schemas.HireRequestRead:  # noqa: ANN202
    if status not in {"new", "read", "archived"}:
        raise NotFoundError("Status")
    req = db.get(models.HireRequest, request_id)
    if req is None:
        raise NotFoundError("Hire request")
    req.status = status
    db.commit()
    db.refresh(req)
    return schemas.HireRequestRead.model_validate(req)


# --- profile ---------------------------------------------------------------------
@router.get("/profile", response_model=schemas.ProfileRead, dependencies=[EDITOR_OR_ABOVE])
def get_profile(db: DbDep):  # noqa: ANN202
    profile = db.execute(select(models.Profile)).scalars().first()
    if profile is None:
        raise NotFoundError("Profile")
    return schemas.ProfileRead.model_validate(profile)


@router.patch("/profile", response_model=schemas.ProfileRead, dependencies=[EDITOR_OR_ABOVE])
def update_profile(db: DbDep, payload: schemas.ProfileUpdate):  # noqa: ANN202
    profile = db.execute(select(models.Profile)).scalars().first()
    if profile is None:
        raise NotFoundError("Profile")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return schemas.ProfileRead.model_validate(profile)


# --- site settings & SEO -------------------------------------------------------------
@router.get(
    "/settings", response_model=list[schemas.SiteSettingRead], dependencies=[EDITOR_OR_ABOVE]
)
def list_settings(db: DbDep) -> list:  # noqa: ANN202
    rows = db.execute(select(models.SiteSetting).order_by(models.SiteSetting.key)).scalars().all()
    return [schemas.SiteSettingRead.model_validate(r) for r in rows]


@router.put("/settings", response_model=schemas.SiteSettingRead, dependencies=[SUPER_ADMIN])
def upsert_setting(db: DbDep, payload: schemas.SiteSettingUpsert):  # noqa: ANN202
    row = (
        db.execute(select(models.SiteSetting).where(models.SiteSetting.key == payload.key))
        .scalars()
        .first()
    )
    if row is None:
        row = models.SiteSetting(
            key=payload.key, value=payload.value, description=payload.description
        )
        db.add(row)
    else:
        row.value = payload.value
        if payload.description is not None:
            row.description = payload.description
    db.commit()
    db.refresh(row)
    return schemas.SiteSettingRead.model_validate(row)


@router.get("/seo", response_model=list[schemas.SeoMetadataRead], dependencies=[EDITOR_OR_ABOVE])
def list_seo(db: DbDep) -> list:  # noqa: ANN202
    rows = db.execute(select(models.SeoMetadata).order_by(models.SeoMetadata.route)).scalars().all()
    return [schemas.SeoMetadataRead.model_validate(r) for r in rows]


@router.put("/seo", response_model=schemas.SeoMetadataRead, dependencies=[EDITOR_OR_ABOVE])
def upsert_seo(db: DbDep, payload: schemas.SeoMetadataUpsert):  # noqa: ANN202
    row = (
        db.execute(select(models.SeoMetadata).where(models.SeoMetadata.route == payload.route))
        .scalars()
        .first()
    )
    data = payload.model_dump(exclude={"route"})
    if row is None:
        row = models.SeoMetadata(route=payload.route, **data)
        db.add(row)
    else:
        for k, v in data.items():
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return schemas.SeoMetadataRead.model_validate(row)


# --- audit log ----------------------------------------------------------------------
@router.get("/audit-logs", response_model=Page[schemas.AuditLogRead], dependencies=[SUPER_ADMIN])
def list_audit(
    db: DbDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
):  # noqa: ANN202
    stmt = select(models.AuditLog)
    total = len(db.execute(stmt.with_only_columns(models.AuditLog.id)).all())
    rows = (
        db.execute(
            stmt.order_by(models.AuditLog.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return Page[schemas.AuditLogRead].create(
        [schemas.AuditLogRead.model_validate(r) for r in rows], total, page, page_size
    )
