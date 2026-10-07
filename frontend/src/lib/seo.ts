/** SEO helpers: metadata builder + JSON-LD. Never claims facts not in the database. */

import type { Metadata } from "next";
import type { BlogPost, Profile, Project, ResearchPaper, SeoMeta, SocialLink } from "./types";

export const SITE_NAME = "Redwan Ahmed Khan";
export const DEFAULT_TITLE = "Redwan Ahmed Khan — AI Engineer | Software Engineer | Researcher";
export const DEFAULT_DESCRIPTION =
  "Portfolio of Redwan Ahmed Khan: production AI engineering, LLM and RAG systems, software engineering and AI/ML research across NLP, healthcare AI and agentic AI.";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function findSeoOverride(overrides: SeoMeta[], route: string): SeoMeta | undefined {
  return overrides.find((o) => o.route === route);
}

interface BuildMetaInput {
  title?: string;
  description?: string;
  path: string;
  override?: SeoMeta;
  type?: "website" | "article";
  publishedTime?: string | null;
  noindex?: boolean;
}

export function buildMetadata(input: BuildMetaInput): Metadata {
  const title = input.override?.title ?? input.title ?? DEFAULT_TITLE;
  const description = input.override?.description ?? input.description ?? DEFAULT_DESCRIPTION;
  const url = input.override?.canonical_url ?? absoluteUrl(input.path);
  const image = input.override?.og_image_url ?? null;
  const fullTitle = title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: input.type ?? "website",
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: input.noindex || input.override?.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/* ----------------------------- JSON-LD ----------------------------- */

export function personJsonLd(profile: Profile, socialLinks: SocialLink[]) {
  const sameAs = socialLinks.map((s) => s.url);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name,
    url: absoluteUrl("/"),
    jobTitle: profile.headline,
    ...(profile.location ? { address: { "@type": "PostalAddress", addressLocality: profile.location } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    knowsAbout: [...new Set([...profile.engineering_interests, ...profile.research_interests])],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
  };
}

export function profilePageJsonLd(profile: Profile) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl("/about"),
    mainEntity: { "@type": "Person", name: profile.full_name, jobTitle: profile.headline },
  };
}

export function projectJsonLd(project: Project) {
  const github = project.links.find((l) => l.kind === "github");
  return {
    "@context": "https://schema.org",
    "@type": github ? ["SoftwareSourceCode", "CreativeWork"] : "CreativeWork",
    name: project.name,
    url: absoluteUrl(`/projects/${project.slug}`),
    description: project.short_description ?? undefined,
    ...(github ? { codeRepository: github.url } : {}),
    ...(project.technologies.length
      ? { programmingLanguage: project.technologies.map((t) => t.name) }
      : {}),
    ...(project.role ? { creator: { "@type": "Person", name: SITE_NAME, role: project.role } } : {}),
  };
}

export function scholarlyArticleJsonLd(paper: ResearchPaper) {
  const doi = paper.links.find((l) => l.kind === "doi");
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    name: paper.title,
    url: absoluteUrl(`/research/${paper.slug}`),
    ...(paper.abstract ? { abstract: paper.abstract } : {}),
    author: paper.authors.map((a, i) => ({
      "@type": "Person",
      name: a.name,
      authorListOrder: i + 1,
    })),
    ...(paper.publication_year ? { datePublished: String(paper.publication_year) } : {}),
    ...(paper.venue ? { isPartOf: { "@type": "Periodical", name: paper.venue } } : {}),
    ...(doi ? { sameAs: doi.url } : {}),
    keywords: paper.keywords.length ? paper.keywords.join(", ") : undefined,
    // research_status is intentionally NOT mapped to a publication claim
  };
}

export function articleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: absoluteUrl(`/blog/${post.slug}`),
    ...(post.excerpt ? { description: post.excerpt } : {}),
    author: { "@type": "Person", name: post.author_name },
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
    ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
  };
}

