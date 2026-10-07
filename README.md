# Redwan Ahmed Khan — Dynamic Portfolio Platform

A production-grade, full-stack **dynamic portfolio & professional profile CMS** for
**Redwan Ahmed Khan — Artificial Intelligence Engineer | Software Engineer | Researcher**.

Almost all professional content (profile, experience, education, projects, research, skills,
achievements, testimonials, blog, CV, media, SEO, site settings) is managed from a secure
admin dashboard and served through a FastAPI backend — the frontend hardcodes **only** UI
labels, navigation and design configuration.

> **Content integrity rule:** the seeded database contains *only* factual information that was
> explicitly supplied (education, employment dates, competition results, paper titles/authors/statuses,
> profile URLs). Nothing is invented: no fake metrics, DOIs, project URLs, client names or
> testimonials. Unknown values stay `NULL` / "Not publicly available" until entered in the admin CMS.

---

## Architecture

```
Browser ──▶ Next.js 16.3.6 (App Router, RSC/SSR, Tailwind v4, TypeScript)
               │  /api/v1/* and /media/* proxied via next.config rewrites
               ▼
            FastAPI 0.141.1 (Python 3.12+)
               │  api → services → repositories → SQLAlchemy 2.x models
               ▼
            PostgreSQL 16 (SQLite fallback for zero-setup local dev)
            + optional Redis, S3-compatible object storage, SMTP
```

- **Frontend**: server-rendered public site (minimal JS), hydrated client islands only where
  needed (nav, theme, contact/hire forms, the entire admin CMS).
- **Backend layering**: routers contain no business logic — services own the publishing
  workflow, validation rules and audit trail; repositories own data access.
- **Auth**: Argon2id password hashing, short-lived JWT access tokens, rotating HTTP-only
  Secure/SameSite refresh-token cookies (hashed at rest, reuse detection), login lockout,
  RBAC (`SUPER_ADMIN`, `EDITOR`), full audit logging.
- Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository layout

```
redwan-portfolio/
├── frontend/                  # Next.js 16.3.6 + TypeScript + Tailwind v4
│   ├── src/app/(site)/        # public site routes (SSR/RSC)
│   ├── src/app/admin/         # admin CMS (login + (cms) group)
│   ├── src/components/        # server + shared components
│   ├── src/islands/           # interactive client components (Hero, forms, CV)
│   ├── src/lib/               # api client, types, seo, theme, formatting
│   ├── e2e/                   # Playwright end-to-end specs
│   └── playwright.config.ts
├── backend/
│   ├── app/
│   │   ├── api/public/        # read-only published-content API + contact/hire intake
│   │   ├── api/admin/         # auth, generic CRUD factory, dashboard, media, inbox
│   │   ├── config/            # pydantic-settings
│   │   ├── core/              # security (Argon2id/JWT), errors (envelope), logging
│   │   ├── db/                # Base, session, portable GUID type, seed script
│   │   ├── middleware/        # security headers (CSP/HSTS), rate limiting
│   │   ├── models/            # SQLAlchemy 2.x — all 28 tables
│   │   ├── repositories/      # generic data-access layer
│   │   ├── schemas/           # Pydantic v2 contracts
│   │   ├── services/          # business logic, resource registry, auth, media, notifications
│   │   └── utils/             # slugify, pagination, sanitization
│   ├── migrations/            # Alembic
│   └── tests/                 # pytest — 41 tests (unit + API + auth + validation)
├── docker/                    # backend.Dockerfile, frontend.Dockerfile
├── docs/                      # ARCHITECTURE, DEPLOYMENT, ADMIN_GUIDE
├── .github/workflows/         # lint, test (+E2E), build, security, deploy
├── docker-compose.yml         # frontend + backend + postgres + redis
└── .env.example
```

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js **16.3.6** (App Router, RSC, SSG/ISR), React 19, TypeScript, Tailwind CSS v4, react-markdown, Playwright |
| Backend   | Python 3.12+, FastAPI **0.141.1**, SQLAlchemy 2.x, Pydantic v2, Alembic, python-jose (JWT), Argon2id |
| Database  | PostgreSQL 16 (prod) / SQLite (local dev fallback via `DATABASE_URL`) |
| Infra     | Docker Compose, optional Redis, optional S3-compatible storage, SMTP notifications |
| CI/CD     | GitHub Actions: lint → typecheck → tests → E2E → build → security → deploy |

