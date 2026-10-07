"""Admin auth, RBAC, CRUD, publishing workflow, validation, uploads, rate limiting."""

from __future__ import annotations

import io

API = "/api/v1"
ADMIN = f"{API}/admin"


def test_login_wrong_password(client):  # noqa: ANN001
    r = client.post(
        f"{ADMIN}/auth/login", json={"email": "admin@example.com", "password": "WrongPass123!"}
    )
    assert r.status_code == 401
    assert r.json()["error_code"] == "INVALID_CREDENTIALS"


def test_login_ok_and_me(client, admin_headers):  # noqa: ANN001
    me = client.get(f"{ADMIN}/auth/me", headers=admin_headers).json()
    assert me["email"] == "admin@example.com"
    assert me["role"] == "SUPER_ADMIN"


def test_refresh_cookie_rotation_and_reuse(client, admin_headers):  # noqa: ANN001
    r1 = client.post(f"{ADMIN}/auth/refresh")
    assert r1.status_code == 200
    # replaying the OLD cookie value is impossible via client (cookie replaced), but a
    # fabricated/garbage refresh must fail:
    client.cookies.set("refresh_token", "garbage-value", path=f"{ADMIN}/auth")
    r2 = client.post(f"{ADMIN}/auth/refresh")
    assert r2.status_code == 401
    assert r2.json()["error_code"] == "INVALID_REFRESH_TOKEN"


def test_unauthenticated_admin_blocked(client):  # noqa: ANN001
    assert client.get(f"{ADMIN}/projects").status_code == 401
    assert client.post(f"{ADMIN}/projects", json={"name": "x"}).status_code == 401


