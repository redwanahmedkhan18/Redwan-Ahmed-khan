import type { Metadata } from "next";
import Link from "next/link";
import CVDownload from "@/islands/CVDownload";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentCV, getProfile } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { formatBytes, formatDate } from "@/lib/format";

export const metadata: Metadata = buildMetadata({ path: "/cv" });

export default async function CVPage() {
  const [cv, profile] = await Promise.all([getCurrentCV(), getProfile()]);

  return (
    <>
      <PageHeader
        kicker="CV"
        title="Curriculum Vitae"
        description="The current CV, managed from the admin panel — previous versions are archived, never hardlinked."
      />
      <Container className="py-12 sm:py-16">
        {cv ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-line bg-panel p-8 text-center sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">Current version</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight">{cv.label}</h2>
            <p className="mt-2 font-mono text-[11px] text-faint">
              PDF · {formatBytes(cv.asset.size_bytes)} · updated {formatDate(cv.updated_at ?? cv.created_at)}
            </p>
            {cv.asset.alt_text && <p className="mt-1 text-xs text-faint">{cv.asset.alt_text}</p>}
            <div className="mt-7">
              <CVDownload cvId={cv.id} url={cv.asset.storage_url} label={cv.asset.original_filename ?? `${cv.label}.pdf`} />
            </div>
            <p className="mt-5 text-xs text-faint">
              Prefer a conversation? <Link href="/contact" className="text-accent-fg underline-offset-4 hover:underline">Contact me</Link> or{" "}
              <Link href="/hire-me" className="text-accent-fg underline-offset-4 hover:underline">send a project inquiry</Link>.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl">
            <EmptyState
              title="The CV is not available for download right now."
              hint={profile ? "A new version is being prepared — check back shortly or reach out via the contact page." : undefined}
            />
          </div>
        )}
      </Container>
    </>
  );
}
