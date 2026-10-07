"""Public API contract tests."""

from __future__ import annotations

API = "/api/v1"


def test_health(client):  # noqa: ANN001
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/ready").json() == {"status": "ready"}


def test_profile(client):  # noqa: ANN001
    d = client.get(f"{API}/profile").json()
    assert d["full_name"] == "Redwan Ahmed Khan"
    assert "Artificial Intelligence Engineer" in d["headline"]
    assert "Retrieval-Augmented Generation" in d["research_interests"]


def test_education_facts(client):  # noqa: ANN001
    items = client.get(f"{API}/education").json()["items"]
    iubat = next(i for i in items if "IUBAT" in i["institution_name"])
    assert iubat["degree"] == "Bachelor of Science"
    assert iubat["cgpa"] == 3.6 and iubat["cgpa_scale"] == 4.0
    assert iubat["graduation_date"].startswith("2022-04")
    assert iubat["start_date"] is None  # never invented


def test_experience_facts(client):  # noqa: ANN001
    items = client.get(f"{API}/experience").json()["items"]
    by_company = {i["company"]: i for i in items}
    shadhin = by_company["Shadhin Lab LLC"]
    assert shadhin["role"] == "Intern AI Engineer"
    assert shadhin["start_date"] == "2022-05-01" and shadhin["end_date"] == "2022-08-31"
    circle = by_company["CircleCI"]
    assert circle["role"] == "Remote AI Engineer" and circle["is_current"] is True
    assert circle["end_date"] is None
    assert circle["achievements_public_safe"] == []  # no fabricated claims


def test_projects_list_and_detail(client):  # noqa: ANN001
    d = client.get(f"{API}/projects").json()
    slugs = [i["slug"] for i in d["items"]]
    assert {"shopmind", "leadforge-ai", "mediflow-ai", "contentforge-ai"} <= set(slugs)
    p = client.get(f"{API}/projects/mediflow-ai").json()
    assert p["name"] == "Mediflow AI"
    # links not invented
    assert p["links"] == []


def test_project_not_found_envelope(client):  # noqa: ANN001
    r = client.get(f"{API}/projects/does-not-exist")
    assert r.status_code == 404
    body = r.json()
    assert body == {
        "success": False,
        "message": "Project not found",
        "error_code": "PROJECT_NOT_FOUND",
    }


def test_research_status_preserved(client):  # noqa: ANN001
    items = client.get(f"{API}/research").json()["items"]
    by_slug = {i["slug"]: i for i in items}
    care = by_slug["care-rag"]
    assert care["research_status"] == "Working"
    assert [a["name"] for a in care["authors"]] == ["Khan, R.A."]
    assert "Medical AI" in care["research_area"]
    arr = by_slug["supervised-ensemble-learning-cardiac-arrhythmia"]
    assert arr["research_status"] == "Under Review"
    assert [a["name"] for a in arr["authors"]] == ["Khan, R.A.", "Nishy, F.E."]
    # no invented publication metadata
    assert arr["publisher"] is None and arr["publication_year"] is None
    assert arr["links"] == []


def test_skills_categories(client):  # noqa: ANN001
    cats = client.get(f"{API}/skills").json()
    names = [c["name"] for c in cats]
    assert names == [
        "Programming Languages",
        "Databases",
        "Frameworks / Libraries",
        "AI / ML",
        "MLOps / Infrastructure",
    ]
    ai = next(c for c in cats if c["name"] == "AI / ML")
    assert {s["name"] for s in ai["skills"]} == {
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "LLMs",
        "Hugging Face",
        "LangChain",
    }


def test_social_links_exact_urls(client):  # noqa: ANN001
    items = client.get(f"{API}/social-links").json()["items"]
    urls = {i["platform"]: i["url"] for i in items}
    assert urls["linkedin"] == "https://www.linkedin.com/in/redwan-ahmed-khan-489716243/"
    assert urls["github"] == "https://github.com/redwanahmedkhan18"
    assert urls["x"] == "https://x.com/redwanahmed1810"
    assert urls["kaggle"] == "https://www.kaggle.com/redwanahamedkhan24"
    assert urls["medium"] == "https://medium.com/@redwanahmedkhan"
    assert urls["google_scholar"] == "https://scholar.google.com/citations?user=_sZ7lRoAAAAJ&hl=en"


def test_achievements(client):  # noqa: ANN001
    items = client.get(f"{API}/achievements").json()["items"]
    by_title = {i["title"]: i for i in items}
    assert by_title["IUBAT Battle of Intellects 2021"]["rank"] == "2nd Runner-up"
    assert by_title["BUP ICT Fest 2018"]["rank"] == "6th Place"
    assert by_title["JU IT Fest 2019"]["rank"] == "2nd Runner-up"
    assert by_title["JU IT Fest 2019"]["project_context"] == "Autonomous Driving System"


def test_draft_content_hidden(client):  # noqa: ANN001
    # placeholder testimonial is seeded as draft
    assert client.get(f"{API}/testimonials").json()["total"] == 0


def test_sitemap_data(client):  # noqa: ANN001
    d = client.get(f"{API}/sitemap-data").json()
    assert any(p["slug"] == "shopmind" for p in d["projects"])
    assert any(p["slug"] == "care-rag" for p in d["research"])


def test_empty_collections_have_shape(client):  # noqa: ANN001
    for path in ("/ml-projects", "/blog", "/open-source", "/certifications"):
        d = client.get(f"{API}{path}").json()
        assert d["items"] == [] and d["total"] == 0 and d["pages"] == 1
