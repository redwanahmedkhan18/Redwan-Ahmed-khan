import type { SkillCategory } from "@/lib/types";
import { EmptyState, Tag } from "./ui";

/**
 * Categorized technology tags/cards.
 * Intentionally NO percentage progress bars — only explicit labels
 * (proficiency_label / years_experience) when the admin has entered them.
 */
export default function SkillGrid({ categories }: { categories: SkillCategory[] }) {
  const visible = categories.filter((c) => c.skills.length > 0);
  if (visible.length === 0) {
    return <EmptyState title="No skills published yet." hint="Skills are managed from the admin CMS." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((cat) => (
        <section key={cat.id} aria-labelledby={`skills-${cat.slug}`} className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id={`skills-${cat.slug}`} className="text-sm font-bold tracking-tight">
              {cat.name}
            </h3>
            <span className="font-mono text-[10px] text-faint">{cat.skills.length}</span>
          </div>
          {cat.description && <p className="mt-1 text-xs text-muted">{cat.description}</p>}
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {cat.skills.map((skill) => (
              <li key={skill.id}>
                <Tag href={skill.official_url ?? undefined}>{skill.name}</Tag>
              </li>
            ))}
          </ul>
          {cat.skills.some((s) => s.proficiency_label || s.years_experience != null) && (
            <ul className="mt-4 space-y-1 border-t border-line pt-3 text-[11px] text-faint">
              {cat.skills
                .filter((s) => s.proficiency_label || s.years_experience != null)
                .map((s) => (
                  <li key={s.id} className="font-mono">
                    {s.name}
                    {s.proficiency_label && ` — ${s.proficiency_label}`}
                    {s.years_experience != null && ` — ${s.years_experience}+ yrs`}
                  </li>
                ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
