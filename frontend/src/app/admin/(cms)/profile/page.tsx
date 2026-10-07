"use client";

import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-client";
import type { Profile } from "@/lib/types";
import { FieldInput, MediaPicker } from "@/components/admin/fields";

const inputCls =
  "w-full rounded-md border border-line-strong bg-bg px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminRequest<Profile>("/admin/profile")
      .then((p) => {
        setProfile(p);
        setForm({
          full_name: p.full_name, headline: p.headline, tagline: p.tagline ?? "",
          about_short: p.about_short ?? "", about_long: p.about_long ?? "",
          location: p.location ?? "", email_public: p.email_public ?? "",
          photo_asset_id: p.photo?.id ?? null,
          engineering_interests: p.engineering_interests, research_interests: p.research_interests,
          technical_philosophy: p.technical_philosophy ?? "", open_to_work: p.open_to_work,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice(null); setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(form)) payload[k] = typeof v === "string" && v.trim() === "" ? null : v;
      await adminRequest("/admin/profile", { method: "PATCH", body: payload });
      setNotice("Profile saved. The public site updates within ~30 seconds (cache revalidation).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  if (error && !profile) return <p className="rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>;
  if (!profile) return <p className="font-mono text-xs text-faint">Loading profile…</p>;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Profile</h1>
      <p className="mt-0.5 text-[13px] text-muted">Hero, about page and professional identity — all rendered from these fields.</p>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="full_name">Full name</label>
            <input id="full_name" className={inputCls} value={String(form.full_name ?? "")} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="headline">Headline</label>
            <input id="headline" className={inputCls} value={String(form.headline ?? "")} onChange={(e) => setForm({ ...form, headline: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="tagline">Hero tagline</label>
            <textarea id="tagline" rows={3} className={inputCls} value={String(form.tagline ?? "")} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="location">Location</label>
            <input id="location" className={inputCls} value={String(form.location ?? "")} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="email_public">Public email (optional — never expose a private email)</label>
            <input id="email_public" type="email" className={inputCls} value={String(form.email_public ?? "")} onChange={(e) => setForm({ ...form, email_public: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="about_short">About — short intro</label>
            <textarea id="about_short" rows={3} className={inputCls} value={String(form.about_short ?? "")} onChange={(e) => setForm({ ...form, about_short: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="about_long">About — long narrative (markdown)</label>
            <textarea id="about_long" rows={12} className={`${inputCls} font-mono text-[12px]`} value={String(form.about_long ?? "")} onChange={(e) => setForm({ ...form, about_long: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold" htmlFor="philosophy">Technical philosophy</label>
            <textarea id="philosophy" rows={3} className={inputCls} value={String(form.technical_philosophy ?? "")} onChange={(e) => setForm({ ...form, technical_philosophy: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <FieldInput def={{ name: "engineering_interests", label: "Engineering interests", type: "stringlist" }}
              value={form.engineering_interests}
              onChange={(v) => setForm({ ...form, engineering_interests: v })} />
          </div>
          <div className="sm:col-span-2">
            <FieldInput def={{ name: "research_interests", label: "Research interests (all labels editable)", type: "stringlist" }}
              value={form.research_interests}
              onChange={(v) => setForm({ ...form, research_interests: v })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-semibold">Profile photo</label>
            <MediaPicker value={(form.photo_asset_id as string | null) ?? null} onChange={(v) => setForm({ ...form, photo_asset_id: v })} />
          </div>
          <div className="flex items-center gap-2.5 sm:col-span-2">
            <input id="open_to_work" type="checkbox" className="h-4 w-4 accent-[var(--accent)]"
              checked={Boolean(form.open_to_work)} onChange={(e) => setForm({ ...form, open_to_work: e.target.checked })} />
            <label htmlFor="open_to_work" className="text-[12px] font-semibold">Open to opportunities (shows a status dot in the hero)</label>
          </div>
        </div>

        {notice && <p className="rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>}
        {error && <p className="rounded-md border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error}</p>}

        <button type="submit" disabled={busy} className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:text-[#0a0c10]">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
