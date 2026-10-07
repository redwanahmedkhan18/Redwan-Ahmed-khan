import type { Metadata } from "next";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { getTestimonials } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/testimonials" });

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <>
      <PageHeader
        kicker="Testimonials"
        title="Reviews & testimonials"
        description="Only verified testimonials are shown. Placeholder content is never attributed to real people or companies."
      />
      <Container className="py-12 sm:py-16">
        {testimonials.length === 0 ? (
          <EmptyState
            title="No verified testimonials yet."
            hint="Evidence-first: projects, research, GitHub and experience speak for themselves until real reviews are verified."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {testimonials.map((t) => (
              <li key={t.id}>
                <figure className="flex h-full flex-col rounded-xl border border-line bg-panel p-6">
                  {t.rating && (
                    <p className="font-mono text-[11px] text-warn" aria-label={`${t.rating} out of 5`}>
                      {"★".repeat(t.rating)}<span className="text-faint">{"★".repeat(5 - t.rating)}</span>
                    </p>
                  )}
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">“{t.review}”</blockquote>
                  <figcaption className="mt-5 border-t border-line pt-4 text-[13px]">
                    <span className="font-semibold text-fg">{t.name}</span>
                    {(t.role || t.company) && (
                      <span className="block text-xs text-faint">{[t.role, t.company].filter(Boolean).join(" · ")}</span>
                    )}
                    <span className="mt-2 inline-flex items-center gap-2">
                      {t.verified ? (
                        <span className="rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ok">Verified</span>
                      ) : (
                        <span className="rounded-full border border-line-strong bg-subtle px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-faint">Unverified</span>
                      )}
                      {t.is_placeholder && (
                        <span className="rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-warn">Placeholder</span>
                      )}
                      {t.website && (
                        <a href={t.website} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-fg underline-offset-4 hover:underline">Website ↗</a>
                      )}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
