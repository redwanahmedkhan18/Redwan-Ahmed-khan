import type { Metadata } from "next";
import { ActionLink, Container, EmptyState, PageHeader, Tag } from "@/components/ui";
import { getOpenSource } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/open-source" });

export default async function OpenSourcePage() {
  const contributions = await getOpenSource();

  return (
    <>
      <PageHeader
        kicker="Open Source"
        title="Open-source contributions"
        description="Contribution history across organizations and projects. Click a contribution name to open the relevant publication or project website."
      />
      <Container className="py-12 sm:py-16">
        {contributions.length === 0 ? (
          <EmptyState
            title="No open-source contributions published yet."
            hint="Contributions will appear here once added from the admin CMS."
          />
        ) : (
          <ul className="space-y-4">
            {contributions.map((o) => (
              <li key={o.id}>
                <article className="rounded-xl border border-line bg-panel p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold tracking-tight">
                        {o.website_url ? (
                          <a href={o.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent-fg">
                            {o.name} ↗
                          </a>
                        ) : (
                          o.name
                        )}
                      </h2>
                      <p className="mt-1 text-[13px] text-muted">
                        {[o.organization, o.contribution_type, o.contribution_date ? formatDate(o.contribution_date) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionLink href={o.github_url}>GitHub</ActionLink>
                      <ActionLink href={o.publication_url}>Publication</ActionLink>
                    </div>
                  </div>
                  {o.description && <p className="mt-3 text-sm leading-relaxed text-muted">{o.description}</p>}
                  {o.technologies.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                      {o.technologies.map((t) => <li key={t}><Tag>{t}</Tag></li>)}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
