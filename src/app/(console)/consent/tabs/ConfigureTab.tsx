"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardTitle, Chip } from "@/components/ui";
import type { ConsentSettings } from "../types";

export function ConfigureTab({ initial }: { initial: ConsentSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<ConsentSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setBanner = (k: string, v: string) =>
    setForm({ ...form, banner: { ...form.banner, [k]: v } });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/consent/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age_gating: form.age_gating,
          notice_version: form.notice_version,
          banner: form.banner,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 space-y-5">
        <Card>
          <CardTitle
            right={
              savedAt ? (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-status-green">
                  <CheckCircle2 className="w-4 h-4" /> Saved {savedAt}
                </span>
              ) : undefined
            }
          >
            Banner wording
          </CardTitle>
          <div className="space-y-4">
            <div>
              <label className="kicker block mb-1.5">Title</label>
              <input className="field" value={form.banner.title} onChange={(e) => setBanner("title", e.target.value)} />
            </div>
            <div>
              <label className="kicker block mb-1.5">Body text</label>
              <textarea className="field" rows={3} value={form.banner.text} onChange={(e) => setBanner("text", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([["accept_label", "Accept label"], ["reject_label", "Reject label"], ["customize_label", "Customise label"]] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="kicker block mb-1.5">{label}</label>
                  <input className="field" value={form.banner[k]} onChange={(e) => setBanner(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker block mb-1.5">Notice version</label>
                <input className="field font-mono" value={form.notice_version} onChange={(e) => setForm({ ...form, notice_version: e.target.value })} />
                <p className="text-[11.5px] text-ink-faint mt-1">Stamped onto every new consent event.</p>
              </div>
              <div>
                <label className="kicker block mb-1.5">Position</label>
                <select className="field" value={form.banner.position} onChange={(e) => setBanner("position", e.target.value)}>
                  <option value="bottom">Bottom bar</option>
                  <option value="modal">Centred modal</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Age gating</CardTitle>
              <p className="text-[13px] text-ink-muted max-w-lg">
                When on, visitors who say they are <strong className="text-ink">under 18</strong> get
                strictly necessary cookies only — no analytics, no marketing, no personalisation.
                Their choice is recorded as <span className="font-mono text-[12px]">age_band=under18</span> in
                the consent log, so you can prove it later.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={form.age_gating}
              onClick={() => setForm({ ...form, age_gating: !form.age_gating })}
              className={`shrink-0 w-12 h-7 rounded-full border transition-colors relative ${
                form.age_gating ? "bg-seal border-seal" : "bg-paper-deep border-hairline-strong"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  form.age_gating ? "left-[26px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <div className="mt-3">
            <Chip tone={form.age_gating ? "green" : "mute"}>{form.age_gating ? "Age gating ON" : "Age gating OFF"}</Chip>
          </div>
        </Card>

        {error && (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-status-red bg-status-redBg border border-status-red/30 rounded-md px-3.5 py-2.5">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn btn-ink" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save configuration"}
          </button>
          {dirty && <span className="text-[12px] text-ink-muted self-center">Unsaved changes</span>}
        </div>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardTitle>Currently live</CardTitle>
          <dl className="text-[12.5px] space-y-2">
            <div className="rule-row flex justify-between py-1.5">
              <dt className="text-ink-muted">Age gating</dt>
              <dd className="font-bold">{initial.age_gating ? "On" : "Off"}</dd>
            </div>
            <div className="rule-row flex justify-between py-1.5">
              <dt className="text-ink-muted">Notice version</dt>
              <dd className="font-mono">{initial.notice_version || "—"}</dd>
            </div>
            <div className="rule-row flex justify-between py-1.5">
              <dt className="text-ink-muted">Banner title</dt>
              <dd className="font-semibold text-right max-w-[60%] truncate">{initial.banner.title}</dd>
            </div>
            <div className="rule-row flex justify-between py-1.5">
              <dt className="text-ink-muted">Position</dt>
              <dd className="capitalize">{initial.banner.position}</dd>
            </div>
          </dl>
          <p className="text-[11.5px] text-ink-faint mt-3">
            The snippet fetches this config on every page view — no redeploy needed after saving.
          </p>
        </Card>
      </div>
    </div>
  );
}
