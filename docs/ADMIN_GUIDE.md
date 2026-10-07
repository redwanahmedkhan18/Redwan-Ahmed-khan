# Admin CMS Guide

Sign in at **/admin/login** with the seeded super-admin (change the password immediately).

## Roles

| Role | Can do |
|---|---|
| `SUPER_ADMIN` | Everything: content CRUD, publishing, media/CV, settings, SEO, delete operations, audit log |
| `EDITOR` | Content CRUD + publishing + media uploads + inbox; no settings/SEO writes, no destructive deletes |

Sessions: access token (30 min, in-memory) + rotating HTTP-only refresh cookie (14 days).
Repeated failed logins temporarily lock the account (8 attempts → 5 min).

## Publishing workflow (every content type)

```
Draft ──Publish──▶ Published (visible on the public site, included in sitemap)
  ▲                    │
  └─────Unpublish──────┘
Published/Draft ──Archive──▶ Archived (hidden, kept for history)
```

- New entries are always created as **drafts** — nothing appears publicly until you Publish.
- **Preview before publishing**: drafts are reachable in the admin editor; the public site
  shows only published items (404 for drafts), so review the editor state, then publish.
- **Reorder**: ▲/▼ in any list writes explicit `display_order` (the homepage uses
  `featured` + `display_order`, never "everything in the DB").

## Page-by-page

- **Dashboard** — real counts (published/draft/new per resource), recent messages,
  hire requests and audit trail. No decorative fake analytics.
- **Profile** — hero headline/tagline, about (short + long markdown), location, public email
  (optional — never expose a private address), photo, engineering/research interests
  (all labels editable), technical philosophy, "open to opportunities" toggle.
- **Education** — institution, degree, CGPA/scale, dates, enrollment status.
  Enforced rules: *Currently Studying ⇒ end date must be empty*; *Completed with end date ⇒
  graduation date required*. Start date: only enter the real one — nothing is inferred.
- **Experience** — company, role, mode, dates, *currently working* toggle (forces empty end
  date), summary, responsibilities, technologies, and a markdown "technical case study" body.
  **Achievements field is for public-safe, explicitly approved statements only** — never
  confidential metrics, customers or internal architecture.
- **Projects** — full case-study model: problem/solution, long description (markdown),
  features, challenges, decisions, results (+ "Not publicly disclosed." metrics note),
  lessons, future work, technologies, links (GitHub/demo/docs — buttons render **only** when a
  URL exists), images (screenshots/cover/architecture diagram from the media library).
- **ML Projects** — dataset, problem type, algorithm, notebooks (Kaggle/GitHub/demo),
  results, metrics JSON (enter only real measured values).
- **Research** — title, authors (mark "this is me"), research status
  (`Working / Under Review / Published / Preprint` — shown verbatim on the site; publication
  metadata (DOI/venue/year) only when it genuinely exists), abstract, areas, keywords, links.
- **Open Source** — name (links to the project/publication website), organization,
  contribution type/date, description, GitHub, technologies.
- **Skills / Skill Categories** — categorized tags. No percentage bars by design; optional
  proficiency *labels* and years-of-experience only when meaningful.
- **Achievements / Certifications** — competitions, ranks, project context, event/certificate URLs.
- **Testimonials** — `verified` flag (admin-checked) and `is_placeholder` flag (publicly
  labeled). Never attribute demo content to real people/companies. Homepage shows
  verified/featured only.
- **Blog** — markdown posts with category/tags, reading time, references, cover image,
  per-post SEO title/description/canonical overrides.
- **Media** — upload images/PDFs (type + 10 MB size validated), edit alt text (accessibility
  requirement) and captions. Used by projects, profile, education logos, blog covers, CV.
- **CV** — upload PDF in Media → create CV version → *make current*. Previous versions are
  archived automatically; the public **Download CV** button always serves the current one.
  Download counts are aggregate-only.
- **Messages / Hire Requests** — inbox with new/read/archived states and mailto reply links.
- **Settings** — JSON key/value consumed by the frontend: `hire_services`, `contact_purposes`,
  `hero_ctas`, `analytics_enabled` (add your own keys freely).
- **SEO** — per-route title/description/OG-image/canonical overrides + `noindex`
  (`/admin` is pre-set noindex; robots.txt also blocks it).

## Public-site reflection time

Public pages revalidate every ~30 s (ISR). After publishing, refresh within a minute;
hard-reload (`Ctrl+Shift+R`) if a CDN is in front.
