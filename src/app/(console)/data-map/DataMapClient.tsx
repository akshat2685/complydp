"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead, Card, CardTitle, Chip, EmptyState } from "@/components/ui";
import { Plus, ArrowRight, Globe } from "lucide-react";
import type { SystemRow, FieldRow, ActivityRow, VendorRef } from "./page";

const PII_TONES: Record<string, "red" | "seal" | "amber" | "blue" | "mute" | "teal"> = {
  direct_identifier: "red",
  govt_id: "seal",
  financial: "amber",
  quasi_identifier: "blue",
  technical: "mute",
  consent_record: "teal",
  none: "mute",
};

const PII_LABELS: Record<string, string> = {
  direct_identifier: "Direct identifier",
  govt_id: "Government ID",
  financial: "Financial",
  quasi_identifier: "Quasi-identifier",
  technical: "Technical",
  consent_record: "Consent record",
  none: "Not personal data",
};

const KIND_TONES: Record<string, "blue" | "teal" | "amber" | "mute"> = {
  database: "blue",
  saas: "teal",
  codebase: "amber",
  website: "mute",
};

const DPA_LABELS: Record<string, string> = {
  signed: "DPA signed",
  under_review: "Under review",
  not_started: "Not started",
  not_required: "Not required",
};

const DPA_TONES: Record<string, "green" | "amber" | "red" | "mute"> = {
  signed: "green",
  under_review: "amber",
  not_started: "red",
  not_required: "mute",
};

async function post(url: string, payload: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error ?? "Request failed");
  return r.json();
}

async function patch(url: string, payload: unknown) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error ?? "Request failed");
  return r.json();
}