> Note: Next.js `16.3.7` was requested but is not published to the npm registry yet
> (latest stable at build time is `16.3.6`). Bump `frontend/package.json` when 16.3.7 ships.

## Local development

### Option A — Docker (PostgreSQL, closest to production)

```bash
cp .env.example .env            # fill in SECRET_KEY, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build    # postgres + redis + backend (:8000) + frontend (:3000)
```

The backend container runs `alembic upgrade head` and seeds on start.

### Option B — Bare metal (zero-setup SQLite)

Backend (Python 3.12+):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env            # or rely on defaults (SQLite ./dev.db)
python -m alembic upgrade head  # create schema
python -m app.db.seed           # seed roles/admin + factual content
uvicorn app.main:app --reload   # http://localhost:8000  (docs: /docs, /redoc)
```

Frontend (Node 20+):

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

### Default admin account (seeded)

```
email:    admin@example.com      # set ADMIN_EMAIL before seeding in production
password: ChangeMe!123           # set ADMIN_PASSWORD before seeding in production
```

Sign in at **/admin/login**. Change the password immediately in production
(`POST /api/v1/admin/auth/change-password`).

## Environment variables

See [`backend/.env.example`](backend/.env.example) (all backend settings incl. SMTP/storage/Redis)
and [`frontend/.env.example`](frontend/.env.example) (`API_INTERNAL_URL`, `BACKEND_ORIGIN`,
`NEXT_PUBLIC_SITE_URL`). **Never commit `.env`** — both are gitignored.

Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://…` in prod; `sqlite:///./dev.db` locally |
| `SECRET_KEY`, `JWT_SECRET` | signing secrets — generate strong random values |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrap super admin (seed only) |
| `CORS_ORIGINS` | comma-separated frontend origins |
| `SMTP_*`, `NOTIFY_EMAIL` | contact/hire notification emails (logged when unset) |
| `STORAGE_*` | S3-compatible storage (local disk when `STORAGE_BACKEND=local`) |
| `REDIS_URL` | optional cache/rate-limit backend |
| `RATE_LIMIT_CONTACT_PER_HOUR` | contact/hire spam protection (default 5) |

## Database & migrations

Schema changes **always** go through Alembic — never edit production schema manually:

```bash
cd backend
python -m alembic revision --autogenerate -m "describe change"
python -m alembic upgrade head
```

28 tables incl. `users/roles`, `refresh_tokens`, `audit_logs`, `profile`, `social_links`,
`education`, `work_experience`, `skill_categories/skills`, `projects` (+`project_technologies`,
`project_links`, `project_images`), `ml_projects`, `research_papers` (+`research_authors`,
`research_links`), `open_source_contributions`, `achievements`, `certifications`, `testimonials`,
`blog_posts`, `contact_messages`, `hire_requests`, `site_settings`, `seo_metadata`,
`media_assets`, `cv_versions`. UUID primary keys, `draft/published/archived` lifecycle,
`display_order`, CHECK constraints (e.g. *Currently Studying ⇒ end_date NULL*,
*is_current ⇒ end_date NULL*), unique slugs, FK cascades, indexes.

## API

Public (published content only) — prefix `/api/v1`:

```
GET  /profile  /education  /experience  /projects  /projects/{slug}
GET  /ml-projects  /research  /research/{slug}  /open-source  /skills
GET  /achievements  /certifications  /testimonials  /blog  /blog/{slug}
GET  /social-links  /site-settings  /seo  /cv/current  /sitemap-data
POST /contact  /hire-requests          # validated, sanitized, rate-limited, honeypot
POST /cv/{id}/download                 # aggregate counter (privacy-conscious analytics)
GET  /health  /ready                   # ops (root, outside /api/v1)
```

Admin (JWT bearer + RBAC) — prefix `/api/v1/admin`, uniform per resource
(`education, experience, projects, ml-projects, research, open-source, achievements,
certifications, testimonials, blog, social-links, skills, skill-categories`):

```
GET/POST        /admin/{resource}                 # list (page, page_size, status, q, sort) / create
GET/PATCH/DELETE /admin/{resource}/{id}
POST            /admin/{resource}/{id}/publish|unpublish|archive
POST            /admin/{resource}/reorder
POST            /admin/auth/login|refresh|logout|change-password
GET             /admin/dashboard/summary|recent-messages|recent-hire-requests|recent-audit
POST/GET/PATCH/DELETE /admin/media …              # validated uploads (type + size)
GET/POST        /admin/cv …  POST /admin/cv/{id}/make-current
GET/PUT         /admin/settings  /admin/seo       # site settings & per-route SEO overrides
GET             /admin/audit-logs                 # SUPER_ADMIN only
```

