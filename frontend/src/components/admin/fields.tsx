"use client";

import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { MediaAsset, Page } from "@/lib/types";
import { formatBytes } from "@/lib/format";

/* ---------------- field definition model ---------------- */

export type FieldType =
  | "text" | "url" | "textarea" | "markdown" | "number" | "float" | "date"
  | "select" | "boolean" | "stringlist" | "children" | "json" | "media" | "resource-select";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
  placeholder?: string;
  rows?: number;
  min?: number;
  max?: number;
  /** for children: sub-field defs + label for one item */
  children?: FieldDef[];
  itemLabel?: string;
  /** for resource-select */
  resourceKey?: string;
  resourceLabelField?: string;
}

/* ---------------- inputs ---------------- */

const inputCls =
  "w-full rounded-md border border-line-strong bg-bg px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none";
const labelCls = "mb-1.5 block text-[12px] font-semibold text-fg";

function FieldShell({ def, children }: { def: FieldDef; children: React.ReactNode }) {
  return (
    <div className={def.type === "markdown" || def.type === "children" || def.type === "stringlist" ? "sm:col-span-2" : ""}>
      <label className={labelCls} htmlFor={`f-${def.name}`}>
        {def.label} {def.required && <span className="text-bad" aria-hidden="true">*</span>}
      </label>
      {children}
      {def.help && <p className="mt-1 text-[11px] text-faint">{def.help}</p>}
    </div>
  );
}

export function StringListInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const items = value ?? [];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            aria-label={`Item ${i + 1}`}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button type="button" className="shrink-0 rounded-md border border-line px-2.5 text-faint hover:border-bad hover:text-bad"
            onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="rounded-md border border-dashed border-line-strong px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-accent-fg"
        onClick={() => onChange([...items, ""])}>
        + Add item
      </button>
    </div>
  );
}

export function ChildrenInput({ def, value, onChange }: { def: FieldDef; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void }) {
  const items = value ?? [];
  const subs = def.children ?? [];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-line bg-subtle p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{def.itemLabel ?? "Item"} {i + 1}</span>
            <button type="button" className="text-[11px] font-semibold text-faint hover:text-bad"
              onClick={() => onChange(items.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {subs.map((sub) => (
              <div key={sub.name} className={sub.type === "boolean" ? "flex items-center gap-2" : ""}>
                {sub.type === "select" ? (
                  <>
                    <label className="mb-1 block text-[11px] font-medium text-muted">{sub.label}</label>
                    <select className={inputCls} value={String(item[sub.name] ?? sub.options?.[0] ?? "")}
                      onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, [sub.name]: e.target.value } : it)))}>
                      {(sub.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </>
                ) : sub.type === "boolean" ? (
                  <>
                    <input id={`${def.name}-${i}-${sub.name}`} type="checkbox" className="h-4 w-4 accent-[var(--accent)]"
                      checked={Boolean(item[sub.name])}
                      onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, [sub.name]: e.target.checked } : it)))} />
                    <label htmlFor={`${def.name}-${i}-${sub.name}`} className="text-[11px] font-medium text-muted">{sub.label}</label>
                  </>
                ) : (
                  <>
                    <label className="mb-1 block text-[11px] font-medium text-muted">{sub.label}</label>
                    <input className={inputCls} value={String(item[sub.name] ?? "")} placeholder={sub.placeholder}
                      onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, [sub.name]: e.target.value } : it)))} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="rounded-md border border-dashed border-line-strong px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-accent-fg"
        onClick={() => {
          const blank: Record<string, unknown> = {};
          for (const sub of subs) blank[sub.name] = sub.type === "boolean" ? false : sub.type === "select" ? sub.options?.[0] ?? "" : "";
          onChange([...items, blank]);
        }}>
        + Add {def.itemLabel ?? "item"}
      </button>
    </div>
  );
}

