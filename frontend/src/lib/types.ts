/** Types mirroring the FastAPI/Pydantic contracts (single source of truth: backend). */

export type ContentStatus = "draft" | "published" | "archived";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface MediaAsset {
  id: string;
  filename: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  storage_url: string;
  kind: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  headline: string;
  tagline: string | null;
  about_short: string | null;
  about_long: string | null;
  location: string | null;
  email_public: string | null;
  photo: MediaAsset | null;
  engineering_interests: string[];
  research_interests: string[];
  technical_philosophy: string | null;
  open_to_work: boolean;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  icon: string | null;
  is_visible: boolean;
  display_order: number;
}

export interface Education {
  id: string;
  institution_name: string;
  institution_short_name: string | null;
  department: string | null;
  degree: string;
  field_of_study: string | null;
  cgpa: number | null;
  cgpa_scale: number | null;
  start_date: string | null;
  end_date: string | null;
  graduation_date: string | null;
  enrollment_status: "Currently Studying" | "Completed";
  description: string | null;
  achievements: string[];
  relevant_coursework: string[];
  institution_website: string | null;
  certificate_url: string | null;
  status: ContentStatus;
  display_order: number;
}

export interface Experience {
  id: string;
  company: string;
  company_url: string | null;
  role: string;
  employment_type: string | null;
  work_mode: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  summary: string | null;
  responsibilities: string[];
  achievements_public_safe: string[];
  highlights_markdown: string | null;
  technologies: string[];
  status: ContentStatus;
  display_order: number;
}

export interface Skill {
  id: string;
  name: string;
  icon: string | null;
  official_url: string | null;
  proficiency_label: string | null;
  years_experience: number | null;
  display_order: number;
  is_visible: boolean;
}

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  skills: Skill[];
}

export interface ProjectTechnology { id: string; name: string; display_order: number; }
export type ProjectLinkKind = "github" | "live_demo" | "documentation" | "case_study" | "video";
export interface ProjectLink { id: string; kind: ProjectLinkKind; url: string; label: string | null; }
export interface ProjectImage {
  id: string; asset_id: string | null; url: string | null;
  alt_text: string | null; caption: string | null; kind: string; display_order: number;
  asset: MediaAsset | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  long_description: string | null;
  problem: string | null;
  solution: string | null;
  role: string | null;
  project_status: string | null;
  start_date: string | null;
  end_date: string | null;
  featured: boolean;
  video_demo_url: string | null;
  key_features: string[];
  technical_challenges: string[];
  technical_decisions: string[];
  results: string | null;
  metrics_note: string | null;
  lessons_learned: string[];
  future_improvements: string[];
  technologies: ProjectTechnology[];
  links: ProjectLink[];
  images: ProjectImage[];
  status: ContentStatus;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MLProject {
  id: string;
  project_name: string;
  slug: string;
  short_description: string | null;
  dataset: string | null;
  problem_type: string | null;
  algorithm: string | null;
  technologies: string[];
  github_url: string | null;
  kaggle_notebook_url: string | null;
  live_demo_url: string | null;
  publication_url: string | null;
  results: string | null;
  metrics: Record<string, string | number> | null;
  status: ContentStatus;
  display_order: number;
}

export interface ResearchAuthor { id: string; name: string; is_self: boolean; display_order: number; }
export type ResearchLinkKind = "doi" | "paper" | "publication" | "github" | "dataset" | "code";
export interface ResearchLink { id: string; kind: ResearchLinkKind; url: string; }

export interface ResearchPaper {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  abstract: string | null;
  research_area: string[];
  research_status: "Working" | "Under Review" | "Published" | "Preprint";
  publisher: string | null;
  venue: string | null;
  publication_year: number | null;
  keywords: string[];
  featured: boolean;
  authors: ResearchAuthor[];
  links: ResearchLink[];
  status: ContentStatus;
  display_order: number;
  published_at: string | null;
}

export interface OpenSourceContribution {
  id: string;
  name: string;
  description: string | null;
  organization: string | null;
  contribution_type: string | null;
  website_url: string | null;
  github_url: string | null;
  publication_url: string | null;
  contribution_date: string | null;
  technologies: string[];
  status: ContentStatus;
  display_order: number;
}

export interface Achievement {
  id: string;
  title: string;
  kind: string;
  organization: string | null;
  year: number | null;
  rank: string | null;
  project_context: string | null;
  description: string | null;
  event_url: string | null;
  certificate_url: string | null;
  status: ContentStatus;
  display_order: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string | null;
  issued_at: string | null;
  expires_at: string | null;
  credential_url: string | null;
  credential_id: string | null;
  status: ContentStatus;
  display_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  review: string;
  rating: number | null;
  website: string | null;
  verified: boolean;
  is_placeholder: boolean;
  featured: boolean;
  status: ContentStatus;
  display_order: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_markdown: string | null;
  author_name: string;
  tags: string[];
  category: string | null;
  reading_time_minutes: number | null;
  github_url: string | null;
  references: string[];
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  status: ContentStatus;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CVVersion {
  id: string;
  label: string;
  asset: MediaAsset;
  is_current: boolean;
  status: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings { [key: string]: unknown; }

export interface SeoMeta {
  id: string;
  route: string;
  title: string | null;
  description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
}

export interface ContactMessage {
  id: string; name: string; email: string; subject: string; purpose: string;
  message: string; status: string; created_at: string;
}

export interface HireRequest {
  id: string; name: string; email: string; company: string | null; project_type: string;
  budget_range: string | null; timeline: string | null; project_description: string;
  status: string; created_at: string;
}

export interface AuditLogEntry {
  id: string; created_at: string; actor_id: string | null; action: string;
  entity_type: string; entity_id: string | null; detail: Record<string, unknown> | null;
}

export interface DashboardCounts {
  [resource: string]: { total: number; published?: number; draft?: number; archived?: number; new?: number; visible?: number };
}

export const CONTACT_PURPOSES = [
  "Job Opportunity", "Freelance Project", "Research Collaboration",
  "Speaking / Teaching", "Open Source", "General Inquiry", "Other",
] as const;

export const PROJECT_TYPES = [
  "AI Engineering", "LLM Application", "RAG System", "AI Agent", "NLP System",
  "ML System", "Backend / API", "AI Automation", "Full-stack AI App", "Other",
] as const;

export const BUDGET_RANGES = ["< $1k", "$1k – $5k", "$5k – $15k", "$15k – $50k", "$50k+", "To be discussed"] as const;
export const TIMELINES = ["ASAP", "1–2 weeks", "1 month", "2–3 months", "Flexible"] as const;
