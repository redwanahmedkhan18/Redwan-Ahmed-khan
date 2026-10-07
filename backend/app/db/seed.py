"""Database seeder.

CONTENT RULE: only the factual information explicitly supplied is seeded.
No invented URLs, metrics, DOIs, clients, testimonials, or accomplishments.
Anything unknown stays NULL and is editable from the admin CMS.
Idempotent: safe to run repeatedly (only seeds an empty database).
"""

from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.core.security import hash_password

logger = logging.getLogger("app.seed")


def seed_roles(db: Session) -> models.Role:
    super_admin = (
        db.execute(select(models.Role).where(models.Role.name == "SUPER_ADMIN")).scalars().first()
    )
    if super_admin:
        return super_admin
    super_admin = models.Role(
        name="SUPER_ADMIN",
        description="Full control incl. users, settings, destructive actions",
        permissions=["*"],
    )
    editor = models.Role(
        name="EDITOR",
        description="Content CRUD and publishing",
        permissions=["content.read", "content.write", "media.write", "inbox.read"],
    )
    db.add_all([super_admin, editor])
    db.flush()
    return super_admin


def seed_admin_user(db: Session, role: models.Role) -> None:
    exists = (
        db.execute(select(models.User).where(models.User.email == settings.ADMIN_EMAIL.lower()))
        .scalars()
        .first()
    )
    if exists:
        return
    db.add(
        models.User(
            email=settings.ADMIN_EMAIL.lower(),
            full_name="Redwan Ahmed Khan",
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role_id=role.id,
            is_active=True,
        )
    )


def seed_profile(db: Session) -> None:
    if db.execute(select(models.Profile)).scalars().first():
        return
    db.add(
        models.Profile(
            full_name="Redwan Ahmed Khan",
            headline="Artificial Intelligence Engineer | Software Engineer | Researcher",
            tagline=(
                "I build intelligent software systems, production AI solutions, and "
                "research-driven applications across AI/ML, NLP, LLMs and modern software engineering."
            ),
            location="Dhaka, Bangladesh",
            about_short=(
                "AI engineer and researcher working across production AI systems, software engineering "
                "and machine learning research — with current focus on LLM applications, RAG, agentic AI "
                "and healthcare AI."
            ),
            about_long=None,  # long-form narrative: editable in admin
            engineering_interests=[
                "Production AI systems",
                "LLM applications",
                "Agentic AI",
                "Intelligent automation",
                "Backend/API engineering",
                "Full-stack AI applications",
                "MLOps",
            ],
            research_interests=[
                "NLP",
                "LLMs",
                "Generative AI",
                "Retrieval-Augmented Generation",
                "Healthcare AI",
                "Information Retrieval",
                "Agentic AI",
                "Machine Learning",
                "Deep Learning",
            ],
            technical_philosophy=None,  # editable in admin
        )
    )


def seed_social_links(db: Session) -> None:
    if db.execute(select(models.SocialLink)).scalars().first():
        return
    links = [
        ("linkedin", "https://www.linkedin.com/in/redwan-ahmed-khan-489716243/", "LinkedIn"),
        ("github", "https://github.com/redwanahmedkhan18", "GitHub"),
        ("x", "https://x.com/redwanahmed1810", "X / Twitter"),
        ("kaggle", "https://www.kaggle.com/redwanahamedkhan24", "Kaggle"),
        ("medium", "https://medium.com/@redwanahmedkhan", "Medium"),
        (
            "google_scholar",
            "https://scholar.google.com/citations?user=_sZ7lRoAAAAJ&hl=en",
            "Google Scholar",
        ),
    ]
    for i, (platform, url, label) in enumerate(links):
        db.add(models.SocialLink(platform=platform, url=url, label=label, display_order=i))


