"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui";
import { Plus } from "lucide-react";

export function OpenBreachCase() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "high",
    affected_count: "",
    systems: "",
    categories: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        affected_count: form.affected_count ? parseInt(form.affected_count, 10) : 0,
        systems: form.systems.split(",").map((s) => s.trim()).filter(Boolean),
        categories: form.categories.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (!res.ok) {
      setError("Could not open the case. Please try again.");
      setSaving(false);
      return;
    }
    const data = await res.json();
    setOpen(false);
    setSaving(false);
    router.push(`/breach/${data.id}`);
  }

  return (
    <>
      <button className="btn btn-seal btn-sm" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" /> Open breach case
      </button>
      {open && (
        <Drawer kicker="Breach resolution" title="Open a breach case" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <p className="text-[12.5px] text-ink-muted leading-relaxed">
              The statutory clocks start from the <strong className="text-ink">moment of awareness</strong>,
              recorded automatically when you open the case.
            </p>
            <div>
              <label className="kicker block mb-1.5">Title</label>
              <input className="field" value={form.title} onChange={set("title")} placeholder="e.g. Customer export emailed to wrong recipient" />
            </div>
            <div>
              <label className="kicker block mb-1.5">What happened</label>
              <textarea className="field" rows={4} value={form.description} onChange={set("description")} placeholder="How was it discovered, what data is involved, what has been contained so far…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker block mb-1.5">Severity</label>
                <select className="field" value={form.severity} onChange={set("severity")}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="kicker block mb-1.5">Principals affected</label>
                <input className="field" type="number" min={0} value={form.affected_count} onChange={set("affected_count")} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="kicker block mb-1.5">Systems involved <span className="normal-case font-normal">(comma-separated)</span></label>
              <input className="field" value={form.systems} onChange={set("systems")} placeholder="Zendesk, Gmail" />
            </div>
            <div>
              <label className="kicker block mb-1.5">Data categories <span className="normal-case font-normal">(comma-separated)</span></label>
              <input className="field" value={form.categories} onChange={set("categories")} placeholder="customer_name, customer_phone" />
            </div>
            {error && <p className="text-[12.5px] text-status-red font-semibold">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-seal" disabled={saving}>
                {saving ? "Opening…" : "Open case & start clocks"}
              </button>
            </div>
          </form>
        </Drawer>
      )}
    </>
  );
}
