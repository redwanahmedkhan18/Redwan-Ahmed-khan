/**
 * Data-access layer.
 *
 * - Server Components fetch the backend directly via API_INTERNAL_URL (never localhost
 *   from the browser) with short revalidation so admin edits appear quickly.
 * - Client components use the relative /api/v1 path (Next rewrites proxy it).
 */

import type {
  Achievement, BlogPost, Certification, CVVersion, Education, Experience, MLProject,
  OpenSourceContribution, Page, Profile, Project, ResearchPaper, SeoMeta, SiteSettings,
  SkillCategory, SocialLink, Testimonial,
} from "./types";

const SERVER_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8000/api/v1";
export const CLIENT_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(public status: number, public errorCode: string, message: string) {
    super(message);
  }
}

interface FetchOpts {
  base?: string;
  token?: string | null;
  revalidate?: number | false;
  method?: string;
  body?: unknown;
}

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { base = SERVER_BASE, token, revalidate = 30, method = "GET", body } = opts;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let errorCode = "HTTP_ERROR";
    try {
      const err = await res.json();
      message = err.message ?? message;
      errorCode = err.error_code ?? errorCode;
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, errorCode, message);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Public data (server-side)                                           */
/* ------------------------------------------------------------------ */

export const getProfile = () => request<Profile>("/profile").catch(() => null);
export const getSocialLinks = () =>
  request<Page<SocialLink>>("/social-links?page_size=50").then((p) => p.items).catch(() => [] as SocialLink[]);
export const getEducation = () =>
  request<Page<Education>>("/education").then((p) => p.items).catch(() => [] as Education[]);
export const getExperience = () =>
  request<Page<Experience>>("/experience").then((p) => p.items).catch(() => [] as Experience[]);
export const getProjects = () =>
  request<Page<Project>>("/projects").then((p) => p.items).catch(() => [] as Project[]);
export const getProject = (slug: string) => request<Project>(`/projects/${encodeURIComponent(slug)}`);
export const getMLProjects = () =>
  request<Page<MLProject>>("/ml-projects").then((p) => p.items).catch(() => [] as MLProject[]);
export const getResearch = () =>
  request<Page<ResearchPaper>>("/research").then((p) => p.items).catch(() => [] as ResearchPaper[]);
export const getResearchPaper = (slug: string) =>
  request<ResearchPaper>(`/research/${encodeURIComponent(slug)}`);
export const getOpenSource = () =>
  request<Page<OpenSourceContribution>>("/open-source").then((p) => p.items).catch(() => [] as OpenSourceContribution[]);
export const getSkills = () => request<SkillCategory[]>("/skills").catch(() => [] as SkillCategory[]);
export const getAchievements = () =>
  request<Page<Achievement>>("/achievements").then((p) => p.items).catch(() => [] as Achievement[]);
export const getCertifications = () =>
  request<Page<Certification>>("/certifications").then((p) => p.items).catch(() => [] as Certification[]);
export const getTestimonials = () =>
  request<Page<Testimonial>>("/testimonials").then((p) => p.items).catch(() => [] as Testimonial[]);
export const getBlogPosts = () =>
  request<Page<BlogPost>>("/blog").then((p) => p.items).catch(() => [] as BlogPost[]);
export const getBlogPost = (slug: string) => request<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
export const getCurrentCV = () => request<CVVersion | null>("/cv/current").catch(() => null);
export const getSiteSettings = (): Promise<SiteSettings> => request<SiteSettings>("/site-settings").catch((): SiteSettings => ({}));
export const getSeoOverrides = () => request<SeoMeta[]>("/seo").catch(() => [] as SeoMeta[]);

export interface SitemapData {
  projects: { slug: string; lastmod: string }[];
  research: { slug: string; lastmod: string }[];
  blog: { slug: string; lastmod: string }[];
  ml_projects: { slug: string; lastmod: string }[];
}
export const getSitemapData = () => request<SitemapData>("/sitemap-data").catch(() => ({
  projects: [], research: [], blog: [], ml_projects: [],
}));

/* ------------------------------------------------------------------ */
/* Admin data (client-side via proxied /api/v1)                        */
/* ------------------------------------------------------------------ */

export function adminFetch<T>(path: string, opts: Omit<FetchOpts, "base"> = {}): Promise<T> {
  return request<T>(path, { ...opts, base: CLIENT_BASE, revalidate: false });
}

export async function registerCVDownload(cvId: string): Promise<void> {
  try {
    await request(`/cv/${cvId}/download`, { base: CLIENT_BASE, method: "POST", revalidate: false });
  } catch { /* analytics are best-effort */ }
}
