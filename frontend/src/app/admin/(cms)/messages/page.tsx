"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { ContactMessage, Page } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function AdminMessagesPage() {
  const [data, setData] = useState<Page<ContactMessage> | null>(null);
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: "1", page_size: "50" });
    if (filter) params.set("status", filter);
    adminRequest<Page<ContactMessage>>(`/admin/messages?${params}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: string) {
    try {
      await adminRequest(`/admin/messages/${id}/status?status=${status}`, { method: "PATCH" });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contact inbox</h1>
          <p className="mt-0.5 text-[13px] text-muted">Messages submitted via the public contact form.</p>
        </div>
        <div>
          <label htmlFor="mf" className="sr-only">Filter</label>
          <select id="mf" className="rounded-md border border-line-strong bg-bg px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

      {!data ? (
        <p className="mt-8 font-mono text-xs text-faint">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-faint">No messages.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.items.map((m) => (
            <li key={m.id} className={`rounded-xl border bg-panel ${m.status === "new" ? "border-accent/40" : "border-line"}`}>
              <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
                onClick={() => { setOpenId(openId === m.id ? null : m.id); if (m.status === "new") void setStatus(m.id, "read"); }}
                aria-expanded={openId === m.id}>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase ${m.status === "new" ? "border-accent/30 bg-accent-soft text-accent-fg" : "border-line-strong text-faint"}`}>{m.status}</span>
                <span className="text-sm font-semibold">{m.subject}</span>
                <span className="text-xs text-muted">{m.name} · {m.purpose}</span>
                <span className="ml-auto font-mono text-[10px] text-faint">{formatDate(m.created_at)}</span>
              </button>
              {openId === m.id && (
                <div className="border-t border-line px-4 py-4">
                  <p className="font-mono text-[11px] text-faint">{m.email}</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{m.message}</p>
                  <div className="mt-4 flex gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white dark:text-[#0a0c10]">Reply via email</a>
                    <button type="button" onClick={() => setStatus(m.id, "archived")}
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
