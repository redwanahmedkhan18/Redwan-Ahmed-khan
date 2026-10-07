# System Architecture — Redwan Ahmed Khan Portfolio Platform

> Stack: **Next.js 16.3.6** (App Router, SSR/RSC, TypeScript, Tailwind) + **FastAPI 0.141.1** (Python 3.12+, SQLAlchemy 2.x, Pydantic v2, Alembic, JWT) + **PostgreSQL** (SQLite fallback for local dev) + optional **Redis**.

## 1. High-Level Architecture

```
┌─────────────┐   HTTPS    ┌──────────────────────┐   SQL    ┌────────────┐
│   Browser    │──────────▶│  Next.js 16 (SSR/RSC) │─────────▶│ PostgreSQL │
└─────────────┘            │  public site + admin  │          └────────────┘
                           └──────────┬───────────┘                 ▲
                                      │ /api/v1 (proxied via        │
                                      │ next.config rewrites)       │
                           ┌──────────▼───────────┐                 │
                           │  FastAPI 0.141.1      │────────────────┘
                           │  public + admin API   │
                           │  JWT auth, RBAC       │──▶ Redis (cache/rate-limit, optional)
                           │  media storage        │──▶ Object storage / local disk
                           └──────────────────────┘──▶ SMTP (contact/hire notifications)
```

- The **browser never talks to the backend origin directly** in dev: Next.js `rewrites` proxy `/api/v1/*` to FastAPI. Server Components fetch via an internal `API_INTERNAL_URL`.
- Public content is rendered **server-side** (RSC) with graceful loading/empty/error states; only interactive pieces (forms, admin CRUD UI, theme toggle, mobile nav) are hydrated Client Components.
- All professional content lives in the database; the frontend hardcodes only UI labels, navigation and design config.

## 2. Backend Layering

```
api/ (routers, HTTP concerns only)
  └─▶ services/ (business rules: publishing workflow, auth, notifications)
        └─▶ repositories/ (data access, queries, pagination, ordering)
              └─▶ models/ (SQLAlchemy 2.x declarative models)
schemas/  Pydantic v2 request/response contracts (shared by api + services)
auth/     JWT issue/verify, Argon2id hashing, refresh-token cookie handling
core/     config, security, errors (consistent envelope), logging
middleware/ security headers, CORS, rate limiting, audit context
```

Route handlers contain **no business logic** — they delegate to services, which delegate to repositories.

## 3. Database ERD (core entities)

```
users ──< audit_logs            users.role ∈ {SUPER_ADMIN, EDITOR}
profile (1)                     social_links (n)
skill_categories 1──n skills
education (n)                   work_experience (n)
projects 1──n project_links     projects n──n technologies (project_technologies)
projects 1──n project_images    projects 1──n ml_note (via kind flag)
research_papers 1──n research_authors   research_papers 1──n research_links
open_source_contributions (n)   achievements (n)   certifications (n)
testimonials (n)                blog_posts (n)
contact_messages (n)            hire_requests (n)
site_settings (kv)              seo_metadata (per-route)
media_assets (n)                cv_versions (n, one is_current)
```

Every content entity carries: `id (UUID)`, `created_at`, `updated_at`, `published_at`, `status ∈ {draft, published, archived}`, `display_order` where applicable. Constraints: unique slugs, FK cascades, indexes on `status`, `slug`, `display_order`.

## 4. API Architecture

Public (read-only, published content only):

```
GET /api/v1/profile  /education  /experience  /projects  /projects/{slug}
GET /api/v1/ml-projects  /research  /research/{slug}  /open-source  /skills
GET /api/v1/achievements  /testimonials  /blog  /blog/{slug}  /social-links
GET /api/v1/site-settings  /cv/current
POST /api/v1/contact  /hire-requests        (rate-limited, validated)
GET /health  /ready
```

Admin (JWT bearer + RBAC), uniform CRUD per resource:

