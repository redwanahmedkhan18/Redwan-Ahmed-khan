"use client";

import { useState } from "react";
import { CLIENT_BASE } from "@/lib/api";
import { CONTACT_PURPOSES } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${CLIENT_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Something went wrong.");
      setMessage(body.message ?? "Message sent.");
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
    <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-[13px] font-semibold">Name <span aria-hidden="true" className="text-bad">*</span></label>
          <input id="cf-name" name="name" type="text" required minLength={2} maxLength={120} autoComplete="name" className={inputCls} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-[13px] font-semibold">Email <span aria-hidden="true" className="text-bad">*</span></label>
          <input id="cf-email" name="email" type="email" required autoComplete="email" className={inputCls} placeholder="you@company.com" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-purpose" className="mb-1.5 block text-[13px] font-semibold">Purpose <span aria-hidden="true" className="text-bad">*</span></label>
          <select id="cf-purpose" name="purpose" required className={inputCls} defaultValue="General Inquiry">
            {CONTACT_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-subject" className="mb-1.5 block text-[13px] font-semibold">Subject <span aria-hidden="true" className="text-bad">*</span></label>
          <input id="cf-subject" name="subject" type="text" required minLength={3} maxLength={255} className={inputCls} placeholder="What's this about?" />
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-[13px] font-semibold">Message <span aria-hidden="true" className="text-bad">*</span></label>
        <textarea id="cf-message" name="message" required minLength={10} maxLength={5000} rows={6} className={inputCls} placeholder="Tell me about the role, project or research idea…" />
      </div>

      {/* Honeypot — hidden from humans, visible to naive bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]"
        >
          {status === "submitting" ? "Sending…" : "Send Message"}
        </button>
        <p aria-live="polite" className={`text-[13px] ${status === "error" ? "text-bad" : "text-ok"}`}>
          {status !== "idle" && status !== "submitting" ? message : ""}
        </p>
      </div>
    </form>
  );
}
