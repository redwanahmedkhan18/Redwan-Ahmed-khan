"""Admin dashboard aggregates — real counts only, no decorative fake analytics."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import func, select

from app import models
from app.api.deps import EDITOR_OR_ABOVE, DbDep
from app.schemas import AuditLogRead, ContactMessageRead, HireRequestRead

router = APIRouter(tags=["admin-dashboard"])

_COUNTED = {
    "projects": models.Project,
    "research_papers": models.ResearchPaper,
    "ml_projects": models.MLProject,
    "experience": models.WorkExperience,
    "education": models.Education,
    "open_source": models.OpenSourceContribution,
    "achievements": models.Achievement,
    "testimonials": models.Testimonial,
    "blog_posts": models.BlogPost,
}


@router.get("/dashboard/summary", dependencies=[EDITOR_OR_ABOVE])
def summary(db: DbDep) -> dict:  # noqa: ANN202
    counts: dict[str, dict[str, int]] = {}
    for name, model in _COUNTED.items():
        rows = db.execute(
            select(model.status, func.count()).group_by(model.status)  # type: ignore[attr-defined]
        ).all()
        by_status = {status: n for status, n in rows}
        counts[name] = {
            "total": sum(by_status.values()),
            "published": by_status.get("published", 0),
            "draft": by_status.get("draft", 0),
            "archived": by_status.get("archived", 0),
        }
    # messages have a different lifecycle
    msg_rows = db.execute(
        select(models.ContactMessage.status, func.count()).group_by(models.ContactMessage.status)
    ).all()
    hire_rows = db.execute(
        select(models.HireRequest.status, func.count()).group_by(models.HireRequest.status)
    ).all()
    counts["contact_messages"] = {
        "total": sum(n for _, n in msg_rows),
        "new": dict(msg_rows).get("new", 0),
    }
    counts["hire_requests"] = {
        "total": sum(n for _, n in hire_rows),
        "new": dict(hire_rows).get("new", 0),
    }
    counts["media_assets"] = {
        "total": db.execute(select(func.count(models.MediaAsset.id))).scalar_one()
    }
    counts["cv_versions"] = {
        "total": db.execute(select(func.count(models.CVVersion.id))).scalar_one()
    }
    counts["skills"] = {
        "total": db.execute(select(func.count(models.Skill.id))).scalar_one(),
        "visible": db.execute(
            select(func.count(models.Skill.id)).where(models.Skill.is_visible.is_(True))
        ).scalar_one(),
    }
    return {"success": True, "counts": counts}


@router.get(
    "/dashboard/recent-messages",
    response_model=list[ContactMessageRead],
    dependencies=[EDITOR_OR_ABOVE],
)
def recent_messages(db: DbDep) -> list:  # noqa: ANN202
    rows = (
        db.execute(
            select(models.ContactMessage)
            .order_by(models.ContactMessage.created_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )
    return [ContactMessageRead.model_validate(r) for r in rows]


@router.get(
    "/dashboard/recent-hire-requests",
    response_model=list[HireRequestRead],
    dependencies=[EDITOR_OR_ABOVE],
)
def recent_hire_requests(db: DbDep) -> list:  # noqa: ANN202
    rows = (
        db.execute(
            select(models.HireRequest).order_by(models.HireRequest.created_at.desc()).limit(10)
        )
        .scalars()
        .all()
    )
    return [HireRequestRead.model_validate(r) for r in rows]


@router.get(
    "/dashboard/recent-audit", response_model=list[AuditLogRead], dependencies=[EDITOR_OR_ABOVE]
)
def recent_audit(db: DbDep) -> list:  # noqa: ANN202
    rows = (
        db.execute(select(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(20))
        .scalars()
        .all()
    )
    return [AuditLogRead.model_validate(r) for r in rows]
