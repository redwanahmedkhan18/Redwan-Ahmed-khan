import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionLink, Container, StatusBadge, Tag } from "@/components/ui";
import { ApiError, getResearch, getResearchPaper, getSeoOverrides } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, findSeoOverride, scholarlyArticleJsonLd } from "@/lib/seo";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getResearch()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const paper = await getResearchPaper(slug);
    const overrides = await getSeoOverrides();
    return buildMetadata({
      path: `/research/${slug}`,
      title: paper.title,
      description: paper.short_description ?? paper.abstract ?? undefined,
      override: findSeoOverride(overrides, `/research/${slug}`),
      type: "article",
    });
  } catch {
    return buildMetadata({ path: `/research/${slug}`, title: "Research" });
  }
}

const LINK_LABELS: Record<string, string> = {
  paper: "Read Paper", doi: "DOI", publication: "Publication", github: "GitHub", dataset: "Dataset", code: "Code",
};

export default async function ResearchPaperPage({ params }: Props) {
  const { slug } = await params;
  let paper;
  try {
    paper = await getResearchPaper(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <>
      <JsonLd data={scholarlyArticleJsonLd(paper)} />
      <div className="border-b border-line bg-panel">
        <Container className="py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-wider text-faint">
            <Link href="/research" className="hover:text-accent-fg">Research</Link> <span aria-hidden="true">/</span> {paper.slug}
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={paper.research_status} />
            {paper.publication_year && <span className="font-mono text-[11px] text-faint">{paper.publication_year}</span>}
            {paper.venue && <span className="font-mono text-[11px] text-faint">· {paper.venue}</span>}
            {paper.publisher && <span className="font-mono text-[11px] text-faint">· {paper.publisher}</span>}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-balance">{paper.title}</h1>
          <p className="mt-4 text-sm text-muted">
            {paper.authors.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ", "}
                {a.is_self ? <strong className="font-semibold text-fg">{a.name}</strong> : a.name}
              </span>
            ))}
          </p>
          {paper.links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {paper.links.map((l) => (
                <ActionLink key={l.id} href={l.url} variant={l.kind === "paper" || l.kind === "doi" ? "primary" : "secondary"}>
                  {LINK_LABELS[l.kind] ?? l.kind}
                </ActionLink>
              ))}
            </div>
          )}
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <div className="min-w-0 space-y-8">
            {paper.short_description && (
              <section aria-label="Summary">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">Summary</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-fg">{paper.short_description}</p>
              </section>
            )}
            <section aria-label="Abstract" className="border-t border-line pt-8">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">Abstract</h2>
              {paper.abstract ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{paper.abstract}</p>
              ) : (
                <p className="mt-3 text-sm text-faint">
                  The abstract is not publicly available yet. It will be published here when the research reaches a shareable stage.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <dl className="rounded-xl border border-line bg-panel p-5 text-sm">
              <div className="border-b border-line pb-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Status</dt>
                <dd className="mt-1"><StatusBadge status={paper.research_status} /></dd>
              </div>
              {paper.research_area.length > 0 && (
                <div className="border-b border-line py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Research areas</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {paper.research_area.map((a) => <Tag key={a}>{a}</Tag>)}
                  </dd>
                </div>
              )}
              {paper.keywords.length > 0 && (
                <div className="border-b border-line py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Keywords</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {paper.keywords.map((k) => <Tag key={k}>{k}</Tag>)}
                  </dd>
                </div>
              )}
              <div className="pt-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Resources</dt>
                <dd className="mt-2 text-[13px] text-muted">
                  {paper.links.length ? (
                    <ul className="space-y-1">
                      {paper.links.map((l) => (
                        <li key={l.id}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-accent-fg underline-offset-4 hover:underline">
                            {LINK_LABELS[l.kind] ?? l.kind} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "Not publicly available"
                  )}
                </dd>
              </div>
            </dl>
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Collaboration</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Interested in this line of research?
              </p>
              <Link href="/contact" className="mt-3 inline-block text-[13px] font-semibold text-accent-fg underline-offset-4 hover:underline">
                Research collaboration →
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