def seed_education(db: Session) -> None:
    if db.execute(select(models.Education)).scalars().first():
        return
    db.add(
        models.Education(
            institution_name="International University of Business, Agriculture and Technology (IUBAT)",
            institution_short_name="IUBAT",
            department="Computer Science and Engineering",
            degree="Bachelor of Science",
            field_of_study="Computer Science and Engineering",
            cgpa=3.60,
            cgpa_scale=4.00,
            start_date=None,  # not supplied — do not invent; admin-editable
            end_date=date(2022, 4, 30),
            graduation_date=date(2022, 4, 1),  # April 2022
            enrollment_status="Completed",
            status="published",
            published_at=__import__("app.db.base", fromlist=["utcnow"]).utcnow(),
            display_order=0,
        )
    )


def seed_experience(db: Session) -> None:
    if db.execute(select(models.WorkExperience)).scalars().first():
        return
    from app.db.base import utcnow

    shadhin_highlights = """### USA Bid/Bounty Recommendation Dataset

Built a dataset by extracting data related to USA county-level bid/bounty information.

- Data extraction and preprocessing
- Dataset construction
- NLP analysis and experimentation with NLP techniques
- Transformer-based modeling
- BERT-based modeling

### Conversational AI / Chatbot

Built a complete chatbot system using **FastAPI**, **PostgreSQL** and **React.js**.

**Intent classification** — DIET through Rasa, or custom Bi-LSTM using PyTorch/Keras. Recognizes user intents such as `refund_request`, `track_package`, `order_status`, `account_support`.

**Entity extraction** — spaCy, CRF. Extracts account numbers, email addresses, dates, entities and order information.

**Dialogue management** — Finite State Machine, Rasa Stories. Maintains conversational state and enforces sequential workflows.

**FAQ retrieval** — TF-IDF, BM25. Retrieves relevant answers from an organization-approved knowledge base."""

    db.add(
        models.WorkExperience(
            company="Shadhin Lab LLC",
            role="Intern AI Engineer",
            employment_type="Internship",
            work_mode="On-site",
            location="Rampura, Dhaka",
            start_date=date(2022, 5, 1),
            end_date=date(2022, 8, 31),
            is_current=False,
            summary=(
                "Worked on NLP dataset construction for USA county-level bid/bounty recommendation "
                "and built a complete conversational AI / chatbot system (FastAPI, PostgreSQL, React.js)."
            ),
            responsibilities=[
                "Data extraction, preprocessing and dataset construction for USA county-level bid/bounty information",
                "NLP analysis and experimentation with NLP techniques, including transformer-based and BERT-based modeling",
                "Intent classification using DIET (Rasa) or custom Bi-LSTM (PyTorch/Keras)",
                "Entity extraction using spaCy and CRF",
                "Dialogue management with Finite State Machine and Rasa Stories",
                "FAQ retrieval with TF-IDF and BM25 over an organization-approved knowledge base",
            ],
            achievements_public_safe=[],  # only explicitly entered, public-safe items
            highlights_markdown=shadhin_highlights,
            technologies=[
                "Python",
                "FastAPI",
                "PostgreSQL",
                "React.js",
                "Rasa",
                "spaCy",
                "PyTorch",
                "Keras",
                "BERT",
                "TF-IDF",
                "BM25",
                "CRF",
            ],
            status="published",
            published_at=utcnow(),
            display_order=1,
        )
    )
    db.add(
        models.WorkExperience(
            company="CircleCI",
            company_url=None,  # not supplied — admin-editable
            role="Remote AI Engineer",
            employment_type="Full-time",
            work_mode="Remote",
            location=None,
            start_date=date(2022, 8, 2),
            end_date=None,
            is_current=True,
            summary=(
                "Developing AI/ML and Agentic AI solutions involving Large Language Models, "
                "AI/ML systems, intelligent automation and production AI engineering."
            ),
            responsibilities=[
                "Agentic AI development",
                "Large Language Model applications",
                "AI/ML systems engineering",
                "Intelligent automation",
                "Production AI engineering",
            ],
            # NOTE: no confidential CircleCI projects, metrics, customers, internal architecture,
            # repositories or proprietary details. Public-safe achievements are entered by the admin.
            achievements_public_safe=[],
            highlights_markdown=None,
            technologies=["Python", "LLMs", "Agentic AI", "Machine Learning"],
            status="published",
            published_at=utcnow(),
            display_order=0,
        )
    )


