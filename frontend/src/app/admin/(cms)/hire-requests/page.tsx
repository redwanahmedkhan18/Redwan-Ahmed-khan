"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { HireRequest, Page } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function AdminHireRequestsPage() {
  const [data, setData] = useState<Page<HireRequest> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    adminRequest<Page<HireRequest>>("/admin/hire-requests?page_size=50")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: string) {
    try {
      await adminRequest(`/admin/hire-requests/${id}/status?status=${status}`, { method: "PATCH" });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Hire requests</h1>
      <p className="mt-0.5 text-[13px] text-muted">Structured project inquiries from /hire-me.</p>

      {error && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

      {!data ? (
        <p className="mt-8 font-mono text-xs text-faint">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-faint">No hire requests yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.items.map((h) => (
            <li key={h.id} className={`rounded-xl border bg-panel ${h.status === "new" ? "border-accent/40" : "border-line"}`}>
              <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
                onClick={() => { setOpenId(openId === h.id ? null : h.id); if (h.status === "new") void setStatus(h.id, "read"); }}
                aria-expanded={openId === h.id}>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase ${h.status === "new" ? "border-accent/30 bg-accent-soft text-accent-fg" : "border-line-strong text-faint"}`}>{h.status}</span>
                <span className="text-sm font-semibold">{h.project_type}</span>
                <span className="text-xs text-muted">{h.name}{h.company ? ` · ${h.company}` : ""}</span>
                <span className="ml-auto font-mono text-[10px] text-faint">{formatDate(h.created_at)}</span>
              </button>
              {openId === h.id && (
                <div className="border-t border-line px-4 py-4">
                  <dl className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
                    <div><dt className="font-mono text-[10px] uppercase text-faint">Email</dt><dd className="text-muted">{h.email}</dd></div>
                    {h.budget_range && <div><dt className="font-mono text-[10px] uppercase text-faint">Budget</dt><dd className="text-muted">{h.budget_range}</dd></div>}
                    {h.timeline && <div><dt className="font-mono text-[10px] uppercase text-faint">Timeline</dt><dd className="text-muted">{h.timeline}</dd></div>}
                  </dl>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{h.project_description}</p>
                  <div className="mt-4 flex gap-2">
                    <a href={`mailto:${h.email}?subject=${encodeURIComponent(`Re: ${h.project_type} inquiry`)}`
                      } className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white dark:text-[#0a0c10]">Reply via email</a>
                    <button type="button" onClick={() => setStatus(h.id, "archived")}
                      className="rounded-md border border-line-strong px-3 py-1.5 text-[12px] font-semibold text-muted hover:text-fg">Archive</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
