import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { getProjects } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/projects" });

export default async function ProjectsPage() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <>
      <PageHeader
        kicker="Projects"
        title="Things I've built"
        description="AI-powered platforms and software systems. Each project has a dedicated case-study page; GitHub and live-demo links appear only when they exist."
      />
      <Container className="py-12 sm:py-16">
        {projects.length === 0 ? (
          <EmptyState title="No projects published yet." hint="Projects appear here once published from the admin CMS." />
        ) : (
          <div className="space-y-12">
            {featured.length > 0 && (
              <section aria-labelledby="featured">
                <h2 className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">Featured</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {featured.map((p) => <ProjectCard key={p.id} project={p} detailed />)}
                </div>
              </section>
            )}
            {others.length > 0 && (
              <section aria-labelledby="all">
                <h2 className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">More projects</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {others.map((p) => <ProjectCard key={p.id} project={p} detailed />)}
                </div>
              </section>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