```
POST   /api/v1/admin/{resource}
GET    /api/v1/admin/{resource}?page=&page_size=&status=&q=&sort=
GET    /api/v1/admin/{resource}/{id}
PATCH  /api/v1/admin/{resource}/{id}
DELETE /api/v1/admin/{resource}/{id}
POST   /api/v1/admin/{resource}/{id}/publish | /unpublish | /archive
POST   /api/v1/admin/{resource}/reorder
```

Auth: `POST /api/v1/admin/auth/login` (access token in body, refresh token in HTTP-only SameSite cookie), `POST .../refresh`, `POST .../logout`, `GET .../me`.

Consistent error envelope:

```json
{ "success": false, "message": "Project not found", "error_code": "PROJECT_NOT_FOUND" }
```

## 5. Frontend Route Architecture (public)

```
/                       curated homepage (snapshot → featured projects → experience →
                        research → skills → achievements → open source → testimonials →
                        writing → contact CTA)
/about  /experience  /projects  /projects/[slug]  /machine-learning
/research  /research/[slug]  /open-source  /achievements  /testimonials
/blog  /blog/[slug]  /contact  /hire-me  /cv
not-found (404)   sitemap.ts   robots.ts   manifest.ts
```

## 6. Admin Route Architecture

```
/admin/login
/admin/dashboard          counts: published vs draft, recent messages/updates
/admin/profile  /education  /experience  /projects  /research  /ml-projects
/admin/open-source  /skills  /achievements  /testimonials  /blog  /certifications
/admin/media  /messages  /hire-requests  /cv  /settings  /seo
```

The admin is a single generic, config-driven CRUD UI (resource registry → list/table, editor form, publish workflow, drag-free explicit reorder) hydrated only inside `/admin`.

## 7. Auth / Authz Architecture

- Argon2id password hashing; login rate limiting + failed-attempt lockout counter.
- Short-lived **access token** (JWT, in-memory on client) + long-lived **refresh token** (opaque, hashed at rest, HTTP-only Secure SameSite=Lax cookie, rotation on refresh, reuse detection).
- RBAC: `SUPER_ADMIN` (everything incl. users/settings/destructive ops), `EDITOR` (content CRUD, no user management).
- Audit log: every admin mutation writes `audit_logs` (actor, action, entity, entity_id, timestamp). No passwords/secrets/message bodies logged.

## 8. Deployment Architecture

```
docker-compose: frontend (Next standalone) | backend (uvicorn) | postgres:16 | redis:7
Prod: reverse proxy (Nginx/Caddy or platform edge) → TLS/HSTS → Next.js + FastAPI
      managed PostgreSQL, object storage for media/CV, SMTP for notifications
Migrations: alembic upgrade head in backend entrypoint (never manual schema edits)
Backups: nightly pg_dump + object storage versioning (documented in docs/DEPLOYMENT.md)
```

## 9. Testing Strategy

- **Backend**: pytest — unit (security, slugs, services), API (public contracts, admin CRUD, auth 401/403, validation 422, rate-limit on contact), DB (constraints, publishing workflow).
- **Frontend**: `tsc --noEmit` + ESLint + Playwright E2E (homepage render, project/research navigation, contact form validation, CV download link, admin login + CRUD smoke, 404).
- **CI**: lint → typecheck → unit/integration → E2E → build → security audit → deploy (blocked on failures).

## 10. Implementation Plan (phases)

1. Foundation — repo, Docker, env, design system tokens ✔
2. Database — models, Alembic migration, seed with *provided factual data only* ✔
3. API — public + admin + auth + validation + error envelope ✔
4. Admin CMS — login, dashboard, generic CRUD, media, CV, publish workflow ✔
5. Public site — all routes, states, dark/light/system ✔
6. Advanced content — case studies, research detail, blog, testimonials ✔
7. SEO — metadata, JSON-LD, sitemap, robots, canonicals ✔
8. Quality — a11y, perf, security headers, tests ✔
9. Deployment — compose, CI/CD, docs ✔