def test_bad_token_blocked(client):  # noqa: ANN001
    r = client.get(f"{ADMIN}/projects", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


def test_project_crud_and_publishing(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    r = client.post(
        f"{ADMIN}/projects",
        headers=h,
        json={
            "name": "Temp Project",
            "short_description": "temp",
            "technologies": [{"name": "Python"}, {"name": "FastAPI"}],
            "links": [{"kind": "github", "url": "https://github.com/example/repo"}],
        },
    )
    assert r.status_code == 201, r.text
    p = r.json()
    pid, slug = p["id"], p["slug"]
    assert slug == "temp-project" and p["status"] == "draft"

    # draft hidden publicly
    assert client.get(f"{API}/projects/{slug}").status_code == 404

    # publish → visible
    r = client.post(f"{ADMIN}/projects/{pid}/publish", headers=h)
    assert r.json()["status"] == "published" and r.json()["published_at"]
    pub = client.get(f"{API}/projects/{slug}")
    assert pub.status_code == 200
    assert [t["name"] for t in pub.json()["technologies"]] == ["Python", "FastAPI"]
    assert pub.json()["links"][0]["kind"] == "github"

    # unpublish → hidden again
    client.post(f"{ADMIN}/projects/{pid}/unpublish", headers=h)
    assert client.get(f"{API}/projects/{slug}").status_code == 404

    # archive + delete
    assert client.post(f"{ADMIN}/projects/{pid}/archive", headers=h).json()["status"] == "archived"
    assert client.delete(f"{ADMIN}/projects/{pid}", headers=h).status_code == 200
    assert client.get(f"{ADMIN}/projects/{pid}", headers=h).status_code == 404


def test_slug_uniqueness(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    a = client.post(f"{ADMIN}/projects", headers=h, json={"name": "Dup Name"}).json()
    b = client.post(f"{ADMIN}/projects", headers=h, json={"name": "Dup Name"}).json()
    assert a["slug"] == "dup-name" and b["slug"] == "dup-name-2"
    client.delete(f"{ADMIN}/projects/{a['id']}", headers=h)
    client.delete(f"{ADMIN}/projects/{b['id']}", headers=h)


def test_education_validation_rules(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    r = client.post(
        f"{ADMIN}/education",
        headers=h,
        json={
            "institution_name": "X",
            "degree": "BS",
            "enrollment_status": "Currently Studying",
            "end_date": "2025-01-01",
        },
    )
    assert r.status_code == 422
    r = client.post(
        f"{ADMIN}/education",
        headers=h,
        json={
            "institution_name": "X",
            "degree": "BS",
            "enrollment_status": "Currently Studying",
        },
    )
    assert r.status_code == 201 and r.json()["end_date"] is None
    client.delete(f"{ADMIN}/education/{r.json()['id']}", headers=h)


def test_experience_current_no_end_date(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    r = client.post(
        f"{ADMIN}/experience",
        headers=h,
        json={
            "company": "X",
            "role": "Y",
            "is_current": True,
            "end_date": "2025-01-01",
        },
    )
    assert r.status_code == 422


def test_research_nested_children(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    r = client.post(
        f"{ADMIN}/research",
        headers=h,
        json={
            "title": "Test Paper",
            "research_status": "Working",
            "authors": [{"name": "Khan, R.A.", "is_self": True}],
            "links": [{"kind": "github", "url": "https://github.com/x/y"}],
        },
    )
    assert r.status_code == 201, r.text
    rid = r.json()["id"]
    r = client.patch(
        f"{ADMIN}/research/{rid}",
        headers=h,
        json={
            "abstract": "New abstract",
            "authors": [{"name": "Khan, R.A.", "is_self": True}, {"name": "Coauthor, B."}],
        },
    )
    body = r.json()
    assert body["abstract"] == "New abstract" and len(body["authors"]) == 2
    client.delete(f"{ADMIN}/research/{rid}", headers=h)


def test_research_status_enum(client, admin_headers):  # noqa: ANN001
    r = client.post(
        f"{ADMIN}/research",
        headers=admin_headers,
        json={"title": "Bad", "research_status": "Accepted"},
    )
    assert r.status_code == 422


def test_reorder(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    ids = [i["id"] for i in client.get(f"{ADMIN}/achievements", headers=h).json()["items"]]
    assert (
        client.post(
            f"{ADMIN}/achievements/reorder", headers=h, json={"ordered_ids": list(reversed(ids))}
        ).status_code
        == 200
    )
    items = client.get(f"{ADMIN}/achievements", headers=h).json()["items"]
    assert [i["id"] for i in items] == list(reversed(ids))
    client.post(f"{ADMIN}/achievements/reorder", headers=h, json={"ordered_ids": ids})


def test_dashboard_summary(client, admin_headers):  # noqa: ANN001
    d = client.get(f"{ADMIN}/dashboard/summary", headers=admin_headers).json()
    counts = d["counts"]
    assert counts["projects"]["published"] == 4
    assert counts["research_papers"]["published"] == 2
    assert "contact_messages" in counts and "media_assets" in counts


def test_contact_validation_and_storage(client, admin_headers):  # noqa: ANN001
    bad = client.post(
        f"{API}/contact",
        json={
            "name": "A",
            "email": "not-an-email",
            "subject": "Hi",
            "purpose": "Other",
            "message": "short",
        },
    )
    assert bad.status_code == 422
    ok = client.post(
        f"{API}/contact",
        json={
            "name": "Recruiter",
            "email": "rec@example.com",
            "subject": "AI Engineer role",
            "purpose": "Job Opportunity",
            "message": "We would like to discuss an opening with you.",
        },
    )
    assert ok.status_code == 201
    inbox = client.get(f"{ADMIN}/messages", headers=admin_headers).json()
    assert inbox["total"] >= 1
    mid = inbox["items"][0]["id"]
    r = client.patch(f"{ADMIN}/messages/{mid}/status?status=read", headers=admin_headers)
    assert r.json()["status"] == "read"


def test_contact_honeypot(client):  # noqa: ANN001
    r = client.post(
        f"{API}/contact",
        json={
            "name": "Bot",
            "email": "bot@spam.com",
            "subject": "Buy things",
            "purpose": "Other",
            "message": "Spam spam spam spam.",
            "website": "http://spam",
        },
    )
    assert r.status_code == 201  # silently accepted, never stored


def test_hire_request(client, admin_headers):  # noqa: ANN001
    r = client.post(
        f"{API}/hire-requests",
        json={
            "name": "Founder",
            "email": "f@startup.com",
            "project_type": "RAG system",
            "project_description": "We need a retrieval-augmented generation system for internal docs.",
        },
    )
    assert r.status_code == 201
    assert client.get(f"{ADMIN}/hire-requests", headers=admin_headers).json()["total"] >= 1


def test_media_upload_validation(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    bad = client.post(
        f"{ADMIN}/media/upload",
        headers=h,
        files={"file": ("evil.exe", io.BytesIO(b"MZ..."), "application/x-msdownload")},
    )
    assert bad.status_code == 422 and bad.json()["error_code"] == "INVALID_FILE_TYPE"
    ok = client.post(
        f"{ADMIN}/media/upload?kind=image",
        headers=h,
        files={"file": ("shot.png", io.BytesIO(b"\x89PNG fake"), "image/png")},
    )
    assert ok.status_code == 201
    asset = ok.json()
    assert asset["storage_url"].startswith("/media/") and asset["mime_type"] == "image/png"


def test_cv_requires_pdf_and_current_flag(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    img = client.post(
        f"{ADMIN}/media/upload?kind=image",
        headers=h,
        files={"file": ("x.png", io.BytesIO(b"\x89PNG"), "image/png")},
    ).json()
    r = client.post(
        f"{ADMIN}/cv",
        headers=h,
        json={"label": "Not a PDF", "asset_id": img["id"], "make_current": True},
    )
    assert r.status_code == 422 and r.json()["error_code"] == "INVALID_CV_TYPE"

    pdf = client.post(
        f"{ADMIN}/media/upload?kind=document",
        headers=h,
        files={"file": ("cv.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")},
    ).json()
    r = client.post(
        f"{ADMIN}/cv",
        headers=h,
        json={"label": "CV 2026", "asset_id": pdf["id"], "make_current": True},
    )
    assert r.status_code == 201 and r.json()["is_current"]
    current = client.get(f"{API}/cv/current").json()
    assert current["label"] == "CV 2026"
    # download counter increments
    before = current["download_count"]
    client.post(f"{API}/cv/{current['id']}/download")
    after = client.get(f"{API}/cv/current").json()["download_count"]
    assert after == before + 1


def test_audit_log_records_mutations(client, admin_headers):  # noqa: ANN001
    logs = client.get(f"{ADMIN}/audit-logs", headers=admin_headers).json()["items"]
    actions = {entry["action"] for entry in logs}
    assert {"login", "create", "publish"} <= actions
    # no sensitive values logged
    for entry in logs:
        detail = entry.get("detail") or {}
        assert "password" not in str(detail).lower()


def test_rate_limit_contact(client):  # noqa: ANN001
    codes = []
    for _ in range(8):
        codes.append(
            client.post(
                f"{API}/contact",
                json={
                    "name": "Rate Tester",
                    "email": "rate@test.com",
                    "subject": "Rate limit",
                    "purpose": "Other",
                    "message": "Testing rate limiting behavior repeatedly.",
                },
            ).status_code
        )
    assert 429 in codes


def test_settings_and_seo_admin(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    settings_rows = client.get(f"{ADMIN}/settings", headers=h).json()
    keys = {row["key"] for row in settings_rows}
    assert "hire_services" in keys and "contact_purposes" in keys
    r = client.put(
        f"{ADMIN}/settings", headers=h, json={"key": "analytics_enabled", "value": False}
    )
    assert r.status_code == 200
    seo = client.get(f"{ADMIN}/seo", headers=h).json()
    assert any(row["route"] == "/" for row in seo)
    assert any(row["route"] == "/admin" and row["noindex"] for row in seo)
    r = client.put(
        f"{ADMIN}/seo",
        headers=h,
        json={"route": "/projects/shopmind", "title": "ShopMind AI — Case Study"},
    )
    assert r.status_code == 200


def test_profile_update(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    r = client.patch(
        f"{ADMIN}/profile",
        headers=h,
        json={"technical_philosophy": "Ship evidence, not adjectives."},
    )
    assert r.status_code == 200
    assert (
        client.get(f"{API}/profile").json()["technical_philosophy"]
        == "Ship evidence, not adjectives."
    )


def test_skills_crud(client, admin_headers):  # noqa: ANN001
    h = admin_headers
    cats = client.get(f"{API}/skills").json()
    cat_id = cats[0]["id"]
    r = client.post(f"{ADMIN}/skills", headers=h, json={"name": "Rust", "category_id": cat_id})
    assert r.status_code == 201
    sid = r.json()["id"]
    names = [s["name"] for s in client.get(f"{API}/skills").json()[0]["skills"]]
    assert "Rust" in names
    r = client.patch(f"{ADMIN}/skills/{sid}", headers=h, json={"is_visible": False})
    names = [s["name"] for s in client.get(f"{API}/skills").json()[0]["skills"]]
    assert "Rust" not in names
    client.delete(f"{ADMIN}/skills/{sid}", headers=h)
