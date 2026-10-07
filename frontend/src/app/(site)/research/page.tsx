import type { Metadata } from "next";
import ResearchCard from "@/components/ResearchCard";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { getResearch } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/research" });

const ORDER = ["Published", "Preprint", "Under Review", "Working"];

export default async function ResearchPage() {
  const papers = await getResearch();
  const grouped = ORDER
    .map((status) => ({ status, items: papers.filter((p) => p.research_status === status) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        kicker="Research"
        title="Research & publications"
        description="Machine learning, NLP and healthcare AI research. Status labels (Working, Under Review, Published, Preprint) are preserved exactly as maintained — no publication is claimed before publication metadata exists."
      />
      <Container className="py-12 sm:py-16">
        {papers.length === 0 ? (
          <EmptyState title="No research papers published yet." />
        ) : (
          <div className="space-y-12">
            {grouped.map((group) => (
              <section key={group.status} aria-labelledby={`status-${group.status.replace(/\s/g, "-")}`}>
                <h2 id={`status-${group.status.replace(/\s/g, "-")}`} className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">
                  {group.status} <span className="text-faint">({group.items.length})</span>
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.items.map((paper) => <ResearchCard key={paper.id} paper={paper} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
