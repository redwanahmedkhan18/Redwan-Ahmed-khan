import type { Metadata } from "next";
import Link from "next/link";
import { getAchievements, getEducation, getExperience, getProfile, getSocialLinks } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, profilePageJsonLd } from "@/lib/seo";
import Markdown from "@/components/Markdown";
import { Timeline, experienceRange, type TimelineItemData } from "@/components/Timeline";
import { Container, EmptyState, PageHeader, SectionHeading, Tag } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = buildMetadata({ path: "/about" });

export default async function AboutPage() {
  const [profile, education, experience, achievements, socials] = await Promise.all([
    getProfile(), getEducation(), getExperience(), getAchievements(), getSocialLinks(),
  ]);
  if (!profile) {
    return <Container className="py-24"><EmptyState title="Profile unavailable." /></Container>;
  }

  const timeline: TimelineItemData[] = [
    ...education.map((e) => ({
      id: e.id,
      title: `${e.degree}${e.field_of_study ? `, ${e.field_of_study}` : ""}`,
      org: e.institution_name,
      orgHref: e.institution_website,
      meta: [
        e.start_date ? formatDate(e.start_date) : null,
        e.enrollment_status === "Currently Studying" ? "Present" : e.graduation_date ? formatDate(e.graduation_date) : e.end_date ? formatDate(e.end_date) : null,
      ].filter(Boolean).join(" — ") || e.enrollment_status,
      subtitle: e.cgpa != null && e.cgpa_scale != null ? `CGPA ${e.cgpa.toFixed(2)} / ${e.cgpa_scale.toFixed(2)}` : undefined,
      body: e.description ? <p>{e.description}</p> : undefined,
      tags: e.relevant_coursework.slice(0, 8),
      current: e.enrollment_status === "Currently Studying",
    })),
    ...experience.map((e) => ({
      id: e.id,
      title: e.role,
      org: e.company,
      orgHref: e.company_url,
      meta: experienceRange(e.start_date, e.end_date, e.is_current, e.location, e.work_mode),
      body: e.summary ? <p>{e.summary}</p> : undefined,
      tags: e.technologies.slice(0, 8),
      current: e.is_current,
    })),
  ]; // ordering comes from admin display_order

  return (
    <>
      <JsonLd data={profilePageJsonLd(profile)} />
      <PageHeader
        kicker="About"
        title={profile.full_name}
        description={profile.headline}
      />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {profile.about_short && <p className="text-lg leading-relaxed text-fg">{profile.about_short}</p>}
            {profile.about_long ? (
              <Markdown content={profile.about_long} className="mt-6" />
            ) : (
              <p className="mt-6 text-sm leading-relaxed text-muted">
                A longer professional narrative will appear here once it&apos;s published. In the meantime,
                the <Link href="/experience" className="text-accent-fg underline underline-offset-4">experience timeline</Link>,{" "}
                <Link href="/projects" className="text-accent-fg underline underline-offset-4">projects</Link> and{" "}
                <Link href="/research" className="text-accent-fg underline underline-offset-4">research</Link> pages
                carry the full detail.
              </p>
            )}
            {profile.technical_philosophy && (
              <blockquote className="mt-8 rounded-xl border-l-2 border-accent bg-panel px-5 py-4 text-sm italic leading-relaxed text-muted">
                {profile.technical_philosophy}
              </blockquote>
            )}

            <section aria-labelledby="career-timeline" className="mt-14">
              <SectionHeading kicker="Timeline" title="Education & career" />
              {timeline.length === 0 ? <EmptyState title="No timeline entries published yet." /> : <Timeline items={timeline} />}
            </section>

            {achievements.length > 0 && (
              <section aria-labelledby="about-achievements" className="mt-14">
                <SectionHeading kicker="Achievements" title="Competitions & awards" href="/achievements" />
                <ul className="space-y-3">
                  {achievements.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-line bg-panel px-4 py-3 text-sm">
                      <span className="font-mono text-[11px] text-faint">{a.year}</span>
                      <span className="font-semibold">{a.title}</span>
                      {a.rank && <span className="font-mono text-[11px] font-semibold text-accent-fg">{a.rank}</span>}
                      {a.organization && <span className="text-xs text-muted">{a.organization}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <section aria-labelledby="engineering-interests" className="rounded-xl border border-line bg-panel p-5">
              <h2 id="engineering-interests" className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Engineering interests</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {profile.engineering_interests.map((i) => <li key={i}><Tag>{i}</Tag></li>)}
              </ul>
            </section>
            <section aria-labelledby="research-interests" className="rounded-xl border border-line bg-panel p-5">
              <h2 id="research-interests" className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Research interests</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {profile.research_interests.map((i) => <li key={i}><Tag>{i}</Tag></li>)}
              </ul>
            </section>
            {socials.length > 0 && (
              <section aria-labelledby="profiles" className="rounded-xl border border-line bg-panel p-5">
                <h2 id="profiles" className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Profiles</h2>
                <ul className="mt-3 space-y-2">
                  {socials.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer me" className="text-[13px] font-medium text-muted underline-offset-4 hover:text-accent-fg hover:underline">
                        {s.label ?? s.platform} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {profile.location && (
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Based in {profile.location}</p>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}
