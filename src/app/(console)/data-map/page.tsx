import { q, parseJson } from "@/server/db";
import { DataMapClient } from "./DataMapClient";

export interface SystemRow {
  id: string;
  name: string;
  kind: string;
  owner_team: string;
  description: string;
  field_count: number;
}

export interface FieldRow {
  id: string;
  system_id: string;
  field_name: string;
  pii_category: string;
  classification_source: string;
  mapped_activity_id: string;
  note: string;
  system_name: string;
  system_kind: string;
  activity_name: string | null;
}

export interface ActivityRow {
  id: string;
  name: string;
  purpose: string;
  owner_team: string;
  data_subjects: string[];
  lawful_basis: string;
  retention: string;
  vendors: Array<{ id: string; name: string; dpa_status: string; country: string }>;
}

export interface VendorRef {
  id: string;
  name: string;
  country: string;
}

export default async function DataMapPage() {

  const systems = await q(`SELECT * FROM systems ORDER BY name`) as Array<
    Record<string, unknown>
  >;
  const fieldCounts = await q(`SELECT system_id, COUNT(*) AS n FROM data_fields GROUP BY system_id`) as Array<{ system_id: string; n: number }>;
  const fc: Record<string, number> = {};
  for (const c of fieldCounts) fc[c.system_id] = c.n;

  const systemRows: SystemRow[] = systems.map((s) => ({
    id: s.id as string,
    name: s.name as string,
    kind: s.kind as string,
    owner_team: s.owner_team as string,
    description: s.description as string,
    field_count: fc[s.id as string] ?? 0,
  }));

  const fields = await q(`SELECT f.*, s.name AS system_name, s.kind AS system_kind
       FROM data_fields f JOIN systems s ON s.id = f.system_id
       ORDER BY s.name, f.field_name`) as Array<Record<string, unknown>>;
  const acts = await q(`SELECT id, name FROM processing_activities`) as Array<{
    id: string;
    name: string;
  }>;
  const actName: Record<string, string> = {};
  for (const a of acts) actName[a.id] = a.name;

  const fieldRows: FieldRow[] = fields.map((f) => ({
    id: f.id as string,
    system_id: f.system_id as string,
    field_name: f.field_name as string,
    pii_category: f.pii_category as string,
    classification_source: f.classification_source as string,
    mapped_activity_id: f.mapped_activity_id as string,
    note: f.note as string,
    system_name: f.system_name as string,
    system_kind: f.system_kind as string,
    activity_name: actName[f.mapped_activity_id as string] ?? null,
  }));

  const activities = await q(`SELECT * FROM processing_activities ORDER BY name`) as Array<Record<string, unknown>>;
  const links = await q(`SELECT av.activity_id, v.id, v.name, v.dpa_status, v.country
       FROM activity_vendors av JOIN vendors v ON v.id = av.vendor_id`) as Array<{ activity_id: string; id: string; name: string; dpa_status: string; country: string }>;
  const byAct: Record<string, ActivityRow["vendors"]> = {};
  for (const l of links) {
    (byAct[l.activity_id] ??= []).push({ id: l.id, name: l.name, dpa_status: l.dpa_status, country: l.country });
  }

  const activityRows: ActivityRow[] = activities.map((a) => ({
    id: a.id as string,
    name: a.name as string,
    purpose: a.purpose as string,
    owner_team: a.owner_team as string,
    data_subjects: parseJson<string[]>(a.data_subjects_json as string, []),
    lawful_basis: a.lawful_basis as string,
    retention: a.retention as string,
    vendors: byAct[a.id as string] ?? [],
  }));

  const vendorRefs: VendorRef[] = (
    await q(`SELECT id, name, country FROM vendors ORDER BY name`) as Array<Record<string, unknown>>).map((v) => ({ id: v.id as string, name: v.name as string, country: v.country as string }));

  // node:sqlite returns rows as [Object: null prototype]; Next.js refuses to
  // serialize those into client components. Deep-clone to plain objects.
  const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  return (
    <DataMapClient
      systems={plain(systemRows)}
      fields={plain(fieldRows)}
      activities={plain(activityRows)}
      vendors={plain(vendorRefs)}
    />
  );
}