export function MediaPicker({ value, onChange, kind = "image" }: { value: string | null; onChange: (v: string | null) => void; kind?: string }) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminRequest<Page<MediaAsset>>(`/admin/media?kind=${kind}&page_size=24`)
      .then((p) => setAssets(p.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load media"));
  }, [kind]);

  const selected = assets?.find((a) => a.id === value);

  return (
    <div>
      {value && selected && (
        <div className="mb-2 flex items-center gap-3 rounded-md border border-accent/40 bg-accent-soft px-3 py-2">
          {selected.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.storage_url} alt={selected.alt_text ?? ""} className="h-10 w-10 rounded object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded bg-panel font-mono text-[9px] text-muted">PDF</span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-fg">{selected.original_filename ?? selected.filename} · {formatBytes(selected.size_bytes)}</span>
          <button type="button" className="text-[11px] font-semibold text-faint hover:text-bad" onClick={() => onChange(null)}>Clear</button>
        </div>
      )}
      {!value && (
        <>
          {error && <p className="mb-2 text-xs text-bad">{error}</p>}
          {assets === null && !error && <p className="text-xs text-faint">Loading media…</p>}
          {assets && assets.length === 0 && (
            <p className="text-xs text-faint">No media uploaded yet — upload from the Media page first.</p>
          )}
          {assets && assets.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {assets.map((a) => (
                <button key={a.id} type="button" onClick={() => onChange(a.id)}
                  className="overflow-hidden rounded-md border border-line hover:border-accent"
                  title={a.original_filename ?? a.filename}
                  aria-label={`Select ${a.original_filename ?? a.filename}`}>
                  {a.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.storage_url} alt={a.alt_text ?? ""} className="h-14 w-full object-cover" />
                  ) : (
                    <span className="flex h-14 w-full items-center justify-center bg-subtle font-mono text-[9px] text-muted">{a.mime_type.split("/")[1]}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ResourceSelect({ def, value, onChange }: { def: FieldDef; value: string | null; onChange: (v: string | null) => void }) {
  const [options, setOptions] = useState<{ id: string; label: string }[] | null>(null);
  useEffect(() => {
    adminRequest<Page<Record<string, unknown>>>(`/admin/${def.resourceKey}?page_size=200`)
      .then((p) => setOptions(p.items.map((i) => ({ id: String(i.id), label: String(i[def.resourceLabelField ?? "name"] ?? i.id) }))))
      .catch(() => setOptions([]));
  }, [def.resourceKey, def.resourceLabelField]);

  return (
    <select className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{options === null ? "Loading…" : "Select…"}</option>
      {(options ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

export function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  switch (def.type) {
    case "textarea":
      return (
        <FieldShell def={def}>
          <textarea id={`f-${def.name}`} className={inputCls} rows={def.rows ?? 3} value={String(value ?? "")}
            placeholder={def.placeholder} required={def.required} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case "markdown":
      return (
        <FieldShell def={def}>
          <textarea id={`f-${def.name}`} className={`${inputCls} font-mono text-[12px] leading-relaxed`} rows={def.rows ?? 14}
            value={String(value ?? "")} placeholder={def.placeholder ?? "Markdown supported"} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case "number":
    case "float":
      return (
        <FieldShell def={def}>
          <input id={`f-${def.name}`} type="number" className={inputCls} step={def.type === "float" ? "0.01" : "1"}
            min={def.min} max={def.max} required={def.required}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : def.type === "float" ? parseFloat(e.target.value) : parseInt(e.target.value, 10))} />
        </FieldShell>
      );
    case "date":
      return (
        <FieldShell def={def}>
          <input id={`f-${def.name}`} type="date" className={inputCls} required={def.required}
            value={value ? String(value).slice(0, 10) : ""}
            onChange={(e) => onChange(e.target.value || null)} />
        </FieldShell>
      );
    case "select":
      return (
        <FieldShell def={def}>
          <select id={`f-${def.name}`} className={inputCls} required={def.required} value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value || null)}>
            <option value="">—</option>
            {(def.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </FieldShell>
      );
    case "boolean":
      return (
        <div className="flex items-center gap-2.5 pt-6">
          <input id={`f-${def.name}`} type="checkbox" className="h-4 w-4 accent-[var(--accent)]"
            checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <label htmlFor={`f-${def.name}`} className="text-[12px] font-semibold">{def.label}</label>
          {def.help && <span className="text-[11px] text-faint">({def.help})</span>}
        </div>
      );
    case "stringlist":
      return (
        <FieldShell def={def}>
          <StringListInput value={(value as string[]) ?? []} onChange={onChange} placeholder={def.placeholder} />
        </FieldShell>
      );
    case "children":
      return (
        <FieldShell def={def}>
          <ChildrenInput def={def} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} />
        </FieldShell>
      );
    case "json":
      return (
        <FieldShell def={def}>
          <textarea id={`f-${def.name}`} className={`${inputCls} font-mono text-[12px]`} rows={def.rows ?? 4}
            value={value === null || value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            placeholder='{"key": "value"}'
            onChange={(e) => {
              const raw = e.target.value;
              if (raw.trim() === "") { onChange(null); return; }
              try { onChange(JSON.parse(raw)); } catch { onChange(raw); } // keep raw; submit will fail validation visibly
            }} />
          <p className="mt-1 text-[11px] text-faint">{def.help ?? "Must be valid JSON."}</p>
        </FieldShell>
      );
    case "media":
      return (
        <FieldShell def={def}>
          <MediaPicker value={(value as string | null) ?? null} onChange={onChange} />
        </FieldShell>
      );
    case "resource-select":
      return (
        <FieldShell def={def}>
          <ResourceSelect def={def} value={(value as string | null) ?? null} onChange={onChange} />
        </FieldShell>
      );
    default: // text | url
      return (
        <FieldShell def={def}>
          <input id={`f-${def.name}`} type={def.type === "url" ? "url" : "text"} className={inputCls}
            value={String(value ?? "")} placeholder={def.placeholder} required={def.required}
            onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
  }
}
