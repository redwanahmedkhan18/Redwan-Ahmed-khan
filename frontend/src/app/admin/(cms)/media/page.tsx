"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { MediaAsset, Page } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState("image");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    adminRequest<Page<MediaAsset>>(`/admin/media?kind=${kind}&page_size=60`)
      .then((p) => setAssets(p.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load media"));
  }, [kind]);

  useEffect(() => { void load(); }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await adminRequest(`/admin/media/upload?kind=${kind}`, { method: "POST", body: fd, isFormData: true });
      setNotice(`Uploaded ${file.name}`);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveMeta() {
    if (!editing) return;
    setBusy(true);
    try {
      await adminRequest(`/admin/media/${editing.id}`, { method: "PATCH", body: { alt_text: altText, caption } });
      setNotice("Metadata saved — remember: meaningful alt text is an accessibility requirement.");
      setEditing(null);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-md border border-line-strong bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Media library</h1>
          <p className="mt-0.5 text-[13px] text-muted">Images, diagrams, certificates and documents. Type & size validated on upload (max 10 MB).</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="kind" className="sr-only">Asset kind</label>
          <select id="kind" className="rounded-md border border-line-strong bg-bg px-3 py-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="image">Images</option>
            <option value="document">Documents (PDF)</option>
          </select>
          <input ref={fileRef} type="file" id="upload" className="sr-only"
            accept={kind === "image" ? "image/png,image/jpeg,image/webp,image/gif,image/svg+xml" : "application/pdf"}
            onChange={upload} disabled={busy} />
          <label htmlFor="upload"
            className="cursor-pointer rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 dark:text-[#0a0c10]">
            {busy ? "Uploading…" : "Upload"}
          </label>
        </div>
      </div>

      {notice && <p className="mt-4 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

      {editing && (
        <div className="mt-5 rounded-xl border border-accent/40 bg-panel p-5">
          <h2 className="text-sm font-bold">Edit metadata — {editing.original_filename ?? editing.filename}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="alt">Alt text (accessibility)</label>
              <input id="alt" className={inputCls} value={altText} onChange={(e) => setAltText(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="caption">Caption</label>
              <input id="caption" className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={saveMeta} disabled={busy} className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white dark:text-[#0a0c10]">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-line-strong px-4 py-2 text-[13px] font-semibold text-muted">Cancel</button>
          </div>
        </div>
      )}

      {assets === null ? (
        <p className="mt-8 font-mono text-xs text-faint">Loading media…</p>
      ) : assets.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="text-sm text-muted">No {kind} assets yet.</p>
          <p className="mt-1 text-xs text-faint">Upload project screenshots, logos, architecture diagrams, certificates or the CV PDF.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-xl border border-line bg-panel">
              <div className="flex h-32 items-center justify-center bg-subtle">
                {a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.storage_url} alt={a.alt_text ?? ""} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="font-mono text-[10px] uppercase text-faint">{a.mime_type}</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold">{a.original_filename ?? a.filename}</p>
                <p className="mt-0.5 font-mono text-[10px] text-faint">{formatBytes(a.size_bytes)} · {formatDate(a.created_at)}</p>
                <button type="button"
                  className="mt-2 w-full rounded-md border border-line-strong px-2 py-1 text-[11px] font-semibold text-muted hover:border-accent hover:text-accent-fg"
                  onClick={() => { setEditing(a); setAltText(a.alt_text ?? ""); setCaption(a.caption ?? ""); }}>
                  Edit alt / caption
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