def seed_skills(db: Session) -> None:
    if db.execute(select(models.SkillCategory)).scalars().first():
        return
    categories = [
        ("Programming Languages", "programming-languages", ["C", "C++", "Python", "SQL"]),
        ("Databases", "databases", ["PostgreSQL", "MongoDB", "Vector Databases"]),
        (
            "Frameworks / Libraries",
            "frameworks-libraries",
            [
                "FastAPI",
                "React.js",
                "Next.js",
                "NumPy",
                "Pandas",
                "Matplotlib",
                "Seaborn",
                "Scikit-learn",
                "PyTorch",
                "TensorFlow",
            ],
        ),
        (
            "AI / ML",
            "ai-ml",
            ["Machine Learning", "Deep Learning", "NLP", "LLMs", "Hugging Face", "LangChain"],
        ),
        (
            "MLOps / Infrastructure",
            "mlops-infrastructure",
            ["Docker", "Git", "GitHub", "AWS", "Nginx"],
        ),
    ]
    for cat_order, (cat_name, cat_slug, skill_names) in enumerate(categories):
        cat = models.SkillCategory(name=cat_name, slug=cat_slug, display_order=cat_order)
        db.add(cat)
        db.flush()
        for i, name in enumerate(skill_names):
            db.add(models.Skill(name=name, category_id=cat.id, display_order=i))


def seed_projects(db: Session) -> None:
    if db.execute(select(models.Project)).scalars().first():
        return
    from app.db.base import utcnow

    projects = [
        dict(
            name="ShopMind AI",
            slug="shopmind",
            category="AI Platform",
            short_description=(
                "An AI-powered ecommerce platform focused on intelligent shopping, seller management, "
                "product discovery, personalization, automation and modern commerce workflows."
            ),
            featured=True,
            display_order=0,
        ),
        dict(
            name="LeadForge AI",
            slug="leadforge-ai",
            category="AI Platform",
            short_description=(
                "An AI-powered lead intelligence and automation platform designed to support lead "
                "discovery, enrichment, qualification, research, workflow automation and intelligent "
                "sales operations."
            ),
            featured=True,
            display_order=1,
        ),
        dict(
            name="Mediflow AI",
            slug="mediflow-ai",
            category="Healthcare AI",
            short_description=(
                "An AI-powered healthcare receptionist platform designed to assist healthcare "
                "organizations with patient communication, appointment scheduling and receptionist "
                "workflows, including conversational voice/video interaction capabilities."
            ),
            key_features=[
                "AI receptionist",
                "Patient interaction",
                "Appointment scheduling",
                "Appointment management",
                "Conversational AI",
                "Voice interaction",
                "Video interaction",
                "Patient information collection",
                "Routing/handoff to human staff",
                "Healthcare workflow automation",
            ],
            # Mediflow does NOT provide medical diagnosis or autonomous clinical decision-making.
            results="Assists healthcare organizations with reception and scheduling workflows. Not a medical diagnosis or clinical decision-making system.",
            featured=True,
            display_order=2,
        ),
        dict(
            name="ContentForge AI",
            slug="contentforge-ai",
            category="AI Platform",
            short_description=(
                "An AI-powered content creation and automation platform designed to help generate, "
                "manage, transform and organize content through intelligent workflows."
            ),
            featured=True,
            display_order=3,
        ),
    ]
    for p in projects:
        db.add(
            models.Project(
                **p,
                problem=None,
                solution=None,
                long_description=None,
                role=None,
                project_status=None,
                metrics_note="Not publicly disclosed.",
                status="published",
                published_at=utcnow(),
            )
        )
    # Links (GitHub/live demo/documentation) are NOT invented — admin enters real URLs.


