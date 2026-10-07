"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Home", exact: true },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/research", label: "Research" },
  { href: "/open-source", label: "Open Source" },
  { href: "/blog", label: "Writing" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  // `openedOn` records the pathname the menu was opened on — navigation
  // implicitly closes the menu without a setState-in-effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled ? "border-line bg-bg/90 backdrop-blur-md" : "border-transparent bg-bg"
      }`}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Redwan Ahmed Khan — home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-panel font-mono text-[13px] font-bold text-accent-fg">
            RK
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">
            Redwan Ahmed Khan
            <span className="block font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-faint">
              AI · Software · Research
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive(item.href, item.exact) ? "text-accent-fg" : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/cv"
            className="hidden rounded-md border border-line px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg md:block"
          >
            Download CV
          </Link>
          <Link
            href="/hire-me"
            className="hidden rounded-md bg-accent px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 dark:text-[#0a0c10] sm:block"
          >
            Hire Me
          </Link>
          <button
            type="button"
            className="rounded-md border border-line p-2 text-muted lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpenedOn(open ? null : pathname)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-panel lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpenedOn(null)}
                  aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                  className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                    isActive(item.href, item.exact) ? "bg-accent-soft text-accent-fg" : "text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2 border-t border-line pt-3">
              <Link href="/cv" onClick={() => setOpenedOn(null)} className="flex-1 rounded-md border border-line px-3 py-2 text-center text-sm font-medium text-muted">
                Download CV
              </Link>
              <Link href="/hire-me" onClick={() => setOpenedOn(null)} className="flex-1 rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-white dark:text-[#0a0c10]">
                Hire Me
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
