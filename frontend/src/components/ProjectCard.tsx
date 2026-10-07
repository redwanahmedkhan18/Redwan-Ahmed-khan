import Link from "next/link";
import type { Project } from "@/lib/types";
import { ActionLink, StatusBadge, Tag } from "./ui";

const LINK_LABELS: Record<string, string> = {
  github: "GitHub",
  live_demo: "Live Demo",
  documentation: "Docs",
  case_study: "Case Study",
  video: "Video",
};

export default function ProjectCard({ project, detailed = false }: { project: Project; detailed?: boolean }) {
  return (
    <article className="group flex flex-col rounded-xl border border-line bg-panel transition-colors hover:border-line-strong">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            {project.category && (
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{project.category}</p>
            )}
            <h3 className="mt-1 text-lg font-bold tracking-tight">
              <Link href={`/projects/${project.slug}`} className="transition-colors group-hover:text-accent-fg">
                {project.name}
              </Link>
            </h3>
          </div>
          {project.project_status && <StatusBadge status={project.project_status} />}
        </div>

        {project.short_description && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{project.short_description}</p>
        )}

        {project.technologies.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies used">
            {project.technologies.slice(0, detailed ? 14 : 8).map((t) => (
              <li key={t.id}>
                <Tag>{t.name}</Tag>
              </li>
            ))}
            {!detailed && project.technologies.length > 8 && (
              <li>
                <Tag>+{project.technologies.length - 8}</Tag>
              </li>
            )}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 pt-1">
          {/* Case study always available on the detail route */}
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-panel px-3 py-1.5 text-[13px] font-semibold transition-colors hover:border-accent hover:text-accent-fg"
          >
            Case Study
          </Link>
          {project.links.map((l) => (
            <ActionLink key={l.id} href={l.url}>
              {l.label ?? LINK_LABELS[l.kind] ?? l.kind}
            </ActionLink>
          ))}
        </div>
      </div>
    </article>
  );
}
