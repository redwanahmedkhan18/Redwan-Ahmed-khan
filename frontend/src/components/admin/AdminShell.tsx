"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";

const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  { group: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    group: "Content",
    items: [
      { href: "/admin/profile", label: "Profile" },
      { href: "/admin/education", label: "Education" },
      { href: "/admin/experience", label: "Experience" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/ml-projects", label: "ML Projects" },
      { href: "/admin/research", label: "Research" },
      { href: "/admin/open-source", label: "Open Source" },
      { href: "/admin/skills", label: "Skills" },
      { href: "/admin/skill-categories", label: "Skill Categories" },
      { href: "/admin/achievements", label: "Achievements" },
      { href: "/admin/certifications", label: "Certifications" },
      { href: "/admin/testimonials", label: "Testimonials" },
      { href: "/admin/blog", label: "Blog" },
      { href: "/admin/social-links", label: "Social Links" },
    ],
  },
  {
    group: "Assets & CV",
    items: [
      { href: "/admin/media", label: "Media" },
      { href: "/admin/cv", label: "CV" },
    ],
  },
  {
    group: "Inbox",
    items: [
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/hire-requests", label: "Hire Requests" },
    ],
  },
  {
    group: "Site",
    items: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/seo", label: "SEO" },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const navOpen = openedOn !== null && openedOn === pathname;

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint" role="status">Checking session…</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-line bg-panel transition-transform lg:static lg:translate-x-0 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Admin navigation">
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-bg font-mono text-[11px] font-bold text-accent-fg">RK</span>
          <div>
            <p className="text-[13px] font-bold leading-tight">Portfolio CMS</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-faint">Admin</p>
          </div>
        </div>
        <nav className="px-3 py-4">
          {NAV.map((group) => (
            <div key={group.group} className="mb-5">
              <p className="mb-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">{group.group}</p>
              <ul>
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} aria-current={active ? "page" : undefined}
                        className={`block rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                          active ? "bg-accent-soft text-accent-fg" : "text-muted hover:bg-subtle hover:text-fg"}`}>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {navOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpenedOn(null)} aria-hidden="true" />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-panel px-4">
          <button type="button" className="rounded-md border border-line p-2 text-muted lg:hidden" onClick={() => setOpenedOn(pathname)}
            aria-label="Open admin navigation" aria-expanded={navOpen}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <p className="hidden font-mono text-[10px] uppercase tracking-wider text-faint lg:block">{pathname}</p>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-muted hover:text-accent-fg">
              View site ↗
            </a>
            <span className="hidden text-[12px] text-faint sm:block">{user.email} · {user.role}</span>
            <button type="button" onClick={() => { void logout().then(() => router.replace("/admin/login")); }}
              className="rounded-md border border-line-strong px-2.5 py-1 text-[12px] font-semibold text-muted hover:border-bad hover:text-bad">
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