def seed_research(db: Session) -> None:
    if db.execute(select(models.ResearchPaper)).scalars().first():
        return
    from app.db.base import utcnow

    paper1 = models.ResearchPaper(
        title="Supervised Ensemble Learning Techniques to Detect and Classify Cardiac Arrhythmia",
        slug="supervised-ensemble-learning-cardiac-arrhythmia",
        research_status="Under Review",  # preserved exactly as supplied — no publication claims
        research_area=["Machine Learning", "Healthcare AI", "Ensemble Learning"],
        short_description=None,
        abstract=None,  # admin-managed
        publisher=None,
        venue=None,
        publication_year=None,  # do not invent
        status="published",
        published_at=utcnow(),
        display_order=1,
    )
    paper1.authors = [
        models.ResearchAuthor(name="Khan, R.A.", is_self=True, display_order=0),
        models.ResearchAuthor(name="Nishy, F.E.", display_order=1),
    ]
    paper2 = models.ResearchPaper(
        title="CARE-RAG: Risk-Aware and Consistency-Aware Evidence Retrieval for Medical Retrieval-Augmented Generation",
        slug="care-rag",
        research_status="Working",  # preserved exactly as supplied
        research_area=[
            "Medical AI",
            "Retrieval-Augmented Generation",
            "Information Retrieval",
            "Evidence Retrieval",
            "LLMs",
            "Healthcare AI",
        ],
        short_description=None,
        abstract=None,  # complete abstract/DOI/year/URLs managed in admin
        publisher=None,
        venue=None,
        publication_year=None,  # do not invent DOI or publication info
        featured=True,
        status="published",
        published_at=utcnow(),
        display_order=0,
    )
    paper2.authors = [models.ResearchAuthor(name="Khan, R.A.", is_self=True, display_order=0)]
    db.add_all([paper1, paper2])


def seed_achievements(db: Session) -> None:
    if db.execute(select(models.Achievement)).scalars().first():
        return
    from app.db.base import utcnow

    items = [
        ("IUBAT Battle of Intellects 2021", "IUBAT", 2021, "2nd Runner-up", None, 0),
        ("BUP ICT Fest 2018", "BUP", 2018, "6th Place", None, 2),
        (
            "JU IT Fest 2019",
            "Jahangirnagar University",
            2019,
            "2nd Runner-up",
            "Autonomous Driving System",
            1,
        ),
    ]
    for title, org, year, rank, context, order in items:
        db.add(
            models.Achievement(
                title=title,
                organization=org,
                year=year,
                rank=rank,
                project_context=context,
                kind="competition",
                status="published",
                published_at=utcnow(),
                display_order=order,
            )
        )


def seed_testimonials(db: Session) -> None:
    if db.execute(select(models.Testimonial)).scalars().first():
        return
    # Clearly-labeled placeholder only — never attributed to a real person/company.
    db.add(
        models.Testimonial(
            name="Placeholder Example (not a real client)",
            role="Example Role",
            company="Example Company",
            review="This is placeholder demo content. Real testimonials are only shown after admin verification.",
            verified=False,
            is_placeholder=True,
            featured=False,
            status="draft",  # not public until real, verified content exists
        )
    )


