"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";

interface SettingRow { id: string; key: string; value: unknown; description: string | null }

const DEFAULT_KEYS = ["hire_services", "contact_purposes", "hero_ctas", "analytics_enabled"];

export default function AdminSettingsPage() {
  const [rows, setRows] = useState<SettingRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");

  const load = useCallback(() => {
    adminRequest<SettingRow[]>("/admin/settings")
      .then((r) => {
        setRows(r);
        setDrafts(Object.fromEntries(r.map((row) => [row.key, JSON.stringify(row.value, null, 2)])));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(key: string) {
    setBusyKey(key); setError(null); setNotice(null);
    try {
      let value: unknown;
      try {
        value = JSON.parse(drafts[key]);
      } catch {
        throw new Error(`"${key}" must contain valid JSON.`);
      }
      await adminRequest("/admin/settings", { method: "PUT", body: { key, value } });
      setNotice(`Setting "${key}" saved.`);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally { setBusyKey(null); }
  }

  async function addSetting(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    setBusyKey(newKey); setError(null);
    try {
      await adminRequest("/admin/settings", { method: "PUT", body: { key: newKey.trim(), value: null } });
      setNewKey("");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setBusyKey(null); }
  }

  const known = new Set((rows ?? []).map((r) => r.key));
  const suggested = DEFAULT_KEYS.filter((k) => !known.has(k));

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Site settings</h1>
      <p className="mt-0.5 text-[13px] text-muted">
        Key/value configuration consumed by the frontend (hire services, hero CTAs, contact purposes…). Values are JSON.
      </p>

      {notice && <p className="mt-4 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

      {!rows ? (
        <p className="mt-8 font-mono text-xs text-faint">Loading…</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[13px] font-bold text-accent-fg">{row.key}</p>
                {row.description && <p className="text-xs text-faint">{row.description}</p>}
              </div>
              <label htmlFor={`s-${row.key}`} className="sr-only">Value for {row.key}</label>
              <textarea id={`s-${row.key}`} rows={Math.min(14, Math.max(3, (drafts[row.key] ?? "").split("\n").length))}
                className="mt-3 w-full rounded-md border border-line-strong bg-bg px-3 py-2 font-mono text-[12px] focus:border-accent focus:outline-none"
                value={drafts[row.key] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [row.key]: e.target.value })} />
              <button type="button" onClick={() => save(row.key)} disabled={busyKey === row.key}
                className="mt-2 rounded-md bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]">
                {busyKey === row.key ? "Saving…" : "Save"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addSetting} className="mt-8 rounded-xl border border-dashed border-line-strong bg-panel/50 p-4">
        <h2 className="text-sm font-bold">Add setting</h2>
        {suggested.length > 0 && (
          <p className="mt-1 text-xs text-faint">
            Known keys: {suggested.map((k) => (
              <button key={k} type="button" className="mx-0.5 font-mono text-accent-fg underline-offset-2 hover:underline" onClick={() => setNewKey(k)}>{k}</button>
            ))}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <label htmlFor="new-key" className="sr-only">New setting key</label>
          <input id="new-key" className="flex-1 rounded-md border border-line-strong bg-bg px-3 py-2 font-mono text-[12px] focus:border-accent focus:outline-none"
            placeholder="setting_key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <button type="submit" className="rounded-md border border-line-strong px-3.5 py-2 text-[12px] font-semibold hover:border-accent hover:text-accent-fg">Add</button>
        </div>
      </form>
    </div>
  );
}