function SectionNav() {
  const links = [
    ["systems", "Systems"],
    ["fields", "Data fields"],
    ["activities", "Activities"],
    ["flows", "Data flows"],
    ["discovery", "Discovery"],
  ] as Array<[string, string]>;
  return (
    <div className="flex flex-wrap gap-1.5 mb-6">
      {links.map(([id, label]) => (
        <a key={id} href={`#${id}`} className="btn btn-line btn-sm">
          {label}
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Systems                                                            */
/* ------------------------------------------------------------------ */
function SystemsSection({ systems }: { systems: SystemRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("saas");
  const [owner, setOwner] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    try {
      await post("/api/systems", { name, kind, owner_team: owner, description: desc });
      router.refresh();
      setOpen(false);
      setName(""); setOwner(""); setDesc(""); setKind("saas");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <section id="systems" className="mb-10 scroll-mt-20">
      <Card pad={false}>
        <div className="p-5 pb-3 flex items-center justify-between">
          <CardTitle right={<span className="kicker">{systems.length} systems</span>}>
            Systems
          </CardTitle>
          <button className="btn btn-ink btn-sm" onClick={() => setOpen(!open)}>
            <Plus className="w-3.5 h-3.5" /> Register system
          </button>
        </div>
        {open && (
          <div className="px-5 pb-4 border-b border-hairline">
            <div className="grid md:grid-cols-2 gap-3">
              <input className="field" placeholder="System name — e.g. Billing Postgres" value={name} onChange={(e) => setName(e.target.value)} />
              <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="database">Database</option>
                <option value="saas">SaaS</option>
                <option value="codebase">Codebase</option>
                <option value="website">Website</option>
              </select>
              <input className="field" placeholder="Owner team" value={owner} onChange={(e) => setOwner(e.target.value)} />
              <input className="field" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            {err && <p className="text-[12px] text-status-red mt-2">{err}</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-seal btn-sm" onClick={submit} disabled={!name.trim()}>Register</button>
              <button className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="ledger-head">
              <th className="text-left px-5 py-2 font-semibold">System</th>
              <th className="text-left px-3 py-2 font-semibold">Kind</th>
              <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">Owner</th>
              <th className="text-right px-5 py-2 font-semibold">Fields</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id} className="ledger-row">
                <td className="px-5 py-2.5">
                  <div className="text-[13px] font-bold text-ink">{s.name}</div>
                  {s.description && <div className="text-[11.5px] text-ink-muted mt-0.5">{s.description}</div>}
                </td>
                <td className="px-3 py-2.5"><Chip tone={KIND_TONES[s.kind] ?? "mute"}>{s.kind}</Chip></td>
                <td className="px-3 py-2.5 text-[12.5px] text-ink-muted hidden md:table-cell">{s.owner_team || "—"}</td>
                <td className="px-5 py-2.5 text-right font-mono text-[13px] font-bold">{s.field_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Data fields                                                        */
/* ------------------------------------------------------------------ */
function FieldsSection({
  fields,
  systems,
  activities,
}: {
  fields: FieldRow[];
  systems: SystemRow[];
  activities: ActivityRow[];
}) {
  const router = useRouter();
  const [sysFilter, setSysFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [mapFilter, setMapFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [fSys, setFSys] = useState(systems[0]?.id ?? "");
  const [fName, setFName] = useState("");
  const [fNote, setFNote] = useState("");
  const [lastClass, setLastClass] = useState<{ label: string; reason: string } | null>(null);
  const [err, setErr] = useState("");
  const [mapping, setMapping] = useState("");

  const filtered = useMemo(
    () =>
      fields.filter(
        (f) =>
          (!sysFilter || f.system_id === sysFilter) &&
          (!catFilter || f.pii_category === catFilter) &&
          (mapFilter !== "unmapped" || !f.mapped_activity_id) &&
          (mapFilter !== "mapped" || f.mapped_activity_id)
      ),
    [fields, sysFilter, catFilter, mapFilter]
  );

  const unmapped = fields.filter((f) => !f.mapped_activity_id && f.pii_category !== "none").length;

  const submit = async () => {
    setErr("");
    setLastClass(null);
    try {
      const res = await post("/api/data-fields", { system_id: fSys, field_name: fName, note: fNote });
      setLastClass(res.classification);
      router.refresh();
      setFName("");
      setFNote("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const mapField = async (id: string, activityId: string) => {
    setMapping(id);
    try {
      await patch("/api/data-fields", { id, mapped_activity_id: activityId });
      router.refresh();
    } finally {
      setMapping("");
    }
  };

  return (
    <section id="fields" className="mb-10 scroll-mt-20">
      <Card pad={false}>
        <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-3">
          <CardTitle
            right={
              <span className="kicker">
                {unmapped > 0 ? `${unmapped} unmapped` : "all mapped"}
              </span>
            }
          >
            Data fields
          </CardTitle>
          <button className="btn btn-ink btn-sm" onClick={() => setOpen(!open)}>
            <Plus className="w-3.5 h-3.5" /> Add field
          </button>
        </div>

        {open && (
          <div className="px-5 pb-4 border-b border-hairline">
            <div className="grid md:grid-cols-3 gap-3">
              <select className="field" value={fSys} onChange={(e) => setFSys(e.target.value)}>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input className="field font-mono" placeholder="field name — e.g. users.voter_id" value={fName} onChange={(e) => setFName(e.target.value)} />
              <input className="field" placeholder="Note (optional)" value={fNote} onChange={(e) => setFNote(e.target.value)} />
            </div>
            {lastClass && (
              <p className="text-[12px] text-teal-dark bg-teal-bg border border-teal/25 rounded px-2.5 py-1.5 mt-3">
                Classified as <strong>{lastClass.label}</strong> — {lastClass.reason} (rule-based engine)
              </p>
            )}
            {err && <p className="text-[12px] text-status-red mt-2">{err}</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-seal btn-sm" onClick={submit} disabled={!fName.trim() || !fSys}>
                Add &amp; classify
              </button>
              <button className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-b border-hairline flex flex-wrap gap-2">
          <select className="field !w-auto" value={sysFilter} onChange={(e) => setSysFilter(e.target.value)}>
            <option value="">All systems</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="field !w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {Object.entries(PII_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select className="field !w-auto" value={mapFilter} onChange={(e) => setMapFilter(e.target.value)}>
            <option value="">Mapped + unmapped</option>
            <option value="unmapped">Unmapped only</option>
            <option value="mapped">Mapped only</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 pb-5 pt-4">
            <EmptyState title="No fields match" body="Adjust the filters, or add a field above — it is classified instantly by the rule-based engine." />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2 font-semibold">Field</th>
                <th className="text-left px-3 py-2 font-semibold">PII category</th>
                <th className="text-left px-3 py-2 font-semibold hidden lg:table-cell">Source</th>
                <th className="text-left px-5 py-2 font-semibold">Mapped to</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="ledger-row">
                  <td className="px-5 py-2.5">
                    <div className="font-mono text-[12.5px] font-bold text-ink">{f.field_name}</div>
                    <div className="text-[11px] text-ink-faint mt-0.5">
                      {f.system_name}{f.note ? ` · ${f.note}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip tone={PII_TONES[f.pii_category] ?? "mute"}>{PII_LABELS[f.pii_category] ?? f.pii_category}</Chip>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-ink-muted hidden lg:table-cell">
                    {f.classification_source === "auto" ? "rule-based" : "manual"}
                  </td>
                  <td className="px-5 py-2.5">
                    {f.mapped_activity_id ? (
                      <select
                        className="field !w-auto !py-1 !text-[12px]"
                        value={f.mapped_activity_id}
                        disabled={mapping === f.id}
                        onChange={(e) => mapField(f.id, e.target.value)}
                      >
                        {activities.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                        <option value="">— Unmap —</option>
                      </select>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Chip tone="amber">Unmapped</Chip>
                        <select
                          className="field !w-auto !py-1 !text-[12px]"
                          value=""
                          disabled={mapping === f.id}
                          onChange={(e) => e.target.value && mapField(f.id, e.target.value)}
                        >
                          <option value="">Map to…</option>
                          {activities.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="px-5 py-3 text-[11.5px] text-ink-faint border-t border-hairline">
          Classification is a deterministic keyword engine tuned for Indian data (PAN, Aadhaar, UPI, IFSC, voter ID). It is not machine learning — admin overrides are marked “manual”.
        </p>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Processing activities                                              */
/* ------------------------------------------------------------------ */
function ActivitiesSection({
  activities,
  vendors,
}: {
  activities: ActivityRow[];
  vendors: VendorRef[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [owner, setOwner] = useState("");
  const [basis, setBasis] = useState("Consent");
  const [retention, setRetention] = useState("");
  const [subjects, setSubjects] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [err, setErr] = useState("");

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    setErr("");
    try {
      await post("/api/processing-activities", {
        name,
        purpose,
        owner_team: owner,
        lawful_basis: basis,
        retention,
        data_subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        vendor_ids: picked,
      });
      router.refresh();
      setOpen(false);
      setName(""); setPurpose(""); setOwner(""); setRetention(""); setSubjects(""); setPicked([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <section id="activities" className="mb-10 scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-[19px] font-bold text-ink">Processing activities</h2>
        <button className="btn btn-ink btn-sm" onClick={() => setOpen(!open)}>
          <Plus className="w-3.5 h-3.5" /> Add activity
        </button>
      </div>

      {open && (
        <Card className="mb-4">
          <div className="grid md:grid-cols-2 gap-3">
            <input className="field" placeholder="Activity name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="field" placeholder="Owner team" value={owner} onChange={(e) => setOwner(e.target.value)} />
            <input className="field md:col-span-2" placeholder="Purpose — why is this data processed?" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <select className="field" value={basis} onChange={(e) => setBasis(e.target.value)}>
              <option>Consent</option>
              <option>Contract</option>
              <option>Legitimate interest</option>
              <option>Legal obligation</option>
              <option>Vital interest</option>
            </select>
            <input className="field" placeholder="Retention — e.g. 7 years (tax)" value={retention} onChange={(e) => setRetention(e.target.value)} />
            <input className="field md:col-span-2" placeholder="Data subjects — comma separated, e.g. customers, prospects" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
          </div>
          <div className="mt-3">
            <div className="kicker mb-2">Linked vendors</div>
            <div className="flex flex-wrap gap-2">
              {vendors.map((v) => (
                <label key={v.id} className={`chip cursor-pointer ${picked.includes(v.id) ? "bg-ink text-paper border-ink" : "bg-paper-deep text-ink-muted border-hairline-strong"}`}>
                  <input type="checkbox" className="hidden" checked={picked.includes(v.id)} onChange={() => toggle(v.id)} />
                  {v.name}
                </label>
              ))}
            </div>
          </div>
          {err && <p className="text-[12px] text-status-red mt-2">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button className="btn btn-seal btn-sm" onClick={submit} disabled={!name.trim()}>Add activity</button>
            <button className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {activities.map((a) => (
          <Card key={a.id}>
            <div className="font-display text-[16px] font-bold text-ink">{a.name}</div>
            <p className="text-[12.5px] text-ink-muted mt-1 leading-snug">{a.purpose}</p>
            <div className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between rule-row py-1">
                <span className="text-ink-faint">Owner</span>
                <span className="font-semibold text-ink">{a.owner_team || "—"}</span>
              </div>
              <div className="flex justify-between rule-row py-1">
                <span className="text-ink-faint">Lawful basis</span>
                <span className="font-semibold text-ink">{a.lawful_basis || "—"}</span>
              </div>
              <div className="flex justify-between rule-row py-1">
                <span className="text-ink-faint">Retention</span>
                <span className="font-semibold text-ink">{a.retention || "—"}</span>
              </div>
            </div>
            {a.data_subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.data_subjects.map((s) => (
                  <Chip key={s} tone="blue" dot={false}>{s}</Chip>
                ))}
              </div>
            )}
            <div className="mt-3">
              <div className="kicker mb-1.5">Vendors</div>
              {a.vendors.length === 0 ? (
                <p className="text-[12px] text-ink-faint">No vendors linked.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {a.vendors.map((v) => (
                    <span key={v.id} title={DPA_LABELS[v.dpa_status] ?? v.dpa_status}>
                      <Chip tone={DPA_TONES[v.dpa_status] ?? "mute"}>{v.name}</Chip>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Data flows (derived)                                               */
/* ------------------------------------------------------------------ */
function FlowsSection({ activities }: { activities: ActivityRow[] }) {
  const rows = activities.flatMap((a) =>
    a.vendors.map((v) => ({ activity: a, vendor: v }))
  );
  return (
    <section id="flows" className="mb-10 scroll-mt-20">
      <Card pad={false}>
        <div className="p-5 pb-3">
          <CardTitle right={<span className="kicker">{rows.length} flows</span>}>
            Data flows
          </CardTitle>
          <p className="text-[12.5px] text-ink-muted -mt-1 mb-1">
            Derived from activity↔vendor links. Cross-border: vendors with country ≠ India are flagged.
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState title="No flows yet" body="Link vendors to processing activities above and the derived data flows will appear here." />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2 font-semibold">Activity</th>
                <th className="text-left px-3 py-2 font-semibold">Vendor</th>
                <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">DPA</th>
                <th className="text-right px-5 py-2 font-semibold">Border</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ activity, vendor }, i) => (
                <tr key={`${activity.id}-${vendor.id}-${i}`} className="ledger-row">
                  <td className="px-5 py-2.5 text-[13px] font-medium text-ink">{activity.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-[13px] text-ink">
                      <ArrowRight className="w-3.5 h-3.5 text-ink-faint" />
                      {vendor.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <Chip tone={DPA_TONES[vendor.dpa_status] ?? "mute"}>{DPA_LABELS[vendor.dpa_status] ?? vendor.dpa_status}</Chip>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {vendor.country === "India" ? (
                      <span className="text-[12px] text-ink-muted font-mono">{vendor.country}</span>
                    ) : (
                      <span className="flex items-center justify-end gap-1.5">
                        <Chip tone="amber"><Globe className="w-3 h-3" /> {vendor.country} — cross-border</Chip>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Discovery note                                                     */
/* ------------------------------------------------------------------ */
function DiscoverySection() {
  return (
    <section id="discovery" className="mb-4 scroll-mt-20">
      <Card>
        <CardTitle>Discovery</CardTitle>
        <div className="space-y-3 text-[13px] text-ink-soft leading-relaxed">
          <p>
            <strong className="text-ink">Website discovery</strong> runs from{" "}
            <a href="/consent" className="text-teal font-semibold hover:underline">Consent → Cookie scan</a>:
            a real static fetch of your pages that inventories cookies, classifies them, and
            auto-registers the tracker vendors it finds.
          </p>
          <p>
            <strong className="text-ink">Codebase scanning</strong> (reading GitHub repos for
            personal-data fields) needs a GitHub token — connect one in{" "}
            <a href="/settings" className="text-teal font-semibold hover:underline">Settings</a>.
            It is not wired in this MVP. Until then, register codebases manually in the Systems
            section above and add the fields they touch.
          </p>
          <p>
            <strong className="text-ink">Connected systems</strong> (Shopify, on-prem databases
            via Docker, and similar connectors) are also manual entries in this build — each one is
            labelled as such on the register, never presented as a live sync.
          </p>
        </div>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function DataMapClient({
  systems,
  fields,
  activities,
  vendors,
}: {
  systems: SystemRow[];
  fields: FieldRow[];
  activities: ActivityRow[];
  vendors: VendorRef[];
}) {
  return (
    <div>
      <PageHead
        kicker="Data mapping"
        title="Where personal data lives"
        lede="Three system kinds — databases, SaaS, codebases — one field inventory. Classification is rule-based and India-aware (PAN, Aadhaar, UPI, IFSC); it is never labelled AI."
      />
      <SectionNav />
      <SystemsSection systems={systems} />
      <FieldsSection fields={fields} systems={systems} activities={activities} />
      <ActivitiesSection activities={activities} vendors={vendors} />
      <FlowsSection activities={activities} />
      <DiscoverySection />
    </div>
  );
}
