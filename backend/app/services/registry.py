"""Central resource registry — single source of truth wiring models ↔ schemas ↔ configs.

Used by both public and admin routers so the API surface stays consistent.
"""

from __future__ import annotations

from app import models, schemas
from app.services.base import ChildConfig, ResourceConfig

REGISTRY: dict[str, ResourceConfig] = {}


def _reg(config: ResourceConfig) -> None:
    REGISTRY[config.key] = config


_reg(
    ResourceConfig(
        key="education",
        label="Education entry",
        model=models.Education,
        create_schema=schemas.EducationCreate,
        update_schema=schemas.EducationUpdate,
        search_fields=("institution_name", "degree", "field_of_study"),
    )
)
_reg(
    ResourceConfig(
        key="experience",
        label="Experience entry",
        model=models.WorkExperience,
        create_schema=schemas.ExperienceCreate,
        update_schema=schemas.ExperienceUpdate,
        search_fields=("company", "role", "location"),
    )
)
_reg(
    ResourceConfig(
        key="projects",
        label="Project",
        model=models.Project,
        create_schema=schemas.ProjectCreate,
        update_schema=schemas.ProjectUpdate,
        search_fields=("name", "short_description", "category"),
        slug_field="slug",
        slug_source="name",
        children=[
            ChildConfig("technologies", models.ProjectTechnology, ("name", "display_order")),
            ChildConfig("links", models.ProjectLink, ("kind", "url", "label")),
            ChildConfig(
                "images",
                models.ProjectImage,
                ("asset_id", "url", "alt_text", "caption", "kind", "display_order"),
            ),
        ],
    )
)
_reg(
    ResourceConfig(
        key="ml-projects",
        label="ML project",
        model=models.MLProject,
        create_schema=schemas.MLProjectCreate,
        update_schema=schemas.MLProjectUpdate,
        search_fields=("project_name", "short_description", "algorithm", "problem_type"),
        slug_field="slug",
        slug_source="project_name",
    )
)
_reg(
    ResourceConfig(
        key="research",
        label="Research paper",
        model=models.ResearchPaper,
        create_schema=schemas.ResearchPaperCreate,
        update_schema=schemas.ResearchPaperUpdate,
        search_fields=("title", "short_description", "abstract"),
        slug_field="slug",
        slug_source="title",
        children=[
            ChildConfig("authors", models.ResearchAuthor, ("name", "is_self", "display_order")),
            ChildConfig("links", models.ResearchLink, ("kind", "url")),
        ],
    )
)
_reg(
    ResourceConfig(
        key="open-source",
        label="Open-source contribution",
        model=models.OpenSourceContribution,
        create_schema=schemas.OpenSourceCreate,
        update_schema=schemas.OpenSourceUpdate,
        search_fields=("name", "organization", "description"),
    )
)
_reg(
    ResourceConfig(
        key="achievements",
        label="Achievement",
        model=models.Achievement,
        create_schema=schemas.AchievementCreate,
        update_schema=schemas.AchievementUpdate,
        search_fields=("title", "organization", "rank"),
    )
)
_reg(
    ResourceConfig(
        key="certifications",
        label="Certification",
        model=models.Certification,
        create_schema=schemas.CertificationCreate,
        update_schema=schemas.CertificationUpdate,
        search_fields=("name", "issuer"),
    )
)
_reg(
    ResourceConfig(
        key="testimonials",
        label="Testimonial",
        model=models.Testimonial,
        create_schema=schemas.TestimonialCreate,
        update_schema=schemas.TestimonialUpdate,
        search_fields=("name", "company", "review"),
    )
)
_reg(
    ResourceConfig(
        key="blog",
        label="Blog post",
        model=models.BlogPost,
        create_schema=schemas.BlogPostCreate,
        update_schema=schemas.BlogPostUpdate,
        search_fields=("title", "excerpt", "category"),
        slug_field="slug",
        slug_source="title",
    )
)
_reg(
    ResourceConfig(
        key="social-links",
        label="Social link",
        model=models.SocialLink,
        create_schema=schemas.SocialLinkCreate,
        update_schema=schemas.SocialLinkUpdate,
        search_fields=("platform", "url"),
        default_sort=("display_order", "asc"),
        publishable=False,
    )
)
_reg(
    ResourceConfig(
        key="skill-categories",
        label="Skill category",
        model=models.SkillCategory,
        create_schema=schemas.SkillCategoryCreate,
        update_schema=schemas.SkillCategoryUpdate,
        search_fields=("name",),
        slug_field="slug",
        slug_source="name",
        publishable=False,
    )
)
_reg(
    ResourceConfig(
        key="skills",
        label="Skill",
        model=models.Skill,
        create_schema=schemas.SkillCreate,
        update_schema=schemas.SkillUpdate,
        search_fields=("name",),
        publishable=False,
    )
)


def get_config(key: str) -> ResourceConfig:
    return REGISTRY[key]
