# Deployment Guide

## 1. Production topology

```
Internet ──▶ TLS terminator (Caddy / Nginx / platform edge)
               ├── yourdomain.com          ──▶ Next.js (node .next/standalone/server.js)
               └── api.yourdomain.com      ──▶ FastAPI (uvicorn, 2+ workers)
                                                  ├── PostgreSQL 16 (managed, e.g. RDS/Neon/Supabase)
                                                  ├── Redis (optional: cache / rate-limit)
                                                  ├── Object storage (optional: S3/R2 for media & CV)
                                                  └── SMTP (contact/hire notifications)
```

Single-origin alternative: serve Next.js at the root and reverse-proxy `/api/v1` + `/media`
to FastAPI (the same shape the Next rewrites use in dev).

## 2. Environment (production)

Backend (`.env` / platform secrets):

```
ENVIRONMENT=production            # enables HSTS, secure cookies, generic 500s
SITE_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
DATABASE_URL=postgresql+psycopg://USER:PASS@HOST:5432/portfolio
SECRET_KEY=<64+ random chars>     # e.g. openssl rand -hex 32
JWT_SECRET=<64+ random chars>
ADMIN_EMAIL=…                     # real bootstrap admin
ADMIN_PASSWORD=…                  # change after first login
CORS_ORIGINS=https://yourdomain.com
SMTP_HOST=… SMTP_USERNAME=… SMTP_PASSWORD=… NOTIFY_EMAIL=…
STORAGE_BACKEND=s3 STORAGE_ENDPOINT=… STORAGE_BUCKET=… STORAGE_ACCESS_KEY=… STORAGE_SECRET_KEY=…
REDIS_URL=rediss://…              # optional
ENABLE_OPENAPI_DOCS=false         # recommended for production
```

Frontend build/runtime:

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com   # build-time: canonicals/sitemap/OG
API_INTERNAL_URL=https://api.yourdomain.com/api/v1   # server-side fetch base
BACKEND_ORIGIN=https://api.yourdomain.com            # rewrite target for browser calls
```

Generate secrets: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

## 3. Docker Compose (VPS)

```bash
git clone <repo> && cd redwan-portfolio
cp .env.example .env && vim .env          # fill everything above
docker compose up -d --build
curl http://localhost:8000/ready          # {"status":"ready"}
```

The backend entrypoint runs `alembic upgrade head` + seed automatically.
Put Caddy/Nginx in front for TLS:

```
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
api.yourdomain.com {
    encode gzip
    reverse_proxy localhost:8000
}
```

Caddy issues/renews certificates and sends HSTS-ready TLS by default; the app adds the
`Strict-Transport-Security` header itself when `ENVIRONMENT=production`.

## 4. Platform deployment (managed)

- **Frontend → Vercel**: root `frontend/`, framework Next.js, set the three env vars above.
- **Backend → Render / Fly.io / Railway**: Dockerfile `docker/backend.Dockerfile`,
  start command `sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"`.
  (Seed once manually: `python -m app.db.seed`.)
- **Database → managed PostgreSQL** (Neon/Supabase/RDS). Set `DATABASE_URL`.
- **Media → S3/R2**: set `STORAGE_BACKEND=s3` + credentials (or keep a persistent volume
  with `local`). Serve the bucket via CDN and update `storage_url` handling if the bucket
  is public-read; otherwise keep the backend `/media` mount.

## 5. Database operations

```bash
# migrate (always via Alembic)
docker compose exec backend python -m alembic upgrade head
# new migration after model changes
docker compose exec backend python -m alembic revision --autogenerate -m "…"
# backup (nightly cron recommended)
pg_dump "$DATABASE_URL" -Fc > backup-$(date +%F).dump
# restore
pg_restore -d "$DATABASE_URL" --clean backup-YYYY-MM-DD.dump
```

Backups: nightly `pg_dump` to object storage with 30-day retention + object-storage
versioning for media. Test restores quarterly.

## 6. Post-deploy checklist

- [ ] `GET /health` and `GET /ready` return ok
- [ ] Homepage shows seeded content; `/projects/shopmind` renders SSR HTML (`curl | grep ShopMind`)
- [ ] `/sitemap.xml` lists published projects/research; `/robots.txt` disallows `/admin`
- [ ] Admin login works with production credentials; default seed password changed
- [ ] HTTPS everywhere; HSTS header present on API responses
- [ ] Contact form submission lands in `/admin/messages` and triggers notification email
- [ ] CV upload → `/cv` download works; media URLs resolve through the chosen storage
- [ ] Error path: unknown project → JSON envelope `PROJECT_NOT_FOUND`, no stack trace
- [ ] Lighthouse ≥ 90s on Performance/SEO/Accessibility/Best-Practices for `/`

## 7. Monitoring & observability

- Logs: structured stdout (uvicorn + app logger). Ship to your log aggregator.
- Uptime: external check on `/ready` (backend) and `/` (frontend), 1-minute interval.
- Alerts: 5xx rate, `/ready` failures, failed-login spikes (`audit_logs.action='login_failed'`),
  disk/storage quota.
- Audit: `GET /api/v1/admin/audit-logs` (SUPER_ADMIN) records every admin mutation —
  no passwords, tokens, or private message bodies are ever logged.

## 8. Scaling notes

- FastAPI is stateless; scale horizontally (the in-process rate limiter is per-instance —
  swap in the Redis-backed limiter when running multiple replicas).
- Next.js ISR (`revalidate: 30`) keeps public pages fast while admin edits appear within
  ~30 seconds; trigger on-demand revalidation later if instant publishing is required.
- PostgreSQL connection pooling: use pgbouncer or the driver pool for many app instances.
