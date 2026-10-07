"""Pydantic v2 schemas — API contracts for every resource.

Pattern per entity: `*Read` (response), `*Create` (POST), `*Update` (PATCH, all optional).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

ContentStatus = Literal["draft", "published", "archived"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(ORMModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str = ""
    is_active: bool
    last_login_at: datetime | None = None

    @field_validator("role", mode="before")
    @classmethod
    def _role_name(cls, v: Any) -> str:
        return getattr(v, "name", v or "")


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead


# --------------------------------------------------------------------------- #
# Profile / social
# --------------------------------------------------------------------------- #


class MediaAssetRead(ORMModel):
    id: uuid.UUID
    filename: str
    original_filename: str | None = None
    mime_type: str
    size_bytes: int
    width: int | None = None
    height: int | None = None
    alt_text: str | None = None
    caption: str | None = None
    storage_url: str
    kind: str = "image"
    created_at: datetime


class ProfileRead(ORMModel):
    id: uuid.UUID
    full_name: str
    headline: str
    tagline: str | None = None
    about_short: str | None = None
    about_long: str | None = None
    location: str | None = None
    email_public: str | None = None
    photo: MediaAssetRead | None = None
    engineering_interests: list[str] = []
    research_interests: list[str] = []
    technical_philosophy: str | None = None
    open_to_work: bool = False
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    tagline: str | None = None
    about_short: str | None = None
    about_long: str | None = None
    location: str | None = None
    email_public: str | None = None
    photo_asset_id: uuid.UUID | None = None
    engineering_interests: list[str] | None = None
    research_interests: list[str] | None = None
    technical_philosophy: str | None = None
    open_to_work: bool | None = None


class SocialLinkRead(ORMModel):
    id: uuid.UUID
    platform: str
    url: str
    label: str | None = None
    icon: str | None = None
    is_visible: bool = True
    display_order: int = 0


class SocialLinkCreate(BaseModel):
    platform: str = Field(max_length=64)
    url: str = Field(max_length=500)
    label: str | None = None
    icon: str | None = None
    is_visible: bool = True
    display_order: int = 0


class SocialLinkUpdate(SocialLinkCreate):
    platform: str | None = None  # type: ignore[assignment]
    url: str | None = None  # type: ignore[assignment]
    is_visible: bool | None = None
    display_order: int | None = None


# --------------------------------------------------------------------------- #
# Generic publishable fields
# --------------------------------------------------------------------------- #


class PublishableFields(BaseModel):
    status: ContentStatus | None = None
    display_order: int | None = None


# --------------------------------------------------------------------------- #
# Education / Experience
# --------------------------------------------------------------------------- #


class EducationRead(ORMModel):
    id: uuid.UUID
    institution_name: str
    institution_short_name: str | None = None
    department: str | None = None
    degree: str
    field_of_study: str | None = None
    cgpa: float | None = None
    cgpa_scale: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    graduation_date: date | None = None
    enrollment_status: str = "Completed"
    description: str | None = None
    achievements: list[str] = []
    relevant_coursework: list[str] = []
    institution_website: str | None = None
    certificate_url: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class EducationCreate(BaseModel):
    institution_name: str = Field(max_length=255)
    institution_short_name: str | None = None
    department: str | None = None
    degree: str = Field(max_length=255)
    field_of_study: str | None = None
    cgpa: float | None = Field(default=None, ge=0, le=10)
    cgpa_scale: float | None = Field(default=None, ge=1, le=10)
    start_date: date | None = None
    end_date: date | None = None
    graduation_date: date | None = None
    enrollment_status: Literal["Currently Studying", "Completed"] = "Completed"
    description: str | None = None
    achievements: list[str] = []
    relevant_coursework: list[str] = []
    institution_website: str | None = None
    certificate_url: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0

    @model_validator(mode="after")
    def _no_end_when_studying(self):  # noqa: ANN201
        if self.enrollment_status == "Currently Studying" and self.end_date is not None:
            raise ValueError("end_date must be NULL while Currently Studying")
        if (
            self.enrollment_status == "Completed"
            and self.end_date is not None
            and self.graduation_date is None
        ):
            raise ValueError("graduation_date is required when Completed with an end_date")
        return self


class EducationUpdate(EducationCreate):
    institution_name: str | None = None  # type: ignore[assignment]
    degree: str | None = None  # type: ignore[assignment]
    enrollment_status: Literal["Currently Studying", "Completed"] | None = None


class ExperienceRead(ORMModel):
    id: uuid.UUID
    company: str
    company_url: str | None = None
    role: str
    employment_type: str | None = None
    work_mode: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    summary: str | None = None
    responsibilities: list[str] = []
    achievements_public_safe: list[str] = []
    highlights_markdown: str | None = None
    technologies: list[str] = []
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ExperienceCreate(BaseModel):
    company: str = Field(max_length=255)
    company_url: str | None = None
    role: str = Field(max_length=255)
    employment_type: str | None = None
    work_mode: Literal["Remote", "Hybrid", "On-site"] | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    summary: str | None = None
    responsibilities: list[str] = []
    achievements_public_safe: list[str] = []
    highlights_markdown: str | None = None
    technologies: list[str] = []
    status: ContentStatus = "draft"
    display_order: int = 0

    @model_validator(mode="after")
    def _current_has_no_end(self):  # noqa: ANN201
        if self.is_current and self.end_date is not None:
            raise ValueError("end_date must be NULL when currently working")
        return self


class ExperienceUpdate(ExperienceCreate):
    company: str | None = None  # type: ignore[assignment]
    role: str | None = None  # type: ignore[assignment]
    is_current: bool | None = None


# --------------------------------------------------------------------------- #
# Skills
# --------------------------------------------------------------------------- #


class SkillRead(ORMModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    official_url: str | None = None
    proficiency_label: str | None = None
    years_experience: float | None = None
    display_order: int = 0
    is_visible: bool = True


class SkillCategoryRead(ORMModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    display_order: int = 0
    skills: list[SkillRead] = []


class SkillCreate(BaseModel):
    name: str = Field(max_length=120)
    category_id: uuid.UUID
    icon: str | None = None
    official_url: str | None = None
    proficiency_label: str | None = Field(default=None, max_length=64)
    years_experience: float | None = Field(default=None, ge=0, le=60)
    display_order: int = 0
    is_visible: bool = True


class SkillUpdate(SkillCreate):
    name: str | None = None  # type: ignore[assignment]
    category_id: uuid.UUID | None = None


class SkillCategoryCreate(BaseModel):
    name: str = Field(max_length=120)
    slug: str | None = None
    description: str | None = None
    display_order: int = 0


class SkillCategoryUpdate(SkillCategoryCreate):
    name: str | None = None  # type: ignore[assignment]


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #


class ProjectTechnologyIn(BaseModel):
    name: str = Field(max_length=120)
    display_order: int = 0


class ProjectTechnologyRead(ORMModel, ProjectTechnologyIn):
    id: uuid.UUID


class ProjectLinkIn(BaseModel):
    kind: Literal["github", "live_demo", "documentation", "case_study", "video"]
    url: str = Field(max_length=500)
    label: str | None = None


class ProjectLinkRead(ORMModel):
    id: uuid.UUID
    kind: str
    url: str
    label: str | None = None


class ProjectImageIn(BaseModel):
    asset_id: uuid.UUID | None = None
    url: str | None = None
    alt_text: str | None = None
    caption: str | None = None
    kind: Literal["screenshot", "architecture_diagram", "cover"] = "screenshot"
    display_order: int = 0


class ProjectImageRead(ORMModel):
    id: uuid.UUID
    asset_id: uuid.UUID | None = None
    url: str | None = None
    alt_text: str | None = None
    caption: str | None = None
    kind: str = "screenshot"
    display_order: int = 0
    asset: MediaAssetRead | None = None


class ProjectRead(ORMModel):
    id: uuid.UUID
    name: str
    slug: str
    category: str | None = None
    short_description: str | None = None
    long_description: str | None = None
    problem: str | None = None
    solution: str | None = None
    role: str | None = None
    project_status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    featured: bool = False
    video_demo_url: str | None = None
    key_features: list[str] = []
    technical_challenges: list[str] = []
    technical_decisions: list[str] = []
    results: str | None = None
    metrics_note: str | None = "Not publicly disclosed."
    lessons_learned: list[str] = []
    future_improvements: list[str] = []
    technologies: list[ProjectTechnologyRead] = []
    links: list[ProjectLinkRead] = []
    images: list[ProjectImageRead] = []
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    name: str = Field(max_length=200)
    slug: str | None = Field(default=None, max_length=200)
    category: str | None = None
    short_description: str | None = None
    long_description: str | None = None
    problem: str | None = None
    solution: str | None = None
    role: str | None = None
    project_status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    featured: bool = False
    cover_asset_id: uuid.UUID | None = None
    video_demo_url: str | None = None
    key_features: list[str] = []
    technical_challenges: list[str] = []
    technical_decisions: list[str] = []
    results: str | None = None
    metrics_note: str | None = "Not publicly disclosed."
    lessons_learned: list[str] = []
    future_improvements: list[str] = []
    technologies: list[ProjectTechnologyIn] = []
    links: list[ProjectLinkIn] = []
    images: list[ProjectImageIn] = []
    status: ContentStatus = "draft"
    display_order: int = 0


class ProjectUpdate(ProjectCreate):
    name: str | None = None  # type: ignore[assignment]


class MLProjectRead(ORMModel):
    id: uuid.UUID
    project_name: str
    slug: str
    short_description: str | None = None
    dataset: str | None = None
    problem_type: str | None = None
    algorithm: str | None = None
    technologies: list[str] = []
    github_url: str | None = None
    kaggle_notebook_url: str | None = None
    live_demo_url: str | None = None
    publication_url: str | None = None
    results: str | None = None
    metrics: dict | None = None
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MLProjectCreate(BaseModel):
    project_name: str = Field(max_length=200)
    slug: str | None = None
    short_description: str | None = None
    dataset: str | None = None
    problem_type: str | None = None
    algorithm: str | None = None
    technologies: list[str] = []
    github_url: str | None = None
    kaggle_notebook_url: str | None = None
    live_demo_url: str | None = None
    publication_url: str | None = None
    results: str | None = None
    metrics: dict | None = None
    status: ContentStatus = "draft"
    display_order: int = 0


class MLProjectUpdate(MLProjectCreate):
    project_name: str | None = None  # type: ignore[assignment]


# --------------------------------------------------------------------------- #
# Research
# --------------------------------------------------------------------------- #


class ResearchAuthorIn(BaseModel):
    name: str = Field(max_length=255)
    is_self: bool = False
    display_order: int = 0


class ResearchAuthorRead(ORMModel, ResearchAuthorIn):
    id: uuid.UUID


class ResearchLinkIn(BaseModel):
    kind: Literal["doi", "paper", "publication", "github", "dataset", "code"]
    url: str = Field(max_length=500)


class ResearchLinkRead(ORMModel):
    id: uuid.UUID
    kind: str
    url: str


class ResearchPaperRead(ORMModel):
    id: uuid.UUID
    title: str
    slug: str
    short_description: str | None = None
    abstract: str | None = None
    research_area: list[str] = []
    research_status: Literal["Working", "Under Review", "Published", "Preprint"] = "Working"
    publisher: str | None = None
    venue: str | None = None
    publication_year: int | None = None
    keywords: list[str] = []
    featured: bool = False
    authors: list[ResearchAuthorRead] = []
    links: list[ResearchLinkRead] = []
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ResearchPaperCreate(BaseModel):
    title: str = Field(max_length=500)
    slug: str | None = None
    short_description: str | None = None
    abstract: str | None = None
    research_area: list[str] = []
    research_status: Literal["Working", "Under Review", "Published", "Preprint"] = "Working"
    publisher: str | None = None
    venue: str | None = None
    publication_year: int | None = Field(default=None, ge=1900, le=2200)
    keywords: list[str] = []
    featured: bool = False
    authors: list[ResearchAuthorIn] = []
    links: list[ResearchLinkIn] = []
    status: ContentStatus = "draft"
    display_order: int = 0


class ResearchPaperUpdate(ResearchPaperCreate):
    title: str | None = None  # type: ignore[assignment]


# --------------------------------------------------------------------------- #
# Open source / achievements / certifications
# --------------------------------------------------------------------------- #


class OpenSourceRead(ORMModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    organization: str | None = None
    contribution_type: str | None = None
    website_url: str | None = None
    github_url: str | None = None
    publication_url: str | None = None
    contribution_date: date | None = None
    technologies: list[str] = []
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None


class OpenSourceCreate(BaseModel):
    name: str = Field(max_length=255)
    description: str | None = None
    organization: str | None = None
    contribution_type: str | None = None
    website_url: str | None = None
    github_url: str | None = None
    publication_url: str | None = None
    contribution_date: date | None = None
    technologies: list[str] = []
    status: ContentStatus = "draft"
    display_order: int = 0


class OpenSourceUpdate(OpenSourceCreate):
    name: str | None = None  # type: ignore[assignment]


class AchievementRead(ORMModel):
    id: uuid.UUID
    title: str
    kind: str = "competition"
    organization: str | None = None
    year: int | None = None
    rank: str | None = None
    project_context: str | None = None
    description: str | None = None
    event_url: str | None = None
    certificate_url: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0


class AchievementCreate(BaseModel):
    title: str = Field(max_length=255)
    kind: Literal["competition", "award", "certification-milestone"] = "competition"
    organization: str | None = None
    year: int | None = Field(default=None, ge=1950, le=2200)
    rank: str | None = None
    project_context: str | None = None
    description: str | None = None
    event_url: str | None = None
    certificate_url: str | None = None
    image_asset_id: uuid.UUID | None = None
    status: ContentStatus = "draft"
    display_order: int = 0


class AchievementUpdate(AchievementCreate):
    title: str | None = None  # type: ignore[assignment]


class CertificationRead(ORMModel):
    id: uuid.UUID
    name: str
    issuer: str | None = None
    issued_at: date | None = None
    expires_at: date | None = None
    credential_url: str | None = None
    credential_id: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0


class CertificationCreate(BaseModel):
    name: str = Field(max_length=255)
    issuer: str | None = None
    issued_at: date | None = None
    expires_at: date | None = None
    credential_url: str | None = None
    credential_id: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0


class CertificationUpdate(CertificationCreate):
    name: str | None = None  # type: ignore[assignment]


# --------------------------------------------------------------------------- #
# Testimonials / blog
# --------------------------------------------------------------------------- #


class TestimonialRead(ORMModel):
    id: uuid.UUID
    name: str
    role: str | None = None
    company: str | None = None
    review: str
    rating: int | None = None
    website: str | None = None
    verified: bool = False
    is_placeholder: bool = False
    featured: bool = False
    status: ContentStatus = "draft"
    display_order: int = 0


class TestimonialCreate(BaseModel):
    name: str = Field(max_length=255)
    role: str | None = None
    company: str | None = None
    avatar_asset_id: uuid.UUID | None = None
    review: str = Field(min_length=1)
    rating: int | None = Field(default=None, ge=1, le=5)
    website: str | None = None
    verified: bool = False
    is_placeholder: bool = False
    featured: bool = False
    status: ContentStatus = "draft"
    display_order: int = 0


class TestimonialUpdate(TestimonialCreate):
    name: str | None = None  # type: ignore[assignment]
    review: str | None = None


class BlogPostRead(ORMModel):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: str | None = None
    content_markdown: str | None = None
    author_name: str = "Redwan Ahmed Khan"
    tags: list[str] = []
    category: str | None = None
    reading_time_minutes: int | None = None
    github_url: str | None = None
    references: list[str] = []
    featured: bool = False
    seo_title: str | None = None
    seo_description: str | None = None
    canonical_url: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class BlogPostCreate(BaseModel):
    title: str = Field(max_length=300)
    slug: str | None = None
    excerpt: str | None = None
    content_markdown: str | None = None
    cover_asset_id: uuid.UUID | None = None
    author_name: str = "Redwan Ahmed Khan"
    tags: list[str] = []
    category: str | None = None
    reading_time_minutes: int | None = Field(default=None, ge=1)
    github_url: str | None = None
    references: list[str] = []
    featured: bool = False
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = Field(default=None, max_length=300)
    canonical_url: str | None = None
    status: ContentStatus = "draft"
    display_order: int = 0


class BlogPostUpdate(BlogPostCreate):
    title: str | None = None  # type: ignore[assignment]


# --------------------------------------------------------------------------- #
# Contact / hire
# --------------------------------------------------------------------------- #

ContactPurpose = Literal[
    "Job Opportunity",
    "Freelance Project",
    "Research Collaboration",
    "Speaking / Teaching",
    "Open Source",
    "General Inquiry",
    "Other",
]


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=255)
    purpose: ContactPurpose
    message: str = Field(min_length=10, max_length=5000)
    website: str | None = Field(default=None, max_length=200)  # honeypot — must stay empty


class ContactMessageRead(ORMModel):
    id: uuid.UUID
    name: str
    email: str
    subject: str
    purpose: str
    message: str
    status: str = "new"
    created_at: datetime
    notified_at: datetime | None = None


class HireRequestCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: str | None = Field(default=None, max_length=255)
    project_type: str = Field(min_length=2, max_length=120)
    budget_range: str | None = Field(default=None, max_length=120)
    timeline: str | None = Field(default=None, max_length=120)
    project_description: str = Field(min_length=20, max_length=10000)
    website: str | None = Field(default=None, max_length=200)  # honeypot


class HireRequestRead(ORMModel):
    id: uuid.UUID
    name: str
    email: str
    company: str | None = None
    project_type: str
    budget_range: str | None = None
    timeline: str | None = None
    project_description: str
    status: str = "new"
    created_at: datetime


# --------------------------------------------------------------------------- #
# Settings / SEO / CV / audit
# --------------------------------------------------------------------------- #


class SiteSettingRead(ORMModel):
    id: uuid.UUID
    key: str
    value: Any = None
    description: str | None = None


class SiteSettingUpsert(BaseModel):
    key: str = Field(max_length=120)
    value: Any = None
    description: str | None = None


class SeoMetadataRead(ORMModel):
    id: uuid.UUID
    route: str
    title: str | None = None
    description: str | None = None
    og_image_url: str | None = None
    canonical_url: str | None = None
    noindex: bool = False


class SeoMetadataUpsert(BaseModel):
    route: str = Field(max_length=300)
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=320)
    og_image_url: str | None = None
    canonical_url: str | None = None
    noindex: bool = False


class CVVersionRead(ORMModel):
    id: uuid.UUID
    label: str
    asset: MediaAssetRead
    is_current: bool
    status: str
    download_count: int
    created_at: datetime
    updated_at: datetime


class CVVersionCreate(BaseModel):
    label: str = Field(max_length=255)
    asset_id: uuid.UUID
    make_current: bool = True


class AuditLogRead(ORMModel):
    id: uuid.UUID
    created_at: datetime
    actor_id: uuid.UUID | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    detail: dict | None = None
    ip_address: str | None = None


class ReorderRequest(BaseModel):
    ordered_ids: list[uuid.UUID] = Field(min_length=1)


class MessageResponse(BaseModel):
    success: bool = True
    message: str
