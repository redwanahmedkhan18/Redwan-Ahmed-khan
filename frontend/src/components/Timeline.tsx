import type { ReactNode } from "react";
import { formatRange } from "@/lib/format";
import { Tag } from "./ui";

export interface TimelineItemData {
  id: string;
  title: string;
  org: string;
  orgHref?: string | null;
  meta: string;
  subtitle?: string | null;
  body?: ReactNode;
  tags?: string[];
  current?: boolean;
}

export function TimelineItem({ item }: { item: TimelineItemData }) {
  return (
    <li className="relative grid grid-cols-[auto_1fr] gap-x-5 pb-10 last:pb-0 sm:gap-x-8">
      {/* rail */}
      <div className="flex flex-col items-center">
        <span
          className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
            item.current ? "border-accent bg-accent" : "border-line-strong bg-bg"
          }`}
          aria-hidden="true"
        />
        <span className="w-px flex-1 bg-line" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-base font-bold tracking-tight">{item.title}</h3>
          {item.current && (
            <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-fg">
              Current
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm font-medium text-muted">
          {item.orgHref ? (
            <a href={item.orgHref} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-accent-fg hover:underline">
              {item.org}
            </a>
          ) : (
            item.org
          )}
          {item.subtitle && <span className="text-faint"> · {item.subtitle}</span>}
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{item.meta}</p>
        {item.body && <div className="mt-3 text-sm leading-relaxed text-muted">{item.body}</div>}
        {item.tags && item.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Technologies">
            {item.tags.map((t) => (
              <li key={t}>
                <Tag>{t}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function Timeline({ items }: { items: TimelineItemData[] }) {
  return (
    <ol className="relative">
      {items.map((item) => (
        <TimelineItem key={item.id} item={item} />
      ))}
    </ol>
  );
}

export function experienceRange(start: string | null, end: string | null, isCurrent: boolean, location: string | null, workMode: string | null): string {
  const parts = [formatRange(start, end, isCurrent)];
  if (location) parts.push(location);
  if (workMode) parts.push(workMode);
  return parts.join(" · ");
}
