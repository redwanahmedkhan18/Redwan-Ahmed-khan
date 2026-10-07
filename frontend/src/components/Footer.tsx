import Link from "next/link";
import { getSocialLinks } from "@/lib/api";
import { titleCase } from "@/lib/format";

const COLUMNS = [
  {
    heading: "Portfolio",
    links: [
      { href: "/about", label: "About" },
      { href: "/experience", label: "Experience" },
      { href: "/projects", label: "Projects" },
      { href: "/machine-learning", label: "Machine Learning" },
    ],
  },
  {
    heading: "Research & Writing",
    links: [
      { href: "/research", label: "Research" },
      { href: "/open-source", label: "Open Source" },
      { href: "/achievements", label: "Achievements" },
      { href: "/blog", label: "Writing" },
    ],
  },
  {
    heading: "Get in touch",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/hire-me", label: "Hire Me" },
      { href: "/cv", label: "Download CV" },
      { href: "/testimonials", label: "Testimonials" },
    ],
  },
];

export default async function Footer() {
  const socials = await getSocialLinks();
  const year = new Date().getFullYear(); // dynamic — never hardcoded

  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <p className="text-base font-semibold tracking-tight">Redwan Ahmed Khan</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              Artificial Intelligence Engineer · Software Engineer · Researcher
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Building intelligent software systems, production AI solutions and research-driven
              applications across AI/ML, NLP, LLMs and modern software engineering.
            </p>
            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2" aria-label="Professional profiles">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="text-[13px] font-medium text-muted underline-offset-4 transition-colors hover:text-accent-fg hover:underline"
                    >
                      {s.label ?? titleCase(s.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{col.heading}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[13px] text-muted transition-colors hover:text-fg">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Redwan Ahmed Khan</p>
          <p className="font-mono">Built with Next.js · FastAPI · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
