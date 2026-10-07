"""SQLAlchemy 2.x models for the portfolio CMS.

Conventions:
- UUID primary keys (portable GUID type: native on PostgreSQL, CHAR(36) on SQLite)
- Every content entity: created_at/updated_at (+ published_at/status/display_order via PublishableMixin)
- Normalized child tables for technologies/links/images/authors
- JSON columns only for simple homogeneous string lists (features, responsibilities, tags...)
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import (
    Base,
    DatedMixin,
    PublishableMixin,
    SluggedMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    utcnow,
)
from app.db.types import GUID

# --------------------------------------------------------------------------- #
# Auth & RBAC
# --------------------------------------------------------------------------- #


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"
    name: Mapped[str] = mapped_column(
        String(32), unique=True, nullable=False
    )  # SUPER_ADMIN | EDITOR
    description: Mapped[str | None] = mapped_column(String(255))
    permissions: Mapped[list[str]] = mapped_column(JSON, default=list)
    users: Mapped[list[User]] = relationship(back_populates="role")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    role: Mapped[Role] = relationship(back_populates="users", lazy="joined")


class RefreshToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "refresh_tokens"
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replaced_by_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), nullable=True
    )  # rotation chain / reuse detection
    user_agent: Mapped[str | None] = mapped_column(String(255))


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # create|update|delete|publish|unpublish|archive|login|logout|reorder
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64))
    detail: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(64))


# --------------------------------------------------------------------------- #
# Profile & social
# --------------------------------------------------------------------------- #


class Profile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "profile"
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Redwan Ahmed Khan")
    headline: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Artificial Intelligence Engineer | Software Engineer | Researcher",
    )
    tagline: Mapped[str | None] = mapped_column(Text)
    about_short: Mapped[str | None] = mapped_column(Text)
    about_long: Mapped[str | None] = mapped_column(Text)  # markdown
    location: Mapped[str | None] = mapped_column(String(255))
    email_public: Mapped[str | None] = mapped_column(
        String(255)
    )  # intentionally optional — do not expose private email
    photo_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    cv_note: Mapped[str | None] = mapped_column(Text)
    engineering_interests: Mapped[list[str]] = mapped_column(JSON, default=list)
    research_interests: Mapped[list[str]] = mapped_column(JSON, default=list)
    technical_philosophy: Mapped[str | None] = mapped_column(Text)
    open_to_work: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    photo: Mapped[MediaAsset | None] = relationship(lazy="joined")


class SocialLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "social_links"
    platform: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False
    )  # linkedin|github|x|kaggle|medium|google_scholar|...
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    label: Mapped[str | None] = mapped_column(String(120))
    icon: Mapped[str | None] = mapped_column(String(64))
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


# --------------------------------------------------------------------------- #
# Skills
# --------------------------------------------------------------------------- #


class SkillCategory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "skill_categories"
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    skills: Mapped[list[Skill]] = relationship(
        back_populates="category", cascade="all, delete-orphan", order_by="Skill.display_order"
    )


class Skill(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "skills"
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("skill_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    icon: Mapped[str | None] = mapped_column(String(64))
    official_url: Mapped[str | None] = mapped_column(String(500))
    # No arbitrary percentage bars: only explicit, meaningful labels.
    proficiency_label: Mapped[str | None] = mapped_column(String(64))
    years_experience: Mapped[float | None] = mapped_column(Float)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category: Mapped[SkillCategory] = relationship(back_populates="skills")
    __table_args__ = (UniqueConstraint("name", "category_id", name="uq_skill_name_category"),)


# --------------------------------------------------------------------------- #
# Education & experience
# --------------------------------------------------------------------------- #


class Education(PublishableMixin, DatedMixin, Base):
    __tablename__ = "education"
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution_short_name: Mapped[str | None] = mapped_column(String(64))
    institution_logo_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    department: Mapped[str | None] = mapped_column(String(255))
    degree: Mapped[str] = mapped_column(String(255), nullable=False)
    field_of_study: Mapped[str | None] = mapped_column(String(255))
    cgpa: Mapped[float | None] = mapped_column(Float)
    cgpa_scale: Mapped[float | None] = mapped_column(Float)
    graduation_date: Mapped[date | None] = mapped_column(Date)
    enrollment_status: Mapped[str] = mapped_column(
        String(32), default="Completed", nullable=False
    )  # Currently Studying | Completed
    description: Mapped[str | None] = mapped_column(Text)
    achievements: Mapped[list[str]] = mapped_column(JSON, default=list)
    relevant_coursework: Mapped[list[str]] = mapped_column(JSON, default=list)
    institution_website: Mapped[str | None] = mapped_column(String(500))
    certificate_url: Mapped[str | None] = mapped_column(String(500))
    __table_args__ = (
        CheckConstraint(
            "(enrollment_status = 'Currently Studying' AND end_date IS NULL) OR (enrollment_status = 'Completed')",
            name="enrollment_end_date_rule",
        ),
        CheckConstraint(
            "enrollment_status IN ('Currently Studying','Completed')",
            name="enrollment_status_valid",
        ),
    )


class WorkExperience(PublishableMixin, DatedMixin, Base):
    __tablename__ = "work_experience"
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    company_logo_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    company_url: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    employment_type: Mapped[str | None] = mapped_column(
        String(64)
    )  # Full-time | Internship | Contract
    work_mode: Mapped[str | None] = mapped_column(String(32))  # Remote | Hybrid | On-site
    location: Mapped[str | None] = mapped_column(String(255))
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    responsibilities: Mapped[list[str]] = mapped_column(JSON, default=list)
    achievements_public_safe: Mapped[list[str]] = mapped_column(
        JSON, default=list
    )  # explicitly entered, never fabricated
    highlights_markdown: Mapped[str | None] = mapped_column(Text)  # detailed case-study style notes
    technologies: Mapped[list[str]] = mapped_column(JSON, default=list)
    __table_args__ = (
        CheckConstraint(
            "(is_current = 1 AND end_date IS NULL) OR (is_current = 0)", name="current_no_end_date"
        ),
        Index("ix_experience_order", "status", "display_order"),
    )


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #


class ProjectTechnology(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "project_technologies"
    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    __table_args__ = (UniqueConstraint("project_id", "name", name="uq_project_tech"),)


class ProjectLink(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "project_links"
    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # github|live_demo|documentation|case_study|video
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    label: Mapped[str | None] = mapped_column(String(120))
    __table_args__ = (UniqueConstraint("project_id", "kind", name="uq_project_link_kind"),)


class ProjectImage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "project_images"
    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    url: Mapped[str | None] = mapped_column(String(500))
    alt_text: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(
        String(32), default="screenshot"
    )  # screenshot|architecture_diagram|cover
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Project(PublishableMixin, SluggedMixin, DatedMixin, Base):
    __tablename__ = "projects"
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(
        String(64)
    )  # AI Platform | Web App | Research Tool ...
    short_description: Mapped[str | None] = mapped_column(Text)
    long_description: Mapped[str | None] = mapped_column(Text)  # markdown case study
    problem: Mapped[str | None] = mapped_column(Text)
    solution: Mapped[str | None] = mapped_column(Text)
    role: Mapped[str | None] = mapped_column(String(200))
    project_status: Mapped[str | None] = mapped_column(
        String(64)
    )  # Production | Prototype | In Development ...
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    cover_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    video_demo_url: Mapped[str | None] = mapped_column(String(500))
    key_features: Mapped[list[str]] = mapped_column(JSON, default=list)
    technical_challenges: Mapped[list[str]] = mapped_column(JSON, default=list)
    technical_decisions: Mapped[list[str]] = mapped_column(JSON, default=list)
    results: Mapped[str | None] = mapped_column(
        Text
    )  # qualitative unless metrics explicitly entered
    metrics_note: Mapped[str | None] = mapped_column(String(255), default="Not publicly disclosed.")
    lessons_learned: Mapped[list[str]] = mapped_column(JSON, default=list)
    future_improvements: Mapped[list[str]] = mapped_column(JSON, default=list)
    technologies: Mapped[list[ProjectTechnology]] = relationship(
        cascade="all, delete-orphan", order_by="ProjectTechnology.display_order", lazy="selectin"
    )
    links: Mapped[list[ProjectLink]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    images: Mapped[list[ProjectImage]] = relationship(
        cascade="all, delete-orphan", order_by="ProjectImage.display_order", lazy="selectin"
    )


class MLProject(PublishableMixin, SluggedMixin, Base):
    __tablename__ = "ml_projects"
    project_name: Mapped[str] = mapped_column(String(200), nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text)
    dataset: Mapped[str | None] = mapped_column(String(500))
    problem_type: Mapped[str | None] = mapped_column(
        String(120)
    )  # Classification | Regression | NLP ...
    algorithm: Mapped[str | None] = mapped_column(String(255))
    technologies: Mapped[list[str]] = mapped_column(JSON, default=list)
    github_url: Mapped[str | None] = mapped_column(String(500))
    kaggle_notebook_url: Mapped[str | None] = mapped_column(String(500))
    live_demo_url: Mapped[str | None] = mapped_column(String(500))
    publication_url: Mapped[str | None] = mapped_column(String(500))
    results: Mapped[str | None] = mapped_column(Text)
    metrics: Mapped[dict | None] = mapped_column(
        JSON
    )  # only when explicitly entered, e.g. {"accuracy": "0.94"}


# --------------------------------------------------------------------------- #
# Research
# --------------------------------------------------------------------------- #


class ResearchAuthor(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "research_authors"
    paper_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("research_papers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "Khan, R.A."
    is_self: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ResearchLink(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "research_links"
    paper_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("research_papers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # doi|paper|publication|github|dataset|code
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    __table_args__ = (UniqueConstraint("paper_id", "kind", name="uq_research_link_kind"),)


class ResearchPaper(PublishableMixin, SluggedMixin, Base):
    __tablename__ = "research_papers"
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text)
    abstract: Mapped[str | None] = mapped_column(Text)
    research_area: Mapped[list[str]] = mapped_column(JSON, default=list)
    research_status: Mapped[str] = mapped_column(
        String(32), default="Working", nullable=False
    )  # Working|Under Review|Published|Preprint
    publisher: Mapped[str | None] = mapped_column(String(255))
    venue: Mapped[str | None] = mapped_column(String(255))
    publication_year: Mapped[int | None] = mapped_column(Integer)
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    authors: Mapped[list[ResearchAuthor]] = relationship(
        cascade="all, delete-orphan", order_by="ResearchAuthor.display_order", lazy="selectin"
    )
    links: Mapped[list[ResearchLink]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    __table_args__ = (
        CheckConstraint(
            "research_status IN ('Working','Under Review','Published','Preprint')",
            name="research_status_valid",
        ),
    )


class OpenSourceContribution(PublishableMixin, Base):
    __tablename__ = "open_source_contributions"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    organization: Mapped[str | None] = mapped_column(String(255))
    contribution_type: Mapped[str | None] = mapped_column(
        String(64)
    )  # PR | Maintainer | Plugin | Docs ...
    website_url: Mapped[str | None] = mapped_column(String(500))
    github_url: Mapped[str | None] = mapped_column(String(500))
    publication_url: Mapped[str | None] = mapped_column(String(500))
    contribution_date: Mapped[date | None] = mapped_column(Date)
    technologies: Mapped[list[str]] = mapped_column(JSON, default=list)


class Achievement(PublishableMixin, Base):
    __tablename__ = "achievements"
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[str] = mapped_column(
        String(32), default="competition"
    )  # competition | award | certification-milestone
    organization: Mapped[str | None] = mapped_column(String(255))
    year: Mapped[int | None] = mapped_column(Integer)
    rank: Mapped[str | None] = mapped_column(String(120))  # "2nd Runner-up", "6th Place"
    project_context: Mapped[str | None] = mapped_column(
        String(255)
    )  # e.g. Autonomous Driving System
    description: Mapped[str | None] = mapped_column(Text)
    event_url: Mapped[str | None] = mapped_column(String(500))
    certificate_url: Mapped[str | None] = mapped_column(String(500))
    image_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )


class Certification(PublishableMixin, Base):
    __tablename__ = "certifications"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(255))
    issued_at: Mapped[date | None] = mapped_column(Date)
    expires_at: Mapped[date | None] = mapped_column(Date)
    credential_url: Mapped[str | None] = mapped_column(String(500))
    credential_id: Mapped[str | None] = mapped_column(String(120))


# --------------------------------------------------------------------------- #
# Testimonials & blog
# --------------------------------------------------------------------------- #


class Testimonial(PublishableMixin, Base):
    __tablename__ = "testimonials"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str | None] = mapped_column(String(255))
    company: Mapped[str | None] = mapped_column(String(255))
    avatar_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    review: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer)  # optional 1..5
    website: Mapped[str | None] = mapped_column(String(500))
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_placeholder: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # demo content must be labeled
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    __table_args__ = (
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="rating_range"),
    )


class BlogPost(PublishableMixin, SluggedMixin, Base):
    __tablename__ = "blog_posts"
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text)
    content_markdown: Mapped[str | None] = mapped_column(Text)
    cover_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    author_name: Mapped[str] = mapped_column(String(255), default="Redwan Ahmed Khan")
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    category: Mapped[str | None] = mapped_column(
        String(64)
    )  # AI|ML|NLP|LLM|RAG|Software Engineering|Python|Backend|Research|MLOps
    reading_time_minutes: Mapped[int | None] = mapped_column(Integer)
    github_url: Mapped[str | None] = mapped_column(String(500))
    references: Mapped[list[str]] = mapped_column(JSON, default=list)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    seo_title: Mapped[str | None] = mapped_column(String(200))
    seo_description: Mapped[str | None] = mapped_column(String(300))
    canonical_url: Mapped[str | None] = mapped_column(String(500))


# --------------------------------------------------------------------------- #
# Contact / hire
# --------------------------------------------------------------------------- #


class ContactMessage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "contact_messages"
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default="new", nullable=False, index=True
    )  # new|read|archived
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(255))
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class HireRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "hire_requests"
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255))
    project_type: Mapped[str] = mapped_column(String(120), nullable=False)
    budget_range: Mapped[str | None] = mapped_column(String(120))
    timeline: Mapped[str | None] = mapped_column(String(120))
    project_description: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String(16), default="new", nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64))


# --------------------------------------------------------------------------- #
# Site settings / SEO / media / CV
# --------------------------------------------------------------------------- #


class SiteSetting(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "site_settings"
    key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    value: Mapped[dict | list | str | int | float | bool | None] = mapped_column(JSON)
    description: Mapped[str | None] = mapped_column(String(255))


class SeoMetadata(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "seo_metadata"
    route: Mapped[str] = mapped_column(
        String(300), unique=True, nullable=False
    )  # "/" | "/about" | "/projects/{slug}"
    title: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(String(320))
    og_image_url: Mapped[str | None] = mapped_column(String(500))
    canonical_url: Mapped[str | None] = mapped_column(String(500))
    noindex: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class MediaAsset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "media_assets"
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(String(255))
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), default="image")  # image|document|video
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL")
    )


class CVVersion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cv_versions"
    label: Mapped[str] = mapped_column(String(255), nullable=False)  # "CV 2026 — English"
    asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("media_assets.id", ondelete="RESTRICT"), nullable=False
    )
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default="archived", nullable=False
    )  # published|archived
    download_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )  # privacy-conscious aggregate only
    asset: Mapped[MediaAsset] = relationship(lazy="joined")
    __table_args__ = (Index("ix_cv_current", "is_current"),)


__all__ = [
    "Achievement",
    "AuditLog",
    "BlogPost",
    "CVVersion",
    "Certification",
    "ContactMessage",
    "Education",
    "HireRequest",
    "MLProject",
    "MediaAsset",
    "OpenSourceContribution",
    "Profile",
    "Project",
    "ProjectImage",
    "ProjectLink",
    "ProjectTechnology",
    "RefreshToken",
    "ResearchAuthor",
    "ResearchLink",
    "ResearchPaper",
    "Role",
    "SeoMetadata",
    "SiteSetting",
    "Skill",
    "SkillCategory",
    "SocialLink",
    "Testimonial",
    "User",
    "WorkExperience",
]
