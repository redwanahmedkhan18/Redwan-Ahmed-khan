import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "", "/about", "/experience", "/projects", "/machine-learning", "/research",
  "/open-source", "/achievements", "/testimonials", "/blog", "/contact", "/hire-me", "/cv",
];

/**
 * Dynamic sitemap — includes published projects/research/blog only.
 * /admin and form submissions are never indexed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  for (const p of data.projects) {
    entries.push({ url: `${SITE_URL}/projects/${p.slug}`, lastModified: new Date(p.lastmod), priority: 0.8 });
  }
  for (const r of data.research) {
    entries.push({ url: `${SITE_URL}/research/${r.slug}`, lastModified: new Date(r.lastmod), priority: 0.8 });
  }
  for (const b of data.blog) {
    entries.push({ url: `${SITE_URL}/blog/${b.slug}`, lastModified: new Date(b.lastmod), priority: 0.6 });
  }
  for (const m of data.ml_projects) {
    entries.push({ url: `${SITE_URL}/machine-learning#${m.slug}`, lastModified: new Date(m.lastmod), priority: 0.6 });
  }
  return entries;
}
