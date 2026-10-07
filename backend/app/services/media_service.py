"""Media service: validated uploads, local-disk (or S3) storage, asset metadata."""

from __future__ import annotations

import mimetypes
import re
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.core.errors import ValidationError
from app.models import MediaAsset

_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


class MediaService:
    def __init__(self, db: Session):
        self.db = db
        self.root = Path(settings.STORAGE_LOCAL_DIR)
        self.root.mkdir(parents=True, exist_ok=True)

    def _validate(self, file: UploadFile, allowed: set[str]) -> str:
        mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
        if mime not in allowed:
            raise ValidationError(
                f"File type '{mime or 'unknown'}' is not allowed", "INVALID_FILE_TYPE"
            )
        if file.size is not None and file.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
            raise ValidationError(
                f"File exceeds {settings.MAX_UPLOAD_MB} MB limit", "FILE_TOO_LARGE"
            )
        return mime

    async def store(
        self, file: UploadFile, *, kind: str = "image", actor_id: uuid.UUID | None = None
    ) -> MediaAsset:
        allowed = (
            settings.ALLOWED_IMAGE_TYPES
            if kind == "image"
            else (settings.ALLOWED_IMAGE_TYPES | settings.ALLOWED_DOC_TYPES)
        )
        mime = self._validate(file, allowed)

        original = file.filename or "upload"
        ext = Path(original).suffix.lower()[:10]
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = self.root / stored_name

        # Stream to disk while enforcing the size cap (client may lie about file.size)
        max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
        size = 0
        with dest.open("wb") as out:
            while chunk := await file.read(1024 * 256):
                size += len(chunk)
                if size > max_bytes:
                    out.close()
                    dest.unlink(missing_ok=True)
                    raise ValidationError(
                        f"File exceeds {settings.MAX_UPLOAD_MB} MB limit", "FILE_TOO_LARGE"
                    )
                out.write(chunk)

        asset = MediaAsset(
            filename=stored_name,
            original_filename=_SAFE_NAME.sub("_", original)[:255],
            mime_type=mime,
            size_bytes=size,
            storage_url=f"/media/{stored_name}",
            kind=kind,
            uploaded_by_id=actor_id,
        )
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        return asset

    def update_meta(
        self, asset: MediaAsset, *, alt_text: str | None = None, caption: str | None = None
    ) -> MediaAsset:
        if alt_text is not None:
            asset.alt_text = alt_text
        if caption is not None:
            asset.caption = caption
        self.db.commit()
        self.db.refresh(asset)
        return asset
