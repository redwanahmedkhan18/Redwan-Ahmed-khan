import type { Metadata } from "next";
import Markdown from "@/components/Markdown";
import { Timeline, experienceRange, type TimelineItemData } from "@/components/Timeline";
import { Container, EmptyState, PageHeader, SectionHeading, Tag } from "@/components/ui";
import { getEducation, getExperience } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/experience" });

export default async function ExperiencePage() {
  const [experience, education] = await Promise.all([getExperience(), getEducation()]);

  const items: TimelineItemData[] = experience.map((e) => ({
    id: e.id,
    title: e.role,
    org: e.company,
    orgHref: e.company_url,
    meta: experienceRange(e.start_date, e.end_date, e.is_current, e.location, e.work_mode),
    subtitle: e.employment_type ?? undefined,
    current: e.is_current,
    tags: e.technologies,
    body: (
      <div className="space-y-4">
        {e.summary && <p>{e.summary}</p>}
        {e.responsibilities.length > 0 && (
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-faint">
            {e.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
        {e.achievements_public_safe.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Achievements</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-faint">
              {e.achievements_public_safe.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        {e.highlights_markdown && (
          <details className="rounded-lg border border-line bg-bg">
            <summary className="cursor-pointer px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-accent-fg">
              Technical case study
            </summary>
            <div className="border-t border-line px-4 py-3">
              <Markdown content={e.highlights_markdown} />
            </div>
          </details>
        )}
      </div>
    ),
  }));

  const eduItems: TimelineItemData[] = education.map((e) => ({
    id: e.id,
    title: `${e.degree}${e.field_of_study ? ` — ${e.field_of_study}` : ""}`,
    org: e.institution_name,
    orgHref: e.institution_website,
    meta: [
      e.start_date ? formatDate(e.start_date) : null,
      e.enrollment_status === "Currently Studying" ? "Present" : e.graduation_date ? `Graduated ${formatDate(e.graduation_date)}` : e.end_date ? formatDate(e.end_date) : null,
    ].filter(Boolean).join(" — "),
    subtitle: e.cgpa != null && e.cgpa_scale != null ? `CGPA ${e.cgpa.toFixed(2)} / ${e.cgpa_scale.toFixed(2)}` : undefined,
    current: e.enrollment_status === "Currently Studying",
    body: (
      <div className="space-y-3">
        {e.department && <p className="text-sm">Department: {e.department}</p>}
        {e.description && <p>{e.description}</p>}
        {e.achievements.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm marker:text-faint">
            {e.achievements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>
    ),
    tags: e.relevant_coursework,
  }));

  return (
    <>
      <PageHeader
        kicker="Experience"
        title="Professional timeline"
        description="Production AI engineering, research and software engineering — the disciplines reinforce each other rather than sitting apart."
      />
      <Container className="py-12 sm:py-16">
        <section aria-labelledby="work">
          <SectionHeading kicker="Work" title="Experience" />
          {items.length === 0 ? <EmptyState title="No experience entries published yet." /> : <Timeline items={items} />}
        </section>
        <section aria-labelledby="education" className="mt-16">
          <SectionHeading kicker="Education" title="Academic background" />
          {eduItems.length === 0 ? (
            <EmptyState title="No education entries published yet." />
          ) : (
            <Timeline items={eduItems} />
          )}
          {education.length > 0 && (
            <p className="mt-4 font-mono text-[11px] text-faint">
              Dates shown exactly as maintained — nothing is inferred.
            </p>
          )}
        </section>
        {experience.some((e) => e.technologies.length > 0) && (
          <section aria-labelledby="stack" className="mt-16">
            <SectionHeading kicker="Stack" title="Technologies across roles" />
            <ul className="flex flex-wrap gap-1.5">
              {[...new Set(experience.flatMap((e) => e.technologies))].map((t) => <li key={t}><Tag>{t}</Tag></li>)}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
