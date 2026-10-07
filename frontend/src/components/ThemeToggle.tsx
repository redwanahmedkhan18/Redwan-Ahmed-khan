"use client";

import { useTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light theme", icon: "M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
  { value: "dark", label: "Dark theme", icon: "M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8" },
  { value: "system", label: "System theme", icon: "M4 5h16v10H4zM9 19h6" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line bg-panel p-0.5" role="group" aria-label="Color theme">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setTheme(o.value)}
          aria-pressed={theme === o.value}
          title={o.label}
          className={`rounded-md p-1.5 transition-colors ${
            theme === o.value ? "bg-accent-soft text-accent-fg" : "text-faint hover:text-muted"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d={o.icon} />
          </svg>
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
