/** Date/label formatting helpers. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string | null | undefined, opts: { month?: "short" | "long" } = {}): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = MONTHS[d.getMonth()];
  return opts.month === "long" ? `${month} ${d.getFullYear()}` : `${month} ${d.getFullYear()}`;
}

export function formatRange(start: string | null, end: string | null, isCurrent?: boolean): string {
  const s = start ? formatDate(start) : "—";
  const e = isCurrent ? "Present" : end ? formatDate(end) : "—";
  return `${s} — ${e}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleCase(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function readingTime(markdown: string | null): number {
  if (!markdown) return 1;
  const words = markdown.split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}
