import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { ActionLink, Container, Tag } from "@/components/ui";
import { getProject, getProjects, getSeoOverrides } from "@/lib/api";
import { formatRange } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, findSeoOverride, projectJsonLd } from "@/lib/seo";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getProject(slug);
    const overrides = await getSeoOverrides();
    return buildMetadata({
      path: `/projects/${slug}`,
      title: project.name,
      description: project.short_description ?? undefined,
      override: findSeoOverride(overrides, `/projects/${slug}`),
    });
  } catch {
    return buildMetadata({ path: `/projects/${slug}`, title: "Project" });
  }
}

const LINK_LABELS: Record<string, string> = {
  github: "GitHub", live_demo: "Live Demo", documentation: "Documentation", case_study: "Case Study", video: "Video",
};

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="border-t border-line pt-8">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-faint">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  let project;
  try {
    project = await getProject(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const cover = project.images.find((i) => i.kind === "cover") ?? project.images[0];
  const diagram = project.images.find((i) => i.kind === "architecture_diagram");

  return (
    <>
      <JsonLd data={projectJsonLd(project)} />
      <div className="border-b border-line bg-panel">
        <Container className="py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-wider text-faint">
            <Link href="/projects" className="hover:text-accent-fg">Projects</Link> <span aria-hidden="true">/</span> {project.slug}
          </nav>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{project.name}</h1>
          {project.short_description && (
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">{project.short_description}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <ActionLink href={project.links.find((l) => l.kind === "github")?.url}>GitHub</ActionLink>
            <ActionLink href={project.links.find((l) => l.kind === "live_demo")?.url} variant="primary">Live Demo</ActionLink>
            {project.links.filter((l) => !["github", "live_demo"].includes(l.kind)).map((l) => (
              <ActionLink key={l.id} href={l.url}>{l.label ?? LINK_LABELS[l.kind] ?? l.kind}</ActionLink>
            ))}
          </div>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <div className="min-w-0 space-y-8">
            {cover && (cover.asset?.storage_url || cover.url) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover.asset?.storage_url ?? cover.url ?? ""}
                alt={cover.alt_text ?? `${project.name} screenshot`}
                className="w-full rounded-xl border border-line"
                loading="lazy"
              />
            )}

            {project.long_description && (
              <Block title="Case Study"><Markdown content={project.long_description} /></Block>
            )}
            {project.problem && (
              <Block title="Problem"><p className="text-sm leading-relaxed text-muted">{project.problem}</p></Block>
            )}
            {project.solution && (
              <Block title="Solution"><p className="text-sm leading-relaxed text-muted">{project.solution}</p></Block>
            )}
            {diagram && (diagram.asset?.storage_url || diagram.url) && (
              <Block title="System Architecture">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={diagram.asset?.storage_url ?? diagram.url ?? ""}
                  alt={diagram.alt_text ?? `${project.name} architecture diagram`}
                  className="w-full rounded-xl border border-line bg-subtle"
                  loading="lazy"
                />
                {diagram.caption && <p className="mt-2 text-xs text-faint">{diagram.caption}</p>}
              </Block>
            )}
            {project.key_features.length > 0 && <Block title="Key Features"><List items={project.key_features} /></Block>}
            {project.technical_challenges.length > 0 && <Block title="Technical Challenges"><List items={project.technical_challenges} /></Block>}
            {project.technical_decisions.length > 0 && <Block title="Key Engineering Decisions"><List items={project.technical_decisions} /></Block>}
            {(project.results || project.metrics_note) && (
              <Block title="Results">
                <div className="rounded-xl border border-line bg-panel p-5">
                  {project.results
                    ? <p className="text-sm leading-relaxed text-muted">{project.results}</p>
                    : <p className="text-sm text-muted">Production-ready prototype completed.</p>}
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
                    Metric: {project.metrics_note ?? "Not publicly disclosed."}
                  </p>
                </div>
              </Block>
            )}
            {project.lessons_learned.length > 0 && <Block title="Lessons Learned"><List items={project.lessons_learned} /></Block>}
            {project.future_improvements.length > 0 && <Block title="Future Improvements"><List items={project.future_improvements} /></Block>}
            {project.images.filter((i) => i.kind === "screenshot" && i !== cover).length > 0 && (
              <Block title="Screenshots">
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.images.filter((i) => i.kind === "screenshot" && i !== cover).map((img) => (
                    <figure key={img.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.asset?.storage_url ?? img.url ?? ""}
                        alt={img.alt_text ?? `${project.name} screenshot`}
                        className="w-full rounded-lg border border-line"
                        loading="lazy"
                      />
                      {img.caption && <figcaption className="mt-1.5 text-xs text-faint">{img.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </Block>
            )}
            {!project.long_description && !project.problem && project.key_features.length === 0 && (
              <div className="rounded-xl border border-dashed border-line-strong bg-panel/50 px-6 py-10 text-center">
                <p className="text-sm text-muted">
                  The detailed case study for this project is being prepared. Technical architecture and
                  engineering decisions will be published here.
                </p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <dl className="rounded-xl border border-line bg-panel p-5">
              {project.role && <FactRow label="My Role" value={project.role} />}
              {project.category && <FactRow label="Category" value={project.category} />}
              {project.project_status && <FactRow label="Status" value={project.project_status} />}
              {(project.start_date || project.end_date) && (
                <FactRow label="Timeline" value={formatRange(project.start_date, project.end_date)} />
              )}
              {project.technologies.length > 0 && (
                <FactRow
                  label="Technologies"
                  value={
                    <ul className="flex flex-wrap gap-1.5">
                      {project.technologies.map((t) => <li key={t.id}><Tag>{t.name}</Tag></li>)}
                    </ul>
                  }
                />
              )}
              <FactRow
                label="Links"
                value={
                  project.links.length ? (
                    <ul className="space-y-1">
                      {project.links.map((l) => (
                        <li key={l.id}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-accent-fg underline-offset-4 hover:underline">
                            {l.label ?? LINK_LABELS[l.kind] ?? l.kind} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted">Not publicly available</span>
                  )
                }
              />
            </dl>
            <div className="mt-4 rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Next steps</p>
              <ul className="mt-3 space-y-2 text-[13px]">
                <li><Link href="/hire-me" className="text-accent-fg underline-offset-4 hover:underline">Hire me for similar work →</Link></li>
                <li><Link href="/contact" className="text-accent-fg underline-offset-4 hover:underline">Ask about this project →</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
