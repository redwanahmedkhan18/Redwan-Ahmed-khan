import Link from "next/link";

export default function NotFoundContent() {
  return (
    <div className="bg-grid">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-fg">Error 404</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">This route does not exist.</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          The page you were looking for isn&apos;t here — it may have been moved, unpublished, or never existed.
        </p>
        <nav aria-label="Suggested destinations" className="mt-8">
          <ul className="flex flex-wrap justify-center gap-3">
            {[
              { href: "/projects", label: "Projects" },
              { href: "/research", label: "Research" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block rounded-md border border-line-strong bg-panel px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/" className="mt-8 font-mono text-[11px] uppercase tracking-wider text-faint hover:text-accent-fg">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
