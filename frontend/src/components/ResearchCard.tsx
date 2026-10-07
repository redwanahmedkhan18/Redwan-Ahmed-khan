import Link from "next/link";
import type { ResearchPaper } from "@/lib/types";
import { ActionLink, StatusBadge, Tag } from "./ui";

const LINK_LABELS: Record<string, string> = {
  paper: "Read Paper",
  doi: "DOI",
  publication: "Publication",
  github: "GitHub",
  dataset: "Dataset",
  code: "Code",
};

export default function ResearchCard({ paper }: { paper: ResearchPaper }) {
  const authors = paper.authors.map((a) => a.name).join(", ");
  return (
    <article className="group flex flex-col rounded-xl border border-line bg-panel p-5 transition-colors hover:border-line-strong sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={paper.research_status} />
        {paper.publication_year && (
          <span className="font-mono text-[11px] text-faint">{paper.publication_year}</span>
        )}
        {paper.venue && <span className="font-mono text-[11px] text-faint">· {paper.venue}</span>}
      </div>

      <h3 className="mt-3 text-[17px] font-bold leading-snug tracking-tight">
        <Link href={`/research/${paper.slug}`} className="transition-colors group-hover:text-accent-fg">
          {paper.title}
        </Link>
      </h3>

      {authors && (
        <p className="mt-2 text-[13px] text-muted">
          {paper.authors.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ", "}
              {a.is_self ? <strong className="font-semibold text-fg">{a.name}</strong> : a.name}
            </span>
          ))}
        </p>
      )}

      {(paper.short_description || paper.abstract) && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {paper.short_description ?? paper.abstract}
        </p>
      )}

      {paper.research_area.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Research areas">
          {paper.research_area.slice(0, 6).map((area) => (
            <li key={area}>
              <Tag>{area}</Tag>
            </li>
          ))}
        </ul>
      )}

      {/* Only display resources that actually exist */}
      {paper.links.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {paper.links.map((l) => (
            <ActionLink key={l.id} href={l.url}>
              {LINK_LABELS[l.kind] ?? l.kind}
            </ActionLink>
          ))}
        </div>
      )}
    </article>
  );
}
