/**
 * Admin resource registry — config-driven CRUD UI.
 * Adding a new manageable resource = adding an entry here (plus the backend registry).
 */
import type { FieldDef } from "@/components/admin/fields";

export interface AdminResourceConfig {
  key: string;             // API segment: /admin/{key}
  title: string;
  singular: string;
  publishable: boolean;
  columns: { field: string; label: string; type?: "text" | "date" | "bool" | "status" | "num" }[];
  fields: FieldDef[];
  searchable?: boolean;
}

const DISPLAY_ORDER: FieldDef = { name: "display_order", label: "Display order", type: "number", help: "Lower appears first." };

export const ADMIN_RESOURCES: Record<string, AdminResourceConfig> = {
  education: {
    key: "education", title: "Education", singular: "Education entry", publishable: true, searchable: true,
    columns: [
      { field: "institution_name", label: "Institution" },
      { field: "degree", label: "Degree" },
      { field: "graduation_date", label: "Graduation", type: "date" },
      { field: "enrollment_status", label: "Enrollment" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "institution_name", label: "Institution name", type: "text", required: true },
      { name: "institution_short_name", label: "Short name (e.g. IUBAT)", type: "text" },
      { name: "department", label: "Department", type: "text" },
      { name: "degree", label: "Degree", type: "text", required: true },
      { name: "field_of_study", label: "Field of study", type: "text" },
      { name: "cgpa", label: "CGPA", type: "float", min: 0, max: 10 },
      { name: "cgpa_scale", label: "CGPA scale", type: "float", min: 1, max: 10 },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date", help: "Must be empty while Currently Studying." },
      { name: "graduation_date", label: "Graduation date", type: "date" },
      { name: "enrollment_status", label: "Enrollment status", type: "select", options: ["Currently Studying", "Completed"], required: true },
      { name: "institution_website", label: "Institution website", type: "url" },
      { name: "certificate_url", label: "Certificate URL", type: "url" },
      { name: "institution_logo_asset_id", label: "Institution logo", type: "media" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "achievements", label: "Achievements", type: "stringlist", placeholder: "e.g. Dean's list" },
      { name: "relevant_coursework", label: "Relevant coursework", type: "stringlist", placeholder: "e.g. Algorithms" },
      DISPLAY_ORDER,
    ],
  },
  experience: {
    key: "experience", title: "Experience", singular: "Experience entry", publishable: true, searchable: true,
    columns: [
      { field: "company", label: "Company" },
      { field: "role", label: "Role" },
      { field: "start_date", label: "Start", type: "date" },
      { field: "is_current", label: "Current", type: "bool" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "company", label: "Company", type: "text", required: true },
      { name: "role", label: "Role", type: "text", required: true },
      { name: "company_url", label: "Company URL", type: "url" },
      { name: "employment_type", label: "Employment type", type: "select", options: ["Full-time", "Part-time", "Internship", "Contract", "Freelance"] },
      { name: "work_mode", label: "Work mode", type: "select", options: ["Remote", "Hybrid", "On-site"] },
      { name: "location", label: "Location", type: "text" },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date", help: "Must be empty while currently working." },
      { name: "is_current", label: "Currently working here", type: "boolean" },
      { name: "summary", label: "Short summary", type: "textarea" },
      { name: "responsibilities", label: "Responsibilities", type: "stringlist" },
      { name: "achievements_public_safe", label: "Achievements (public-safe only)", type: "stringlist", help: "Never enter confidential company metrics or proprietary details." },
      { name: "technologies", label: "Technologies", type: "stringlist" },
      { name: "highlights_markdown", label: "Technical case study (markdown)", type: "markdown" },
      DISPLAY_ORDER,
    ],
  },
  projects: {
    key: "projects", title: "Projects", singular: "Project", publishable: true, searchable: true,
    columns: [
      { field: "name", label: "Name" },
      { field: "slug", label: "Slug" },
      { field: "category", label: "Category" },
      { field: "featured", label: "Featured", type: "bool" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Project name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Auto-generated from the name when left empty. Used in /projects/{slug}." },
      { name: "category", label: "Category", type: "text", placeholder: "e.g. AI Platform, Healthcare AI" },
      { name: "project_status", label: "Project status", type: "select", options: ["Production", "In Development", "Prototype", "Completed", "Maintained", "Archived"] },
      { name: "role", label: "My role", type: "text" },
      { name: "featured", label: "Featured on homepage", type: "boolean" },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date" },
      { name: "short_description", label: "Short description", type: "textarea", rows: 3 },
      { name: "problem", label: "Problem", type: "textarea" },
      { name: "solution", label: "Solution", type: "textarea" },
      { name: "long_description", label: "Case study (markdown)", type: "markdown", help: "Full case study: context, architecture, approach, decisions, testing, deployment…" },
      { name: "key_features", label: "Key features", type: "stringlist" },
      { name: "technical_challenges", label: "Technical challenges", type: "stringlist" },
      { name: "technical_decisions", label: "Key engineering decisions", type: "stringlist" },
      { name: "results", label: "Results (qualitative unless verified)", type: "textarea", help: "Do not invent metrics — describe outcomes that are true." },
      { name: "metrics_note", label: "Metrics note", type: "text", placeholder: "Not publicly disclosed." },
      { name: "lessons_learned", label: "Lessons learned", type: "stringlist" },
      { name: "future_improvements", label: "Future improvements", type: "stringlist" },
      { name: "cover_asset_id", label: "Cover image", type: "media" },
      {
        name: "technologies", label: "Technologies", type: "children", itemLabel: "Technology",
        children: [{ name: "name", label: "Name", type: "text" }],
      },
      {
        name: "links", label: "Links (only real URLs — empty links are never rendered)", type: "children", itemLabel: "Link",
        children: [
          { name: "kind", label: "Kind", type: "select", options: ["github", "live_demo", "documentation", "case_study", "video"] },
          { name: "url", label: "URL", type: "text" },
          { name: "label", label: "Custom label (optional)", type: "text" },
        ],
      },
      {
        name: "images", label: "Images", type: "children", itemLabel: "Image",
        children: [
          { name: "kind", label: "Kind", type: "select", options: ["screenshot", "architecture_diagram", "cover"] },
          { name: "url", label: "External URL (or use Media asset)", type: "text" },
          { name: "alt_text", label: "Alt text", type: "text" },
          { name: "caption", label: "Caption", type: "text" },
        ],
      },
      DISPLAY_ORDER,
    ],
  },
  "ml-projects": {
    key: "ml-projects", title: "ML Projects", singular: "ML project", publishable: true, searchable: true,
    columns: [
      { field: "project_name", label: "Name" },
      { field: "problem_type", label: "Problem type" },
      { field: "algorithm", label: "Algorithm" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "project_name", label: "Project name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Auto-generated when empty." },
      { name: "problem_type", label: "Problem type", type: "select", options: ["Classification", "Regression", "Clustering", "NLP", "Computer Vision", "Time Series", "Recommender", "Other"] },
      { name: "algorithm", label: "Algorithm(s)", type: "text" },
      { name: "dataset", label: "Dataset", type: "text" },
      { name: "short_description", label: "Short description", type: "textarea" },
      { name: "results", label: "Results", type: "textarea" },
      { name: "metrics", label: "Metrics (JSON)", type: "json", help: 'Only enter real measured values, e.g. {"accuracy": 0.94}' },
      { name: "technologies", label: "Technologies", type: "stringlist" },
      { name: "github_url", label: "GitHub URL", type: "url" },
      { name: "kaggle_notebook_url", label: "Kaggle notebook URL", type: "url" },
      { name: "live_demo_url", label: "Live demo URL", type: "url" },
      { name: "publication_url", label: "Publication URL", type: "url" },
      DISPLAY_ORDER,
    ],
  },
  research: {
    key: "research", title: "Research", singular: "Research paper", publishable: true, searchable: true,
    columns: [
      { field: "title", label: "Title" },
      { field: "research_status", label: "Research status" },
      { field: "publication_year", label: "Year", type: "num" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "title", label: "Paper title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Auto-generated when empty." },
      { name: "research_status", label: "Research status", type: "select", options: ["Working", "Under Review", "Published", "Preprint"], required: true, help: "Preserved exactly on the public site — never implies publication by itself." },
      { name: "featured", label: "Featured on homepage", type: "boolean" },
      { name: "short_description", label: "Short description", type: "textarea" },
      { name: "abstract", label: "Abstract", type: "markdown" },
      { name: "research_area", label: "Research areas", type: "stringlist" },
      { name: "keywords", label: "Keywords", type: "stringlist" },
      { name: "venue", label: "Venue / journal", type: "text" },
      { name: "publisher", label: "Publisher", type: "text" },
      { name: "publication_year", label: "Publication year", type: "number", min: 1900, max: 2200 },
      {
        name: "authors", label: "Authors", type: "children", itemLabel: "Author",
        children: [
          { name: "name", label: "Name (e.g. Khan, R.A.)", type: "text" },
          { name: "is_self", label: "This is me", type: "boolean" },
        ],
      },
      {
        name: "links", label: "Links (DOI, paper, code…)", type: "children", itemLabel: "Link",
        children: [
          { name: "kind", label: "Kind", type: "select", options: ["doi", "paper", "publication", "github", "dataset", "code"] },
          { name: "url", label: "URL", type: "text" },
        ],
      },
      DISPLAY_ORDER,
    ],
  },
  "open-source": {
    key: "open-source", title: "Open Source", singular: "Contribution", publishable: true, searchable: true,
    columns: [
      { field: "name", label: "Name" },
      { field: "organization", label: "Organization" },
      { field: "contribution_type", label: "Type" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Contribution name", type: "text", required: true },
      { name: "organization", label: "Organization", type: "text" },
      { name: "contribution_type", label: "Contribution type", type: "select", options: ["Pull Request", "Maintainer", "Plugin", "Documentation", "Bug Fix", "Feature", "Community"] },
      { name: "contribution_date", label: "Date", type: "date" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "website_url", label: "Project / publication website", type: "url", help: "Used when a visitor clicks the contribution name." },
      { name: "github_url", label: "GitHub URL", type: "url" },
      { name: "publication_url", label: "Publication URL", type: "url" },
      { name: "technologies", label: "Technologies", type: "stringlist" },
      DISPLAY_ORDER,
    ],
  },
  achievements: {
    key: "achievements", title: "Achievements", singular: "Achievement", publishable: true, searchable: true,
    columns: [
      { field: "title", label: "Title" },
      { field: "organization", label: "Organization" },
      { field: "year", label: "Year", type: "num" },
      { field: "rank", label: "Rank" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "kind", label: "Kind", type: "select", options: ["competition", "award", "certification-milestone"] },
      { name: "organization", label: "Organization / event host", type: "text" },
      { name: "year", label: "Year", type: "number", min: 1950, max: 2200 },
      { name: "rank", label: "Rank / result", type: "text", placeholder: "e.g. 2nd Runner-up" },
      { name: "project_context", label: "Project context", type: "text", placeholder: "e.g. Autonomous Driving System" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "event_url", label: "Event URL", type: "url" },
      { name: "certificate_url", label: "Certificate URL", type: "url" },
      { name: "image_asset_id", label: "Image / certificate scan", type: "media" },
      DISPLAY_ORDER,
    ],
  },
  certifications: {
    key: "certifications", title: "Certifications", singular: "Certification", publishable: true, searchable: true,
    columns: [
      { field: "name", label: "Name" },
      { field: "issuer", label: "Issuer" },
      { field: "issued_at", label: "Issued", type: "date" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Certification name", type: "text", required: true },
      { name: "issuer", label: "Issuer", type: "text" },
      { name: "issued_at", label: "Issued at", type: "date" },
      { name: "expires_at", label: "Expires at", type: "date" },
      { name: "credential_id", label: "Credential ID", type: "text" },
      { name: "credential_url", label: "Credential URL", type: "url" },
      DISPLAY_ORDER,
    ],
  },
  testimonials: {
    key: "testimonials", title: "Testimonials", singular: "Testimonial", publishable: true, searchable: true,
    columns: [
      { field: "name", label: "Name" },
      { field: "company", label: "Company" },
      { field: "verified", label: "Verified", type: "bool" },
      { field: "is_placeholder", label: "Placeholder", type: "bool" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, help: "Never attribute a testimonial to a real person without their consent." },
      { name: "role", label: "Role", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "review", label: "Review", type: "textarea", required: true, rows: 5 },
      { name: "rating", label: "Rating (1–5, optional)", type: "number", min: 1, max: 5 },
      { name: "website", label: "Website", type: "url" },
      { name: "avatar_asset_id", label: "Avatar", type: "media" },
      { name: "verified", label: "Verified by admin", type: "boolean" },
      { name: "is_placeholder", label: "This is placeholder/demo content", type: "boolean", help: "Placeholders are labeled publicly." },
      { name: "featured", label: "Featured on homepage", type: "boolean" },
      DISPLAY_ORDER,
    ],
  },
  blog: {
    key: "blog", title: "Blog", singular: "Post", publishable: true, searchable: true,
    columns: [
      { field: "title", label: "Title" },
      { field: "category", label: "Category" },
      { field: "published_at", label: "Published", type: "date" },
      { field: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Auto-generated when empty." },
      { name: "category", label: "Category", type: "select", options: ["AI", "Machine Learning", "NLP", "LLM", "RAG", "Software Engineering", "Python", "Backend Engineering", "Research", "MLOps"] },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "content_markdown", label: "Content (markdown / MDX-style)", type: "markdown", rows: 20 },
      { name: "author_name", label: "Author", type: "text" },
      { name: "reading_time_minutes", label: "Reading time (min)", type: "number", min: 1 },
      { name: "tags", label: "Tags", type: "stringlist" },
      { name: "references", label: "References (URLs or citations)", type: "stringlist" },
      { name: "github_url", label: "Related GitHub URL", type: "url" },
      { name: "cover_asset_id", label: "Cover image", type: "media" },
      { name: "featured", label: "Featured on homepage", type: "boolean" },
      { name: "seo_title", label: "SEO title override", type: "text" },
      { name: "seo_description", label: "SEO description override", type: "textarea", rows: 2 },
      { name: "canonical_url", label: "Canonical URL (if cross-posted)", type: "url" },
      DISPLAY_ORDER,
    ],
  },
  skills: {
    key: "skills", title: "Skills", singular: "Skill", publishable: false, searchable: true,
    columns: [
      { field: "name", label: "Skill" },
      { field: "proficiency_label", label: "Proficiency" },
      { field: "years_experience", label: "Years", type: "num" },
      { field: "is_visible", label: "Visible", type: "bool" },
    ],
    fields: [
      { name: "name", label: "Skill name", type: "text", required: true },
      { name: "category_id", label: "Category", type: "resource-select", resourceKey: "skill-categories", resourceLabelField: "name", required: true },
      { name: "proficiency_label", label: "Proficiency label", type: "select", options: ["Familiar", "Proficient", "Advanced", "Daily driver"], help: "Optional — no arbitrary percentage bars." },
      { name: "years_experience", label: "Years of experience", type: "float", min: 0, max: 60 },
      { name: "official_url", label: "Official URL", type: "url" },
      { name: "icon", label: "Icon key (optional)", type: "text" },
      { name: "is_visible", label: "Visible on site", type: "boolean" },
      DISPLAY_ORDER,
    ],
  },
  "skill-categories": {
    key: "skill-categories", title: "Skill Categories", singular: "Category", publishable: false, searchable: true,
    columns: [
      { field: "name", label: "Name" },
      { field: "slug", label: "Slug" },
      { field: "display_order", label: "Order", type: "num" },
    ],
    fields: [
      { name: "name", label: "Category name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Auto-generated when empty." },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      DISPLAY_ORDER,
    ],
  },
  "social-links": {
    key: "social-links", title: "Social Links", singular: "Social link", publishable: false, searchable: true,
    columns: [
      { field: "platform", label: "Platform" },
      { field: "url", label: "URL" },
      { field: "is_visible", label: "Visible", type: "bool" },
      { field: "display_order", label: "Order", type: "num" },
    ],
    fields: [
      { name: "platform", label: "Platform key", type: "text", required: true, placeholder: "linkedin, github, x, kaggle…" },
      { name: "url", label: "URL", type: "url", required: true },
      { name: "label", label: "Display label", type: "text" },
      { name: "icon", label: "Icon key (optional)", type: "text" },
      { name: "is_visible", label: "Visible on site", type: "boolean" },
      DISPLAY_ORDER,
    ],
  },
};

export function getResource(key: string): AdminResourceConfig {
  const config = ADMIN_RESOURCES[key];
  if (!config) throw new Error(`Unknown admin resource: ${key}`);
  return config;
}
