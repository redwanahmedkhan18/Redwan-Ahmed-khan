"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { SeoMeta } from "@/lib/types";

const ROUTE_HINTS = ["/", "/about", "/experience", "/projects", "/projects/{slug}", "/research", "/research/{slug}", "/blog", "/blog/{slug}", "/machine-learning", "/open-source", "/achievements", "/testimonials", "/contact", "/hire-me", "/cv", "/admin"];

export default function AdminSeoPage() {
  const [rows, setRows] = useState<SeoMeta[] | null>(null);
  const [form, setForm] = useState({ route: "", title: "", description: "", og_image_url: "", canonical_url: "", noindex: false });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminRequest<SeoMeta[]>("/admin/seo")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(() => { void load(); }, [load]);

  function edit(row: SeoMeta) {
    setForm({
      route: row.route, title: row.title ?? "", description: row.description ?? "",
      og_image_url: row.og_image_url ?? "", canonical_url: row.canonical_url ?? "", noindex: row.noindex,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      await adminRequest("/admin/seo", {
        method: "PUT",
        body: {
          route: form.route,
          title: form.title || null,
          description: form.description || null,
          og_image_url: form.og_image_url || null,
          canonical_url: form.canonical_url || null,
          noindex: form.noindex,
        },
      });
      setNotice(`SEO metadata saved for ${form.route}`);
      setForm({ route: "", title: "", description: "", og_image_url: "", canonical_url: "", noindex: false });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-md border border-line-strong bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">SEO metadata</h1>
      <p className="mt-0.5 text-[13px] text-muted">
        Per-route title/description/OG/canonical overrides. Empty values fall back to sensible defaults generated from content.
        <span className="font-mono"> /admin</span> stays <span className="font-mono">noindex</span>.
      </p>

      {notice && <p className="mt-4 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

      <form onSubmit={save} className="mt-6 rounded-xl border border-accent/40 bg-panel p-5">
        <h2 className="text-sm font-bold">{form.route && rows?.some((r) => r.route === form.route) ? `Edit: ${form.route}` : "New / edit override"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="route">Route</label>
            <input id="route" list="route-hints" className={`${inputCls} font-mono text-[12px]`} value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="/projects/shopmind" required />
            <datalist id="route-hints">
              {ROUTE_HINTS.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="title">Title override</label>
            <input id="title" className={inputCls} value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="canonical">Canonical URL override</label>
            <input id="canonical" className={inputCls} value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="description">Description override</label>
            <textarea id="description" rows={2} className={inputCls} value={form.description} maxLength={320} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="og">Open Graph image URL</label>
            <input id="og" className={inputCls} value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} />
          </div>
          <div className="flex items-center gap-2.5 pt-6">
            <input id="noindex" type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={form.noindex} onChange={(e) => setForm({ ...form, noindex: e.target.checked })} />
            <label htmlFor="noindex" className="text-[12px] font-semibold">noindex this route</label>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={busy} className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]">
            {busy ? "Saving…" : "Save metadata"}
          </button>
          {(form.route || form.title) && (
            <button type="button" onClick={() => setForm({ route: "", title: "", description: "", og_image_url: "", canonical_url: "", noindex: false })}
              className="rounded-md border border-line-strong px-4 py-2 text-[13px] font-semibold text-muted">Clear</button>
          )}
        </div>
      </form>

      <h2 className="mt-8 text-sm font-bold">Configured routes</h2>
      {!rows ? (
        <p className="mt-3 font-mono text-xs text-faint">Loading…</p>
      ) : (
        <ul className="mt-3 overflow-x-auto rounded-xl border border-line bg-panel">
          {rows.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => edit(row)}
                className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-subtle">
                <span className="w-52 shrink-0 font-mono text-[12px] font-semibold text-accent-fg">{row.route}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{row.title ?? "—"}</span>
                {row.noindex && <span className="rounded border border-bad/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-bad">noindex</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
