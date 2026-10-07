"""Public API: read-only access to published content + contact/hire intake.

Everything is generated from the resource registry so the public surface stays
consistent: list (published, ordered), detail-by-slug where applicable.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import DbDep
from app.config import settings
from app.core.errors import NotFoundError
from app.middleware.rate_limit import check_rate_limit
from app.services.base import ContentService
from app.services.notification_service import send_notification
from app.services.registry import REGISTRY
from app.utils.pagination import Page
from app.utils.sanitize import sanitize_text

router = APIRouter()

# resource key → response schema for public endpoints
_PUBLIC_SCHEMAS: dict[str, type] = {
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
}

_SLUGGED = {"projects", "research", "blog", "ml-projects"}


def _service(db: Session, key: str) -> ContentService:
    return ContentService(db, REGISTRY[key])


#: resources without the draft/published lifecycle — filtered by visibility instead
_NON_PUBLISHABLE = {"social-links"}


# --- generic list endpoints -------------------------------------------------
for _key, _schema in _PUBLIC_SCHEMAS.items():

    def make_list_endpoint(key: str = _key, schema: type = _schema):  # noqa: ANN202
        def endpoint(
            db: DbDep,
            page: Annotated[int, Query(ge=1)] = 1,
            page_size: Annotated[int, Query(ge=1, le=100)] = 50,
        ):  # noqa: ANN202
            svc = _service(db, key)
            if key in _NON_PUBLISHABLE:
                extra = [models.SocialLink.is_visible.is_(True)] if key == "social-links" else []
                items, total = svc.repo.list(page=page, page_size=page_size, extra_filters=extra)
            else:
                items, total = svc.list_published(page=page, page_size=page_size)
            return Page[schema].create(
                [schema.model_validate(i) for i in items], total, page, page_size
            )  # type: ignore[valid-type]

        endpoint.__name__ = f"list_{key.replace('-', '_')}"
        return endpoint

    router.add_api_route(
        f"/{_key}",
        make_list_endpoint(),
        methods=["GET"],
        response_model=Page[_PUBLIC_SCHEMAS[_key]],  # type: ignore[valid-type]
        tags=["public"],
    )


# --- detail-by-slug endpoints -----------------------------------------------
for _key in sorted(_SLUGGED):

    def make_detail_endpoint(key: str = _key):  # noqa: ANN202
        schema = _PUBLIC_SCHEMAS[key]

        def endpoint(db: DbDep, slug: str):  # noqa: ANN202
            obj = _service(db, key).get_published_by_slug(slug)
            return schema.model_validate(obj)

        endpoint.__name__ = f"get_{key.replace('-', '_')}_by_slug"
        endpoint.__annotations__["slug"] = str
        return endpoint

    router.add_api_route(
        f"/{_key}/{{slug}}",
        make_detail_endpoint(),
        methods=["GET"],
        response_model=_PUBLIC_SCHEMAS[_key],
        tags=["public"],
    )


# --- profile & skills (special shapes) ---------------------------------------
@router.get("/profile", response_model=schemas.ProfileRead, tags=["public"])
def get_profile(db: DbDep) -> schemas.ProfileRead:  # noqa: ANN202
    profile = db.execute(select(models.Profile)).scalars().first()
    if profile is None:
        raise NotFoundError("Profile")
    return schemas.ProfileRead.model_validate(profile)


@router.get("/skills", response_model=list[schemas.SkillCategoryRead], tags=["public"])
def get_skills(db: DbDep) -> list:  # noqa: ANN202
    categories = (
        db.execute(select(models.SkillCategory).order_by(models.SkillCategory.display_order))
        .scalars()
        .all()
    )
    out = []
    for c in categories:
        data = schemas.SkillCategoryRead.model_validate(c)
        data.skills = [s for s in data.skills if _skill_visible(db, s.id)]
        out.append(data)
    return out


def _skill_visible(db: Session, skill_id) -> bool:  # noqa: ANN001
    skill = db.get(models.Skill, skill_id)
    return bool(skill and skill.is_visible)


# --- CV -----------------------------------------------------------------------
@router.get("/cv/current", response_model=schemas.CVVersionRead | None, tags=["public"])
def get_current_cv(db: DbDep):  # noqa: ANN202
    cv = (
        db.execute(
            select(models.CVVersion).where(
                models.CVVersion.is_current.is_(True), models.CVVersion.status == "published"
            )
        )
        .scalars()
        .first()
    )
    return schemas.CVVersionRead.model_validate(cv) if cv else None


@router.post("/cv/{cv_id}/download", response_model=schemas.MessageResponse, tags=["public"])
def register_cv_download(db: DbDep, cv_id: str) -> schemas.MessageResponse:  # noqa: ANN202
    """Privacy-conscious analytics: aggregate counter only, no personal data."""
    cv = db.get(models.CVVersion, cv_id)
    if cv is None:
        raise NotFoundError("CV")
    cv.download_count += 1
    db.commit()
    return schemas.MessageResponse(message="Download registered")


# --- site settings & SEO --------------------------------------------------------
@router.get("/site-settings", response_model=dict[str, object], tags=["public"])
def get_site_settings(db: DbDep) -> dict:  # noqa: ANN202
    rows = db.execute(select(models.SiteSetting)).scalars().all()
    return {r.key: r.value for r in rows}


@router.get("/seo", response_model=list[schemas.SeoMetadataRead], tags=["public"])
def get_seo_metadata(db: DbDep) -> list:  # noqa: ANN202
    rows = db.execute(select(models.SeoMetadata)).scalars().all()
    return [schemas.SeoMetadataRead.model_validate(r) for r in rows]


# --- contact / hire intake ------------------------------------------------------
@router.post("/contact", response_model=schemas.MessageResponse, status_code=201, tags=["public"])
def submit_contact(
    request: Request,
    db: DbDep,
    background: BackgroundTasks,
    payload: schemas.ContactMessageCreate,
) -> schemas.MessageResponse:  # noqa: ANN202
    check_rate_limit(request, "contact", settings.RATE_LIMIT_CONTACT_PER_HOUR, 3600)
    if payload.website:  # honeypot filled ⇒ bot
        return schemas.MessageResponse(message="Thanks for reaching out.")

    msg = models.ContactMessage(
        name=sanitize_text(payload.name, 120) or payload.name,
        email=payload.email,
        subject=sanitize_text(payload.subject, 255) or payload.subject,
        purpose=payload.purpose,
        message=sanitize_text(payload.message, 5000) or payload.message,
        ip_address=request.client.host if request.client else None,
        user_agent=(request.headers.get("user-agent") or "")[:255] or None,
    )
    db.add(msg)
    db.commit()
    background.add_task(
        send_notification,
        f"[Portfolio] Contact: {payload.purpose} — {msg.subject}",
        "A new contact message was submitted via the portfolio website. Sign in to the admin inbox to read it.",
    )
    return schemas.MessageResponse(message="Thanks for reaching out. I'll get back to you soon.")


@router.post(
    "/hire-requests", response_model=schemas.MessageResponse, status_code=201, tags=["public"]
)
def submit_hire_request(
    request: Request,
    db: DbDep,
    background: BackgroundTasks,
    payload: schemas.HireRequestCreate,
) -> schemas.MessageResponse:  # noqa: ANN202
    check_rate_limit(request, "hire", settings.RATE_LIMIT_CONTACT_PER_HOUR, 3600)
    if payload.website:
        return schemas.MessageResponse(message="Request received.")

    req = models.HireRequest(
        name=sanitize_text(payload.name, 120) or payload.name,
        email=payload.email,
        company=sanitize_text(payload.company, 255),
        project_type=sanitize_text(payload.project_type, 120) or payload.project_type,
        budget_range=sanitize_text(payload.budget_range, 120),
        timeline=sanitize_text(payload.timeline, 120),
        project_description=sanitize_text(payload.project_description, 10000)
        or payload.project_description,
        ip_address=request.client.host if request.client else None,
    )
    db.add(req)
    db.commit()
    background.add_task(
        send_notification,
        f"[Portfolio] Hire request: {req.project_type}",
        "A new hire request was submitted via the portfolio website. Sign in to the admin dashboard to review it.",
    )
    return schemas.MessageResponse(
        message="Request received. I'll review it and get back to you shortly."
    )


# --- sitemap data helper (consumed by frontend sitemap.ts) ----------------------
@router.get("/sitemap-data", tags=["public"])
def sitemap_data(db: DbDep) -> dict:  # noqa: ANN202
    def slugs(model, date_field="updated_at"):  # noqa: ANN001
        rows = db.execute(
            select(model.slug, getattr(model, date_field)).where(model.status == "published")
        ).all()
        return [
            {
                "slug": s,
                "lastmod": d.isoformat()
                if isinstance(d, datetime)
                else datetime.now(UTC).isoformat(),
            }
            for s, d in rows
        ]

    return {
        "projects": slugs(models.Project),
        "research": slugs(models.ResearchPaper),
        "blog": slugs(models.BlogPost),
        "ml_projects": slugs(models.MLProject),
    }
