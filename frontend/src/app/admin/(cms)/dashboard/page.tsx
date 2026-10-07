"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { AuditLogEntry, ContactMessage, DashboardCounts, HireRequest } from "@/lib/types";
import { formatDate } from "@/lib/format";

const LABELS: Record<string, { label: string; href: string }> = {
  projects: { label: "Projects", href: "/admin/projects" },
  research_papers: { label: "Research", href: "/admin/research" },
  ml_projects: { label: "ML Projects", href: "/admin/ml-projects" },
  experience: { label: "Experience", href: "/admin/experience" },
  education: { label: "Education", href: "/admin/education" },
  open_source: { label: "Open Source", href: "/admin/open-source" },
  achievements: { label: "Achievements", href: "/admin/achievements" },
  testimonials: { label: "Testimonials", href: "/admin/testimonials" },
  blog_posts: { label: "Blog Posts", href: "/admin/blog" },
  skills: { label: "Skills", href: "/admin/skills" },
  media_assets: { label: "Media", href: "/admin/media" },
  cv_versions: { label: "CV", href: "/admin/cv" },
  contact_messages: { label: "Messages", href: "/admin/messages" },
  hire_requests: { label: "Hire Requests", href: "/admin/hire-requests" },
};

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [hires, setHires] = useState<HireRequest[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminRequest<{ counts: DashboardCounts }>("/admin/dashboard/summary"),
      adminRequest<ContactMessage[]>("/admin/dashboard/recent-messages"),
      adminRequest<HireRequest[]>("/admin/dashboard/recent-hire-requests"),
      adminRequest<AuditLogEntry[]>("/admin/dashboard/recent-audit"),
    ])
      .then(([s, m, h, a]) => { setCounts(s.counts); setMessages(m); setHires(h); setAudit(a); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"));
  }, []);

  if (error) return <p className="rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{error}</p>;
  if (!counts) return <p className="font-mono text-xs text-faint" role="status">Loading dashboard…</p>;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-0.5 text-[13px] text-muted">Real content counts — published vs draft, plus recent activity.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(LABELS).map(([key, meta]) => {
          const c = counts[key];
          if (!c) return null;
          return (
            <Link key={key} href={meta.href}
              className="rounded-xl border border-line bg-panel p-4 transition-colors hover:border-accent">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{meta.label}</p>
              <p className="mt-1.5 text-2xl font-bold">{c.total}</p>
              <p className="mt-1 font-mono text-[10px] text-faint">
                {c.published !== undefined && <span className="text-ok">{c.published} pub</span>}
                {c.draft !== undefined && <span className="ml-2 text-warn">{c.draft} draft</span>}
                {c.new !== undefined && <span className="text-accent-fg">{c.new} new</span>}
                {c.visible !== undefined && <span>{c.visible} visible</span>}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-messages" className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between">
            <h2 id="recent-messages" className="text-sm font-bold">Recent messages</h2>
            <Link href="/admin/messages" className="text-[12px] font-semibold text-accent-fg hover:underline">Inbox →</Link>
          </div>
          {messages.length === 0 ? (
            <p className="mt-4 text-[13px] text-faint">No contact messages yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {messages.slice(0, 5).map((m) => (
                <li key={m.id} className="rounded-lg border border-line bg-bg px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold">{m.subject}</p>
                    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase ${m.status === "new" ? "border-accent/30 bg-accent-soft text-accent-fg" : "border-line-strong text-faint"}`}>{m.status}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{m.name} · {m.purpose} · {formatDate(m.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
          {hires.length > 0 && (
            <>
              <h3 className="mt-5 text-[13px] font-bold">Recent hire requests</h3>
              <ul className="mt-3 space-y-2">
                {hires.slice(0, 3).map((h) => (
                  <li key={h.id} className="rounded-lg border border-line bg-bg px-3.5 py-2.5 text-xs">
                    <span className="font-semibold">{h.project_type}</span>
                    <span className="text-muted"> · {h.name}{h.company ? ` (${h.company})` : ""} · {formatDate(h.created_at)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby="recent-audit" className="rounded-xl border border-line bg-panel p-5">
          <h2 id="recent-audit" className="text-sm font-bold">Recent activity (audit)</h2>
          {audit.length === 0 ? (
            <p className="mt-4 text-[13px] text-faint">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {audit.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-baseline gap-2.5 border-b border-line pb-2 text-xs last:border-0">
                  <span className="w-36 shrink-0 font-mono text-[10px] text-faint">{formatDate(a.created_at)}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                    a.action === "delete" ? "border-bad/30 text-bad" : a.action.includes("publish") ? "border-ok/30 text-ok" : "border-line-strong text-muted"}`}>
                    {a.action}
                  </span>
                  <span className="truncate text-muted">{a.entity_type}{a.entity_id ? ` · ${a.entity_id.slice(0, 8)}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
