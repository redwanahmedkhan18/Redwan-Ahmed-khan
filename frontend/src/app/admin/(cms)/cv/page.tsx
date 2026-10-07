"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { CVVersion, MediaAsset, Page } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";

export default function AdminCVPage() {
  const [cvs, setCvs] = useState<CVVersion[] | null>(null);
  const [pdfs, setPdfs] = useState<MediaAsset[]>([]);
  const [label, setLabel] = useState("");
  const [assetId, setAssetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      adminRequest<CVVersion[]>("/admin/cv"),
      adminRequest<Page<MediaAsset>>("/admin/media?kind=document&page_size=50"),
    ]).then(([list, media]) => {
      setCvs(list);
      setPdfs(media.items.filter((m) => m.mime_type === "application/pdf"));
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !assetId) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await adminRequest("/admin/cv", { method: "POST", body: { label, asset_id: assetId, make_current: true } });
      setNotice("CV uploaded and marked current. The public Download CV button now serves this file.");
      setLabel(""); setAssetId("");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  }

  async function makeCurrent(id: string) {
    setBusy(true);
    try {
      await adminRequest(`/admin/cv/${id}/make-current`, { method: "POST" });
      setNotice("This CV version is now current; the previous one was archived.");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-md border border-line-strong bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">CV management</h1>
      <p className="mt-0.5 text-[13px] text-muted">
        Upload PDFs from <span className="font-mono">Media → Documents</span>, then mark one as current.
        Previous versions are archived, never hardlinked. Download counts are aggregate-only (no personal data).
      </p>

      {notice && <p className="mt-4 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

      <form onSubmit={create} className="mt-6 rounded-xl border border-line bg-panel p-5">
        <h2 className="text-sm font-bold">Add CV version</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="cv-label">Label</label>
            <input id="cv-label" className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. CV 2026 — English" required />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="cv-asset">PDF asset</label>
            <select id="cv-asset" className={inputCls} value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
              <option value="">Select a PDF…</option>
              {pdfs.map((p) => (
                <option key={p.id} value={p.id}>{p.original_filename ?? p.filename} ({formatBytes(p.size_bytes)})</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={busy || pdfs.length === 0}
            className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]">
            {busy ? "Working…" : "Upload & make current"}
          </button>
        </div>
        {pdfs.length === 0 && <p className="mt-3 text-xs text-faint">No PDFs in the media library yet — upload one from the Media page first.</p>}
      </form>

      <h2 className="mt-8 text-sm font-bold">Versions</h2>
      {cvs === null ? (
        <p className="mt-3 font-mono text-xs text-faint">Loading…</p>
      ) : cvs.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-faint">No CV versions yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cvs.map((cv) => (
            <li key={cv.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase ${cv.is_current ? "border-ok/30 bg-ok/10 text-ok" : "border-line-strong text-faint"}`}>
                {cv.is_current ? "Current" : cv.status}
              </span>
              <span className="text-sm font-semibold">{cv.label}</span>
              <span className="font-mono text-[10px] text-faint">{formatBytes(cv.asset.size_bytes)} · {formatDate(cv.created_at)} · {cv.download_count} downloads</span>
              <span className="ml-auto flex gap-2">
                <a href={cv.asset.storage_url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-line-strong px-2.5 py-1 text-[12px] font-semibold text-muted hover:border-accent hover:text-accent-fg">Preview</a>
                {!cv.is_current && (
                  <button type="button" onClick={() => makeCurrent(cv.id)} disabled={busy}
                    className="rounded-md border border-ok/40 px-2.5 py-1 text-[12px] font-semibold text-ok hover:bg-ok/10">
                    Make current
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