Consistent error envelope — no stack traces leak in production:

```json
{ "success": false, "message": "Project not found", "error_code": "PROJECT_NOT_FOUND" }
```

Interactive docs: **/docs** (Swagger) and **/redoc** — disable via `ENABLE_OPENAPI_DOCS=false`
in production if desired.

## Admin CMS

`/admin` — dashboard with real published/draft counts, recent messages and audit trail;
CRUD + publish/unpublish/archive + explicit reordering for every content type; profile &
hero editor; media library with alt-text management; CV versioning (upload → mark current →
archive previous); contact inbox and hire-request inbox; site settings (hire services, hero
CTAs, contact purposes); per-route SEO overrides with `noindex` (pre-set for `/admin`).
See [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md).

## Testing

```bash
# backend — unit + API + auth + validation (41 tests)
cd backend && pytest

# frontend — types + lint
cd frontend && npx tsc --noEmit && npm run lint

# E2E — Playwright (needs backend :8000 + frontend :3000 running)
cd frontend && npx playwright test        # add: npx playwright install chromium
```

E2E covers: homepage rendering, absence of fabricated claims, project/research navigation,
contact + hire form submission, empty/loading states, custom 404, dark-mode persistence,
mobile navigation, no horizontal overflow at 320–1920px, sitemap/robots content,
admin auth (bad password, lockout path), full admin CRUD → publish → public visibility → delete,
education date-rule enforcement, logout/session invalidation.

## CI/CD

GitHub Actions (`.github/workflows/`): **lint.yml** (ruff + tsc + eslint), **test.yml**
(pytest against PostgreSQL service + Playwright E2E), **build.yml** (both Docker images),
**security.yml** (gitleaks secret scanning, pip-audit, npm audit), **deploy.yml**
(runs only when tests+build succeed; SSH/Compose example + post-deploy smoke checks).

## Security

Argon2id hashing · JWT access + rotating HTTP-only refresh cookies (hashed at rest, reuse
detection, revocation on logout/password change) · login lockout + rate limiting on
login/contact/hire · RBAC · CSRF-safe cookie flags (`SameSite=Lax`, `Secure` in prod) ·
CSP/nosniff/frame-deny/HSTS(prod) headers · CORS allowlist · Pydantic validation everywhere ·
parameterized ORM queries only · honeypot + sanitization on public forms · upload type/size
validation · audit log (no secrets/message bodies logged) · `/admin` noindex + X-Robots-Tag ·
secrets only via `.env` (gitignored).

## SEO & accessibility

Per-page metadata + canonicals + OpenGraph/Twitter, JSON-LD (`Person`, `WebSite`,
`ProfilePage`, `Article`, `ScholarlyArticle`, `CreativeWork`/`SoftwareSourceCode` only when a
repo URL exists), admin-managed per-route overrides, dynamic `sitemap.xml` (published content
only), `robots.txt` (blocks `/admin`, `/api`), manifest, semantic HTML, skip link, visible
focus, ARIA where needed, `prefers-reduced-motion`, light/dark/system themes without flash,
responsive 320→1920px with no horizontal overflow.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for production configuration (managed
PostgreSQL, HTTPS/HSTS, object storage, SMTP, backups, monitoring) — summary:

```bash
# VPS with Docker Compose
cp .env.example .env && vim .env        # strong secrets, ENVIRONMENT=production, SITE_URL
docker compose up -d --build
# schema migrates + seeds automatically; verify:
curl https://api.yourdomain.com/ready
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Frontend shows empty states | Backend not running / `API_INTERNAL_URL` wrong — check `curl :8000/health` |
| `401 INVALID_REFRESH_TOKEN` in admin | Cookie expired/revoked — log in again |
| `423 ACCOUNT_LOCKED` | Too many failed logins — wait `LOGIN_LOCKOUT_SECONDS` |
| `429 RATE_LIMITED` on contact | Working as intended; raise `RATE_LIMIT_CONTACT_PER_HOUR` for E2E/dev |
| Alembic "Target database is not up to date" | Run `alembic upgrade head` first |
| Port 3000/8000 in use | `docker compose down` or change ports in compose/CLI |
| `SettingsError` parsing `.env` list values | Use comma-separated values (e.g. `CORS_ORIGINS=a,b`) |