def seed_site_settings(db: Session) -> None:
    if db.execute(select(models.SiteSetting)).scalars().first():
        return
    db.add_all(
        [
            models.SiteSetting(
                key="hire_services",
                value=[
                    "AI engineering",
                    "LLM application development",
                    "RAG systems",
                    "AI agents",
                    "NLP systems",
                    "ML systems",
                    "Backend/API engineering",
                    "AI automation",
                    "Full-stack AI applications",
                ],
                description="Services listed on /hire-me (editable)",
            ),
            models.SiteSetting(
                key="contact_purposes",
                value=[
                    "Job Opportunity",
                    "Freelance Project",
                    "Research Collaboration",
                    "Speaking / Teaching",
                    "Open Source",
                    "General Inquiry",
                    "Other",
                ],
                description="Purpose options on /contact",
            ),
            models.SiteSetting(
                key="hero_ctas",
                value={
                    "primary": [
                        {"label": "View My Work", "href": "/projects"},
                        {"label": "Contact Me", "href": "/contact"},
                    ],
                    "secondary": [
                        {"label": "Download CV", "href": "/cv"},
                        {"label": "Hire Me", "href": "/hire-me"},
                    ],
                },
                description="Hero call-to-action buttons",
            ),
            models.SiteSetting(
                key="analytics_enabled",
                value=True,
                description="Privacy-conscious aggregate analytics",
            ),
        ]
    )


def seed_seo(db: Session) -> None:
    if db.execute(select(models.SeoMetadata)).scalars().first():
        return
    defaults = {
        "/": (
            "Redwan Ahmed Khan — AI Engineer | Software Engineer | Researcher",
            "Portfolio of Redwan Ahmed Khan: production AI engineering, LLM and RAG systems, software engineering and AI/ML research.",
        ),
        "/about": (
            "About — Redwan Ahmed Khan",
            "Professional background, education, experience and research interests of Redwan Ahmed Khan.",
        ),
        "/projects": (
            "Projects — Redwan Ahmed Khan",
            "AI-powered platforms and software projects by Redwan Ahmed Khan.",
        ),
        "/research": (
            "Research — Redwan Ahmed Khan",
            "AI/ML research: medical RAG, ensemble learning for cardiac arrhythmia detection, NLP and healthcare AI.",
        ),
        "/machine-learning": (
            "Machine Learning Projects — Redwan Ahmed Khan",
            "Machine learning projects, datasets, notebooks and results.",
        ),
        "/open-source": (
            "Open Source — Redwan Ahmed Khan",
            "Open-source contributions by Redwan Ahmed Khan.",
        ),
        "/achievements": ("Achievements — Redwan Ahmed Khan", "Competition results and awards."),
        "/blog": (
            "Writing — Redwan Ahmed Khan",
            "Technical writing on AI, ML, NLP, LLMs, RAG and software engineering.",
        ),
        "/contact": (
            "Contact — Redwan Ahmed Khan",
            "Get in touch for job opportunities, freelance projects or research collaboration.",
        ),
        "/hire-me": (
            "Hire Me — Redwan Ahmed Khan",
            "AI engineering, LLM applications, RAG systems, AI agents and backend engineering services.",
        ),
        "/cv": ("CV — Redwan Ahmed Khan", "Download the current CV of Redwan Ahmed Khan."),
    }
    for route, (title, description) in defaults.items():
        db.add(models.SeoMetadata(route=route, title=title, description=description))


def seed_admin_settings(db: Session) -> None:
    """Admin route noindex flags — keep /admin out of search indexes."""
    row = (
        db.execute(select(models.SeoMetadata).where(models.SeoMetadata.route == "/admin"))
        .scalars()
        .first()
    )
    if row is None:
        db.add(models.SeoMetadata(route="/admin", title="Admin", noindex=True))


def run_seed(db: Session) -> None:
    role = seed_roles(db)
    seed_admin_user(db, role)
    seed_profile(db)
    seed_social_links(db)
    seed_education(db)
    seed_experience(db)
    seed_skills(db)
    seed_projects(db)
    seed_research(db)
    seed_achievements(db)
    seed_testimonials(db)
    seed_site_settings(db)
    seed_seo(db)
    seed_admin_settings(db)
    db.commit()
    logger.info("Seed complete.")


if __name__ == "__main__":
    from app.db.session import SessionLocal

    logging.basicConfig(level=logging.INFO)
    with SessionLocal() as session:
        run_seed(session)
