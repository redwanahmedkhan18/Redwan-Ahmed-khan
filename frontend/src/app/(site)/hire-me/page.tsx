import type { Metadata } from "next";
import HireForm from "@/islands/HireForm";
import { Container, PageHeader, Tag } from "@/components/ui";
import { getProjects, getSiteSettings } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/hire-me" });

const DEFAULT_SERVICES = [
  "AI engineering", "LLM application development", "RAG systems", "AI agents",
  "NLP systems", "ML systems", "Backend/API engineering", "AI automation",
  "Full-stack AI applications",
];

export default async function HireMePage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getProjects()]);
  const services = (Array.isArray(settings.hire_services) && settings.hire_services.length
    ? (settings.hire_services as string[])
    : DEFAULT_SERVICES);

  return (
    <>
      <PageHeader
        kicker="Hire Me"
        title="Let's build something intelligent"
        description="Available for AI/ML engineering engagements — from LLM applications and RAG systems to full-stack AI platforms and production automation."
      />
      <Container className="py-12 sm:py-16">
        <section aria-labelledby="services" className="mb-12">
          <h2 id="services" className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">Services</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s} className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent-soft font-mono text-[10px] text-accent-fg" aria-hidden="true">✓</span>
                <span className="text-sm font-medium">{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative rounded-xl border border-line bg-panel p-6 sm:p-8">
            <h2 className="text-lg font-bold tracking-tight">Project inquiry</h2>
            <p className="mt-1 text-sm text-muted">Structured details help me respond with something useful.</p>
            <div className="mt-6">
              <HireForm services={services} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Relevant work</p>
              <ul className="mt-3 space-y-2">
                {projects.slice(0, 4).map((p) => (
                  <li key={p.id} className="text-[13px]">
                    <a href={`/projects/${p.slug}`} className="font-medium text-accent-fg underline-offset-4 hover:underline">{p.name}</a>
                    {p.category && <span className="ml-2 text-faint">{p.category}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Typical stack</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {["Python", "FastAPI", "PostgreSQL", "React", "Next.js", "PyTorch", "LangChain", "Docker", "AWS"].map((t) => (
                  <li key={t}><Tag>{t}</Tag></li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">How it works</p>
              <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
                <li><span className="font-mono text-accent-fg">01</span> — You describe the project above.</li>
                <li><span className="font-mono text-accent-fg">02</span> — I review and reply with questions or a proposal.</li>
                <li><span className="font-mono text-accent-fg">03</span> — We scope, agree and build.</li>
              </ol>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
