import Link from "next/link";

interface HeroProps {
  name: string;
  headline: string;
  tagline: string | null;
  location: string | null;
  openToWork: boolean;
  socials: { platform: string; url: string; label: string | null }[];
  primaryCtas: { label: string; href: string }[];
  secondaryCtas: { label: string; href: string }[];
}

/**
 * Hero — technically confident, credible. No "world's best / 10x / visionary" claims.
 * Server-rendered markup; zero client JS.
 */
export default function Hero(props: HeroProps) {
  return (
    <section className="bg-grid border-b border-line" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
        <div className="max-w-3xl">
          <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${props.openToWork ? "bg-ok" : "bg-faint"}`} aria-hidden="true" />
              {props.openToWork ? "Open to opportunities" : "AI / Software / Research"}
            </span>
            {props.location && <span aria-hidden="true">·</span>}
            {props.location && <span>{props.location}</span>}
          </p>

          <h1 id="hero-heading" className="mt-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {props.name}
          </h1>

          <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.12em] text-accent-fg sm:text-sm">
            {props.headline}
          </p>

          {props.tagline && (
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">{props.tagline}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {props.primaryCtas.map((cta, i) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={`rounded-md px-5 py-2.5 text-sm font-semibold transition-colors ${
                  i === 0
                    ? "bg-accent text-white hover:opacity-90 dark:text-[#0a0c10]"
                    : "border border-line-strong bg-panel hover:border-accent hover:text-accent-fg"
                }`}
              >
                {cta.label}
              </Link>
            ))}
            {props.secondaryCtas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-accent-fg hover:underline"
              >
                {cta.label}
              </Link>
            ))}
          </div>

          {props.socials.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5" aria-label="Profiles">
              {props.socials.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="font-mono text-[11px] uppercase tracking-wider text-faint transition-colors hover:text-accent-fg"
                  >
                    {s.label ?? s.platform} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
