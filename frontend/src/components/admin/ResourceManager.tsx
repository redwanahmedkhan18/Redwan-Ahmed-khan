"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import { getResource, type AdminResourceConfig } from "@/lib/admin-resources";
import type { Page } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { FieldInput, type FieldDef } from "./fields";

type Row = Record<string, unknown> & { id: string };

interface Props { resourceKey: string }

function emptyForm(fields: FieldDef[]): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const f of fields) {
    v[f.name] =
      f.type === "boolean" ? (f.name === "is_visible" ? true : false)
      : f.type === "stringlist" ? []
      : f.type === "children" ? []
      : f.type === "number" && f.name === "display_order" ? 0
      : null;
  }
  return v;
}

function toForm(row: Row, fields: FieldDef[]): Record<string, unknown> {
  const base = emptyForm(fields);
  for (const f of fields) {
    if (row[f.name] !== undefined && row[f.name] !== null) base[f.name] = row[f.name];
    else if (row[f.name] === null && (f.type === "stringlist" || f.type === "children")) base[f.name] = [];
  }
  return base;
}

function toPayload(form: Record<string, unknown>, fields: FieldDef[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    let v = form[f.name];
    if (f.type === "text" || f.type === "url" || f.type === "textarea" || f.type === "markdown") {
      v = typeof v === "string" && v.trim() === "" ? null : v;
      if (f.type === "url" && typeof v === "string" && v && !/^https?:\/\//.test(v)) v = `https://${v}`;
    }
    if (f.type === "stringlist" && Array.isArray(v)) v = (v as string[]).map((s) => s.trim()).filter(Boolean);
    if (f.type === "children" && Array.isArray(v)) {
      // drop blank rows; keep only meaningful sub-values
      v = (v as Record<string, unknown>[]).filter((item) =>
        Object.values(item).some((x) => x !== "" && x !== null && x !== undefined && x !== false)
      );
    }
    payload[f.name] = v === undefined ? null : v;
  }
  return payload;
}

export default function ResourceManager({ resourceKey }: Props) {
  const config: AdminResourceConfig = useMemo(() => getResource(resourceKey), [resourceKey]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // editor state
  const [editing, setEditing] = useState<Row | null>(null);   // existing row
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "25", sort: "display_order", direction: "asc" });
    if (statusFilter) params.set("status", statusFilter);
    if (q) params.set("q", q);
    return adminRequest<Page<Row>>(`/admin/${config.key}?${params}`)
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
        setListError(null);
      })
      .catch((e: unknown) => {
        setListError(e instanceof Error ? e.message : "Failed to load");
        setRows([]);
      });
  }, [config.key, page, statusFilter, q]);

  useEffect(() => { fetchList(); }, [fetchList]);

  async function run(fn: () => Promise<unknown>, okMessage?: string) {
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      await fn();
      if (okMessage) setNotice(okMessage);
      await fetchList();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed";
      if (editing || creating) setFormError(msg);
      else setListError(msg);
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm(config.fields));
    setFormError(null);
  }

  function openEdit(row: Row) {
    setCreating(false);
    setEditing(row);
    setForm(toForm(row, config.fields));
    setFormError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = toPayload(form, config.fields);
    // drop nulls on create so backend defaults apply
    if (creating) {
      for (const k of Object.keys(payload)) if (payload[k] === null) delete payload[k];
    }
    await run(async () => {
      if (editing) {
        await adminRequest(`/admin/${config.key}/${editing.id}`, { method: "PATCH", body: payload });
      } else {
        await adminRequest(`/admin/${config.key}`, { method: "POST", body: payload });
      }
      setEditing(null);
      setCreating(false);
    }, editing ? `${config.singular} updated` : `${config.singular} created as draft`);
  }

  async function setStatus(row: Row, action: "publish" | "unpublish" | "archive") {
    await run(() => adminRequest(`/admin/${config.key}/${row.id}/${action}`, { method: "POST" }), `${config.singular} ${action === "unpublish" ? "moved to draft" : `${action}ed`}`);
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${String(row[config.columns[0]?.field ?? "id"] ?? row.id)}"? This cannot be undone.`)) return;
    await run(() => adminRequest(`/admin/${config.key}/${row.id}`, { method: "DELETE" }), `${config.singular} deleted`);
  }

  async function move(index: number, dir: -1 | 1) {
    if (!rows) return;
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((r) => r.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(() => adminRequest(`/admin/${config.key}/reorder`, { method: "POST", body: { ordered_ids: ids } }), "Order updated");
  }

  function cellValue(row: Row, col: { field: string; type?: string }): string {
    const v = row[col.field];
    if (v === null || v === undefined || v === "") return "—";
    if (col.type === "date") return formatDate(String(v));
    if (col.type === "bool") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.length ? `${v.length} items` : "—";
    const s = String(v);
    return s.length > 60 ? `${s.slice(0, 60)}…` : s;
  }

  const showEditor = creating || editing !== null;
  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{config.title}</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-faint">
            {total} {total === 1 ? config.singular.toLowerCase() : "entries"}
            {config.publishable ? " · draft → publish → archive workflow" : ""}
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 dark:text-[#0a0c10]">
          + New {config.singular}
        </button>
      </div>

      {notice && (
        <p className="mb-4 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>
      )}
      {listError && (
        <p className="mb-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{listError}</p>
      )}

      {showEditor && (
        <form onSubmit={save} className="mb-8 rounded-xl border border-accent/40 bg-panel p-5 sm:p-6" aria-label={editing ? `Edit ${config.singular}` : `New ${config.singular}`}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold">{editing ? `Edit: ${String(editing[config.columns[0]?.field ?? "id"] ?? "")}` : `New ${config.singular}`}</h2>
            <button type="button" className="text-[13px] font-semibold text-faint hover:text-fg"
              onClick={() => { setEditing(null); setCreating(false); }}>
              Cancel ✕
            </button>
          </div>

          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <FieldInput key={f.name} def={f} value={form[f.name]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))} />
            ))}
          </div>

          {formError && <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{formError}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" disabled={busy}
              className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]">
              {busy ? "Saving…" : editing ? "Save changes" : `Create ${config.singular.toLowerCase()}`}
            </button>
            {editing && config.publishable && editing.status === "draft" && (
              <button type="button" disabled={busy} onClick={() => setStatus(editing, "publish")}
                className="rounded-md border border-ok/40 px-4 py-2 text-[13px] font-semibold text-ok hover:bg-ok/10">
                Save & Publish
              </button>
            )}
            <p className="text-[11px] text-faint">
              {config.publishable ? "New entries are created as drafts. Use Publish when the content is ready for the public site." : "Changes appear on the public site immediately."}
            </p>
          </div>
        </form>
      )}

      {/* filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {config.searchable && (
          <form onSubmit={(e) => { e.preventDefault(); setQ(searchInput); setPage(1); }} className="flex-1 min-w-[200px] max-w-sm">
            <label htmlFor="q" className="sr-only">Search {config.title}</label>
            <input id="q" type="search" className="w-full rounded-md border border-line-strong bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder={`Search ${config.title.toLowerCase()}…`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </form>
        )}
        {config.publishable && (
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select id="status-filter" className="rounded-md border border-line-strong bg-bg px-3 py-2 text-sm"
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-subtle">
              <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-faint w-16">Order</th>
              {config.columns.map((c) => (
                <th key={c.field} scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-faint">{c.label}</th>
              ))}
              <th scope="col" className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-faint">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr><td colSpan={config.columns.length + 2} className="px-4 py-10 text-center text-faint">Loading…</td></tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr><td colSpan={config.columns.length + 2} className="px-4 py-10 text-center text-faint">No entries yet — create the first one above.</td></tr>
            )}
            {rows?.map((row, i) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-subtle/50">
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move up"
                      className="rounded px-1 font-mono text-[11px] text-faint hover:text-accent-fg disabled:opacity-30">▲</button>
                    <button type="button" disabled={busy || i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"
                      className="rounded px-1 font-mono text-[11px] text-faint hover:text-accent-fg disabled:opacity-30">▼</button>
                  </div>
                </td>
                {config.columns.map((c) => (
                  <td key={c.field} className="px-4 py-3 align-middle">
                    {c.type === "status" ? (
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${
                        row[c.field] === "published" ? "border-ok/30 bg-ok/10 text-ok"
                        : row[c.field] === "draft" ? "border-warn/30 bg-warn/10 text-warn"
                        : "border-line-strong bg-subtle text-faint"}`}>
                        {String(row[c.field])}
                      </span>
                    ) : (
                      <span className={c.field === config.columns[0].field ? "font-semibold text-fg" : "text-muted"}>
                        {cellValue(row, c)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button type="button" onClick={() => openEdit(row)} disabled={busy}
                      className="rounded-md border border-line-strong px-2.5 py-1 text-[12px] font-semibold hover:border-accent hover:text-accent-fg">
                      Edit
                    </button>
                    {config.publishable && row.status !== "published" && (
                      <button type="button" onClick={() => setStatus(row, "publish")} disabled={busy}
                        className="rounded-md border border-ok/40 px-2.5 py-1 text-[12px] font-semibold text-ok hover:bg-ok/10">
                        Publish
                      </button>
                    )}
                    {config.publishable && row.status === "published" && (
                      <button type="button" onClick={() => setStatus(row, "unpublish")} disabled={busy}
                        className="rounded-md border border-warn/40 px-2.5 py-1 text-[12px] font-semibold text-warn hover:bg-warn/10">
                        Unpublish
                      </button>
                    )}
                    {config.publishable && row.status !== "archived" && (
                      <button type="button" onClick={() => setStatus(row, "archive")} disabled={busy}
                        className="rounded-md border border-line-strong px-2.5 py-1 text-[12px] font-semibold text-faint hover:text-fg">
                        Archive
                      </button>
                    )}
                    <button type="button" onClick={() => remove(row)} disabled={busy}
                      className="rounded-md border border-line px-2.5 py-1 text-[12px] font-semibold text-faint hover:border-bad hover:text-bad">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-line-strong px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40">
            ← Previous
          </button>
          <span className="font-mono text-[11px] text-faint">Page {page} / {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-line-strong px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40">
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
