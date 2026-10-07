import type { Metadata } from "next";
import ContactForm from "@/islands/ContactForm";
import { Container, PageHeader } from "@/components/ui";
import { getProfile, getSocialLinks } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/contact" });

export default async function ContactPage() {
  const [profile, socials] = await Promise.all([getProfile(), getSocialLinks()]);

  return (
    <>
      <PageHeader
        kicker="Contact"
        title="Get in touch"
        description="Job opportunities, freelance projects, research collaboration, speaking, open source — or anything else. Messages land directly in the admin inbox."
      />
      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative rounded-xl border border-line bg-panel p-6 sm:p-8">
            <ContactForm />
          </div>
          <aside className="space-y-6">
            {profile?.email_public && (
              <div className="rounded-xl border border-line bg-panel p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Public email</p>
                <a href={`mailto:${profile.email_public}`} className="mt-2 block text-sm font-semibold text-accent-fg underline-offset-4 hover:underline">
                  {profile.email_public}
                </a>
              </div>
            )}
            {socials.length > 0 && (
              <div className="rounded-xl border border-line bg-panel p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Elsewhere</p>
                <ul className="mt-3 space-y-2">
                  {socials.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer me" className="text-[13px] font-medium text-muted underline-offset-4 hover:text-accent-fg hover:underline">
                        {s.label ?? s.platform} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Response time</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Messages are reviewed personally. Expect a reply within a few business days — sooner for
                role and project inquiries.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
