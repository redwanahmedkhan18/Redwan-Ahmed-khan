"""Admin media library + CV management."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile
from sqlalchemy import select

from app import models, schemas
from app.api.deps import EDITOR_OR_ABOVE, SUPER_ADMIN, CurrentUser, DbDep
from app.core.errors import NotFoundError, ValidationError
from app.services.media_service import MediaService
from app.utils.pagination import Page

router = APIRouter(tags=["admin-media"])


@router.post(
    "/media/upload",
    response_model=schemas.MediaAssetRead,
    status_code=201,
    dependencies=[EDITOR_OR_ABOVE],
)
async def upload_media(
    db: DbDep,
    user: CurrentUser,
    file: Annotated[UploadFile, File()],
    kind: Annotated[str, Query(pattern="^(image|document|video)$")] = "image",
) -> schemas.MediaAssetRead:  # noqa: ANN202
    asset = await MediaService(db).store(file, kind=kind, actor_id=user.id)
    return schemas.MediaAssetRead.model_validate(asset)


@router.get("/media", response_model=Page[schemas.MediaAssetRead], dependencies=[EDITOR_OR_ABOVE])
def list_media(
    db: DbDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 24,
    kind: Annotated[str | None, Query(pattern="^(image|document|video)$")] = None,
):  # noqa: ANN202
    stmt = select(models.MediaAsset)
    count_stmt = select(models.MediaAsset.id)
    if kind:
        stmt = stmt.where(models.MediaAsset.kind == kind)
        count_stmt = count_stmt.where(models.MediaAsset.kind == kind)
    total = len(db.execute(count_stmt).all())
    rows = (
        db.execute(
            stmt.order_by(models.MediaAsset.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return Page[schemas.MediaAssetRead].create(
        [schemas.MediaAssetRead.model_validate(r) for r in rows], total, page, page_size
    )


@router.patch(
    "/media/{asset_id}", response_model=schemas.MediaAssetRead, dependencies=[EDITOR_OR_ABOVE]
)
def update_media_meta(db: DbDep, asset_id: uuid.UUID, payload: dict) -> schemas.MediaAssetRead:  # noqa: ANN202
    asset = db.get(models.MediaAsset, asset_id)
    if asset is None:
        raise NotFoundError("Media asset")
    alt = payload.get("alt_text")
    caption = payload.get("caption")
    if not isinstance(alt, (str, type(None))) or not isinstance(caption, (str, type(None))):
        raise ValidationError("alt_text and caption must be strings")
    asset = MediaService(db).update_meta(asset, alt_text=alt, caption=caption)
    return schemas.MediaAssetRead.model_validate(asset)


@router.delete(
    "/media/{asset_id}", response_model=schemas.MessageResponse, dependencies=[SUPER_ADMIN]
)
def delete_media(db: DbDep, asset_id: uuid.UUID) -> schemas.MessageResponse:  # noqa: ANN202
    asset = db.get(models.MediaAsset, asset_id)
    if asset is None:
        raise NotFoundError("Media asset")
    db.delete(asset)
    db.commit()
    return schemas.MessageResponse(message="Media asset deleted")


# --- CV versions ----------------------------------------------------------------
@router.get("/cv", response_model=list[schemas.CVVersionRead], dependencies=[EDITOR_OR_ABOVE])
def list_cvs(db: DbDep) -> list:  # noqa: ANN202
    rows = (
        db.execute(select(models.CVVersion).order_by(models.CVVersion.created_at.desc()))
        .scalars()
        .all()
    )
    return [schemas.CVVersionRead.model_validate(r) for r in rows]


@router.post(
    "/cv", response_model=schemas.CVVersionRead, status_code=201, dependencies=[EDITOR_OR_ABOVE]
)
def create_cv(db: DbDep, payload: schemas.CVVersionCreate) -> schemas.CVVersionRead:  # noqa: ANN202
    asset = db.get(models.MediaAsset, payload.asset_id)
    if asset is None:
        raise NotFoundError("Media asset")
    if asset.mime_type != "application/pdf":
        raise ValidationError("CV must be a PDF document", "INVALID_CV_TYPE")
    if payload.make_current:
        for cv in db.execute(
            select(models.CVVersion).where(models.CVVersion.is_current.is_(True))
        ).scalars():
            cv.is_current = False
            cv.status = "archived"
    cv = models.CVVersion(
        label=payload.label,
        asset_id=payload.asset_id,
        is_current=payload.make_current,
        status="published" if payload.make_current else "archived",
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return schemas.CVVersionRead.model_validate(cv)


@router.post(
    "/cv/{cv_id}/make-current", response_model=schemas.CVVersionRead, dependencies=[EDITOR_OR_ABOVE]
)
def make_cv_current(db: DbDep, cv_id: uuid.UUID) -> schemas.CVVersionRead:  # noqa: ANN202
    cv = db.get(models.CVVersion, cv_id)
    if cv is None:
        raise NotFoundError("CV version")
    for other in db.execute(
        select(models.CVVersion).where(models.CVVersion.is_current.is_(True))
    ).scalars():
        other.is_current = False
        other.status = "archived"
    cv.is_current = True
    cv.status = "published"
    db.commit()
    db.refresh(cv)
    return schemas.CVVersionRead.model_validate(cv)


@router.delete("/cv/{cv_id}", response_model=schemas.MessageResponse, dependencies=[SUPER_ADMIN])
def delete_cv(db: DbDep, cv_id: uuid.UUID) -> schemas.MessageResponse:  # noqa: ANN202
    cv = db.get(models.CVVersion, cv_id)
    if cv is None:
        raise NotFoundError("CV version")
    if cv.is_current:
        raise ValidationError(
            "Cannot delete the current CV. Promote another version first.", "CV_IS_CURRENT"
        )
    db.delete(cv)
    db.commit()
    return schemas.MessageResponse(message="CV version deleted")
