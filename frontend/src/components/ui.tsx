import Link from "next/link";
import type { ReactNode } from "react";

/* Kicker + heading used across sections */
export function SectionHeading({
  index,
  kicker,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  index?: string;
  kicker: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">
          {index ? `${index} / ` : ""}{kicker}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-[13px] font-semibold text-accent-fg underline-offset-4 hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ kicker, title, description }: { kicker: string; title: string; description?: string }) {
  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-fg">{kicker}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
    </div>
  );
}

/* Technology / keyword tag */
export function Tag({ children, href }: { children: ReactNode; href?: string }) {
  const cls =
    "inline-flex items-center rounded-md border border-line bg-subtle px-2 py-0.5 font-mono text-[11px] text-muted transition-colors";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-accent hover:text-accent-fg`}>
        {children}
      </a>
    );
  }
  return <span className={cls}>{children}</span>;
}

/* Status pill */
const STATUS_STYLES: Record<string, string> = {
  published: "border-ok/30 bg-ok/10 text-ok",
  draft: "border-warn/30 bg-warn/10 text-warn",
  archived: "border-line-strong bg-subtle text-faint",
  "Under Review": "border-warn/30 bg-warn/10 text-warn",
  Working: "border-accent/30 bg-accent-soft text-accent-fg",
  Preprint: "border-accent/30 bg-accent-soft text-accent-fg",
  Published: "border-ok/30 bg-ok/10 text-ok",
  new: "border-accent/30 bg-accent-soft text-accent-fg",
  read: "border-line-strong bg-subtle text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLES[status] ?? "border-line bg-subtle text-muted"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* Loading / empty / error states for every dynamic section */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-panel/50 px-6 py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Empty</p>
      <p className="mt-2 text-sm font-medium text-muted">{title}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl border border-line bg-subtle" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-bad/30 bg-bad/5 px-6 py-8 text-center" role="alert">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-bad">Error</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}

/* Only rendered when the URL exists — no broken/empty links */
export function ActionLink({
  href,
  children,
  variant = "secondary",
  external = true,
}: {
  href: string | null | undefined;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
}) {
  if (!href) return null;
  const base =
    variant === "primary"
      ? "bg-accent text-white dark:text-[#0a0c10] hover:opacity-90"
      : variant === "secondary"
        ? "border border-line-strong bg-panel text-fg hover:border-accent hover:text-accent-fg"
        : "text-muted hover:text-accent-fg underline-offset-4 hover:underline";
  const cls = `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${base}`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
