import Link from "next/link";
import type { Metadata } from "next";
import {
  getAchievements, getBlogPosts, getExperience, getOpenSource, getProfile,
  getProjects, getResearch, getSiteSettings, getSkills, getSocialLinks, getTestimonials,
} from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, personJsonLd, websiteJsonLd } from "@/lib/seo";
import ProjectCard from "@/components/ProjectCard";
import ResearchCard from "@/components/ResearchCard";
import SkillGrid from "@/components/SkillGrid";
import { Timeline, experienceRange, type TimelineItemData } from "@/components/Timeline";
import { Container, EmptyState, SectionHeading, Tag } from "@/components/ui";
import Hero from "@/islands/Hero";

export const metadata: Metadata = buildMetadata({ path: "/" });

interface HeroCta { label: string; href: string }
interface HeroCtas { primary?: HeroCta[]; secondary?: HeroCta[] }

export default async function HomePage() {
  const [profile, socials, settings, projects, experience, research, skills, achievements, openSource, testimonials, posts] =
    await Promise.all([
      getProfile(), getSocialLinks(), getSiteSettings(), getProjects(), getExperience(),
      getResearch(), getSkills(), getAchievements(), getOpenSource(), getTestimonials(), getBlogPosts(),
    ]);

  if (!profile) {
    return (
      <Container className="py-24">
        <EmptyState
          title="Profile is not available right now."
          hint="The backend may be starting up — reload in a moment."
        />
      </Container>
    );
  }

  const ctas = (settings.hero_ctas ?? {}) as HeroCtas;
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4).length
    ? projects.filter((p) => p.featured).slice(0, 4)
    : projects.slice(0, 3);
  const featuredResearch = (research.filter((r) => r.featured).length ? research.filter((r) => r.featured) : research).slice(0, 2);
  const featuredTestimonials = testimonials.filter((t) => t.featured || t.verified).slice(0, 3);
  const timeline: TimelineItemData[] = experience.slice(0, 3).map((e) => ({
    id: e.id,
    title: e.role,
    org: e.company,
    orgHref: e.company_url,
    meta: experienceRange(e.start_date, e.end_date, e.is_current, e.location, e.work_mode),
    body: e.summary ? <p>{e.summary}</p> : undefined,
    tags: e.technologies.slice(0, 8),
    current: e.is_current,
  }));

  return (
    <>
      <JsonLd data={personJsonLd(profile, socials)} />
      <JsonLd data={websiteJsonLd()} />

      <Hero
        name={profile.full_name}
        headline={profile.headline}
        tagline={profile.tagline}
        location={profile.location}
        openToWork={profile.open_to_work}
        socials={socials.map((s) => ({ platform: s.platform, url: s.url, label: s.label }))}
        primaryCtas={ctas.primary ?? [{ label: "View My Work", href: "/projects" }, { label: "Contact Me", href: "/contact" }]}
        secondaryCtas={ctas.secondary ?? [{ label: "Download CV", href: "/cv" }, { label: "Hire Me", href: "/hire-me" }]}
      />

      {/* Professional snapshot — evidence, not invented statistics */}
      <section aria-labelledby="snapshot" className="border-b border-line bg-panel">
        <Container className="py-14 sm:py-16">
          <SectionHeading index="01" kicker="Snapshot" title="Three dimensions, one engineering practice" />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Production AI Engineering",
                body: "LLM applications, RAG systems, agentic AI and intelligent automation built to run in production — currently as a Remote AI Engineer at CircleCI.",
                href: "/experience",
                link: "Experience →",
              },
              {
                title: "Software Engineering",
                body: "Backend systems and APIs with FastAPI and PostgreSQL, full-stack applications with React/Next.js, deployed with Docker on AWS.",
                href: "/projects",
                link: "Projects →",
              },
              {
                title: "AI/ML Research",
                body: "Research on medical RAG (CARE-RAG), ensemble learning for cardiac arrhythmia detection, NLP and healthcare AI.",
                href: "/research",
                link: "Research →",
              },
            ].map((card) => (
              <article key={card.title} className="rounded-xl border border-line bg-bg p-5">
                <h3 className="text-[15px] font-bold tracking-tight">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
                <Link href={card.href} className="mt-4 inline-block text-[13px] font-semibold text-accent-fg underline-offset-4 hover:underline">
                  {card.link}
                </Link>
              </article>
            ))}
          </div>

          {/* Evidence strip: links to verifiable profiles */}
          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-bg px-5 py-3.5" aria-label="Verifiable profiles">
            <li className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Evidence</li>
            {socials.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer me" className="text-[13px] font-medium text-muted underline-offset-4 hover:text-accent-fg hover:underline">
                  {s.label ?? s.platform} ↗
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Featured projects */}
      <section aria-labelledby="projects" className="border-b border-line">
        <Container className="py-14 sm:py-16">
          <SectionHeading
            index="02" kicker="Featured Work" title="Selected projects"
            description="AI-powered platforms spanning commerce, sales intelligence, healthcare workflows and content automation."
            href="/projects"
          />
          {featuredProjects.length === 0 ? (
            <EmptyState title="No projects published yet." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {featuredProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </Container>
      </section>

      {/* Experience */}
      <section aria-labelledby="experience" className="border-b border-line bg-panel">
        <Container className="py-14 sm:py-16">
          <SectionHeading
            index="03" kicker="Experience" title="Where I've worked"
            href="/experience" linkLabel="Full timeline"
          />
          {timeline.length === 0 ? <EmptyState title="No experience entries published yet." /> : <Timeline items={timeline} />}
        </Container>
      </section>

      {/* Research */}
      <section aria-labelledby="research" className="border-b border-line">
        <Container className="py-14 sm:py-16">
          <SectionHeading
            index="04" kicker="Research" title="Research & publications"
            description="Status labels are preserved exactly as maintained — no publication is claimed before it exists."
            href="/research"
          />
          {featuredResearch.length === 0 ? (
            <EmptyState title="No research papers published yet." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {featuredResearch.map((r) => <ResearchCard key={r.id} paper={r} />)}
            </div>
          )}
        </Container>
      </section>

      {/* Skills */}
      <section aria-labelledby="skills" className="border-b border-line bg-panel">
        <Container className="py-14 sm:py-16">
          <SectionHeading index="05" kicker="Technology Stack" title="Tools I work with" />
          <SkillGrid categories={skills} />
        </Container>
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section aria-labelledby="achievements" className="border-b border-line">
          <Container className="py-14 sm:py-16">
            <SectionHeading index="06" kicker="Achievements" title="Competitions & awards" href="/achievements" />
            <ul className="grid gap-3 sm:grid-cols-3">
              {achievements.slice(0, 3).map((a) => (
                <li key={a.id} className="rounded-xl border border-line bg-panel p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{a.year ?? ""}</p>
                  <h3 className="mt-1 text-sm font-bold leading-snug">{a.title}</h3>
                  {a.rank && <p className="mt-2 text-[13px] font-semibold text-accent-fg">{a.rank}</p>}
                  {a.organization && <p className="mt-1 text-xs text-muted">{a.organization}</p>}
                  {a.project_context && <p className="mt-2 text-xs text-faint">Project: {a.project_context}</p>}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Open source */}
      {openSource.length > 0 && (
        <section aria-labelledby="opensource" className="border-b border-line bg-panel">
          <Container className="py-14 sm:py-16">
            <SectionHeading index="07" kicker="Open Source" title="Contributions" href="/open-source" />
            <ul className="grid gap-3 md:grid-cols-2">
              {openSource.slice(0, 4).map((o) => (
                <li key={o.id} className="rounded-xl border border-line bg-bg p-5">
                  <h3 className="text-sm font-bold">
                    {o.website_url ? (
                      <a href={o.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent-fg">{o.name} ↗</a>
                    ) : o.name}
                  </h3>
                  {o.organization && <p className="mt-1 text-xs text-muted">{o.organization}</p>}
                  {o.description && <p className="mt-2 text-sm text-muted line-clamp-2">{o.description}</p>}
                  {o.technologies.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">{o.technologies.slice(0, 5).map((t) => <li key={t}><Tag>{t}</Tag></li>)}</ul>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Testimonials — only verified/non-placeholder content surfaces publicly */}
      {featuredTestimonials.length > 0 && (
        <section aria-labelledby="testimonials" className="border-b border-line">
          <Container className="py-14 sm:py-16">
            <SectionHeading index="08" kicker="Testimonials" title="What collaborators say" href="/testimonials" />
            <ul className="grid gap-4 md:grid-cols-3">
              {featuredTestimonials.map((t) => (
                <li key={t.id} className="rounded-xl border border-line bg-panel p-5">
                  <blockquote className="text-sm leading-relaxed text-muted">“{t.review}”</blockquote>
                  <figcaption className="mt-4 text-xs">
                    <span className="font-semibold text-fg">{t.name}</span>
                    {(t.role || t.company) && <span className="text-faint"> · {[t.role, t.company].filter(Boolean).join(", ")}</span>}
                    {t.verified && <span className="ml-2 rounded-full border border-ok/30 bg-ok/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ok">Verified</span>}
                  </figcaption>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Technical writing */}
      {posts.length > 0 && (
        <section aria-labelledby="writing" className="border-b border-line bg-panel">
          <Container className="py-14 sm:py-16">
            <SectionHeading index="09" kicker="Writing" title="Technical writing" href="/blog" />
            <ul className="grid gap-3 md:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <li key={post.id} className="rounded-xl border border-line bg-bg p-5">
                  {post.category && <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{post.category}</p>}
                  <h3 className="mt-1 text-sm font-bold leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-accent-fg">{post.title}</Link>
                  </h3>
                  {post.excerpt && <p className="mt-2 line-clamp-3 text-xs text-muted">{post.excerpt}</p>}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Contact CTA */}
      <section aria-labelledby="contact-cta" className="bg-grid">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-panel p-8 text-center sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">Get in touch</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Building something with AI? Let&apos;s talk.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Open to AI/ML engineering roles, freelance projects, research collaboration and
              open-source work.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:text-[#0a0c10]">
                Contact Me
              </Link>
              <Link href="/hire-me" className="rounded-md border border-line-strong bg-panel px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent-fg">
                Hire Me
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
