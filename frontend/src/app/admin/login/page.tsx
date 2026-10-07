"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const { login, user, loading } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    router.replace("/admin/dashboard");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-line-strong bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none";

  return (
    <div className="bg-grid flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-panel font-mono text-sm font-bold text-accent-fg">RK</span>
          <h1 className="mt-4 text-lg font-bold tracking-tight">Portfolio CMS</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Administrator sign in</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-line bg-panel p-6" aria-label="Admin login">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold">Email</label>
              <input id="email" type="email" autoComplete="username" required className={inputCls}
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold">Password</label>
              <input id="password" type="password" autoComplete="current-password" required className={inputCls}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>
          )}

          <button type="submit" disabled={busy}
            className="mt-5 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]">
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
            Repeated failed attempts temporarily lock the account.
            <br />Sessions refresh automatically via a secure HTTP-only cookie.
          </p>
        </form>

        <p className="mt-5 text-center">
          <Link href="/" className="font-mono text-[11px] uppercase tracking-wider text-faint hover:text-accent-fg">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
