import type { Metadata } from "next";
import { ActionLink, Container, EmptyState, PageHeader } from "@/components/ui";
import { getAchievements } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/achievements" });

export default async function AchievementsPage() {
  const achievements = await getAchievements();
  const byYear = [...achievements].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <>
      <PageHeader
        kicker="Achievements"
        title="Competitions & awards"
        description="Verified results from academic and technical competitions."
      />
      <Container className="py-12 sm:py-16">
        {byYear.length === 0 ? (
          <EmptyState title="No achievements published yet." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {byYear.map((a) => (
              <li key={a.id}>
                <article className="flex h-full flex-col rounded-xl border border-line bg-panel p-5 sm:p-6">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{a.year ?? ""}</span>
                    {a.rank && (
                      <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent-fg">
                        {a.rank}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-base font-bold leading-snug tracking-tight">{a.title}</h2>
                  {a.organization && <p className="mt-1 text-[13px] text-muted">{a.organization}</p>}
                  {a.project_context && (
                    <p className="mt-3 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[11px] text-muted">
                      Project: {a.project_context}
                    </p>
                  )}
                  {a.description && <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{a.description}</p>}
                  {(a.event_url || a.certificate_url) && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                      <ActionLink href={a.event_url}>Event</ActionLink>
                      <ActionLink href={a.certificate_url}>Certificate</ActionLink>
                    </div>
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
