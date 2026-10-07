"use client";

import { useState } from "react";
import { CLIENT_BASE } from "@/lib/api";
import { BUDGET_RANGES, PROJECT_TYPES, TIMELINES } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";

export default function HireForm({ services }: { services: string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${CLIENT_BASE}/hire-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Something went wrong.");
      setMessage(body.message ?? "Request received.");
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-md border border-line-strong bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hf-name" className="mb-1.5 block text-[13px] font-semibold">Name <span aria-hidden="true" className="text-bad">*</span></label>
          <input id="hf-name" name="name" type="text" required minLength={2} maxLength={120} autoComplete="name" className={inputCls} />
        </div>
        <div>
          <label htmlFor="hf-email" className="mb-1.5 block text-[13px] font-semibold">Email <span aria-hidden="true" className="text-bad">*</span></label>
          <input id="hf-email" name="email" type="email" required autoComplete="email" className={inputCls} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hf-company" className="mb-1.5 block text-[13px] font-semibold">Company</label>
          <input id="hf-company" name="company" type="text" maxLength={255} autoComplete="organization" className={inputCls} />
        </div>
        <div>
          <label htmlFor="hf-type" className="mb-1.5 block text-[13px] font-semibold">Project type <span aria-hidden="true" className="text-bad">*</span></label>
          <select id="hf-type" name="project_type" required className={inputCls} defaultValue="">
            <option value="" disabled>Select…</option>
            {[...new Set([...(services.length ? services : []), ...PROJECT_TYPES])].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hf-budget" className="mb-1.5 block text-[13px] font-semibold">Budget range</label>
          <select id="hf-budget" name="budget_range" className={inputCls} defaultValue="">
            <option value="">Not sure yet</option>
            {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hf-timeline" className="mb-1.5 block text-[13px] font-semibold">Timeline</label>
          <select id="hf-timeline" name="timeline" className={inputCls} defaultValue="">
            <option value="">Flexible</option>
            {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="hf-desc" className="mb-1.5 block text-[13px] font-semibold">Project description <span aria-hidden="true" className="text-bad">*</span></label>
        <textarea id="hf-desc" name="project_description" required minLength={20} maxLength={10000} rows={7} className={inputCls}
          placeholder="What are you building? What problem does the AI/system need to solve? Any technical constraints?" />
        <p className="mt-1.5 text-xs text-faint">No account required — this goes straight to the admin inbox.</p>
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] top-0">
        <label htmlFor="hf-website">Website</label>
        <input id="hf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]"
        >
          {status === "submitting" ? "Sending…" : "Send Hire Request"}
        </button>
        <p aria-live="polite" className={`text-[13px] ${status === "error" ? "text-bad" : "text-ok"}`}>
          {status !== "idle" && status !== "submitting" ? message : ""}
        </p>
      </div>
    </form>
  );
}
