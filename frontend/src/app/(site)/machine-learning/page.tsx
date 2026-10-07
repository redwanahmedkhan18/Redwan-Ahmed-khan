import type { Metadata } from "next";
import { ActionLink, Container, EmptyState, PageHeader, Tag } from "@/components/ui";
import { getMLProjects } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/machine-learning" });

export default async function MachineLearningPage() {
  const projects = await getMLProjects();

  return (
    <>
      <PageHeader
        kicker="Machine Learning"
        title="ML projects & experiments"
        description="Classical and deep learning work: datasets, problem framing, algorithms and notebooks. Metrics are shown only when explicitly recorded."
      />
      <Container className="py-12 sm:py-16">
        {projects.length === 0 ? (
          <EmptyState
            title="No machine learning projects published yet."
            hint="ML projects — with datasets, notebooks and results — will appear here once published."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <article key={p.id} className="flex flex-col rounded-xl border border-line bg-panel p-5 sm:p-6">
                {p.problem_type && <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{p.problem_type}</p>}
                <h2 className="mt-1 text-lg font-bold tracking-tight">{p.project_name}</h2>
                {p.short_description && <p className="mt-2 text-sm leading-relaxed text-muted">{p.short_description}</p>}

                <dl className="mt-4 space-y-2 text-[13px]">
                  {p.dataset && (
                    <div><dt className="inline font-mono text-[10px] uppercase tracking-wider text-faint">Dataset: </dt><dd className="inline text-muted">{p.dataset}</dd></div>
                  )}
                  {p.algorithm && (
                    <div><dt className="inline font-mono text-[10px] uppercase tracking-wider text-faint">Algorithm: </dt><dd className="inline text-muted">{p.algorithm}</dd></div>
                  )}
                </dl>

                {p.technologies.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                    {p.technologies.map((t) => <li key={t}><Tag>{t}</Tag></li>)}
                  </ul>
                )}

                {p.results && <p className="mt-4 rounded-lg border border-line bg-bg px-4 py-3 text-[13px] leading-relaxed text-muted">{p.results}</p>}

                {p.metrics && Object.keys(p.metrics).length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Metrics">
                    {Object.entries(p.metrics).map(([k, v]) => (
                      <li key={k} className="rounded-md border border-accent/30 bg-accent-soft px-2 py-1 font-mono text-[11px] text-accent-fg">
                        {k}: {String(v)}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  <ActionLink href={p.kaggle_notebook_url}>Kaggle Notebook</ActionLink>
                  <ActionLink href={p.github_url}>GitHub</ActionLink>
                  <ActionLink href={p.live_demo_url}>Live Demo</ActionLink>
                  <ActionLink href={p.publication_url}>Publication</ActionLink>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
