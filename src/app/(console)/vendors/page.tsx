import { db } from "@/server/db";
import { VendorsClient } from "./VendorsClient";

export interface VendorRow {
  id: string;
  name: string;
  category: string;
  domain: string;
  country: string;
  dpa_status: string;
  risk_tier: string;
  owner: string;
  notes: string;
  discovered_via: string;
  created_at: string;
}

export default function VendorsPage() {
  const d = db();
  const rows = d.prepare(`SELECT * FROM vendors ORDER BY risk_tier DESC, name`).all() as Array<
    Record<string, unknown>
  >;
  // node:sqlite returns rows as [Object: null prototype]; Next.js refuses to
  // serialize those into client components. Deep-clone to plain objects.
  const vendors: VendorRow[] = JSON.parse(
    JSON.stringify(
      rows.map((v) => ({
        id: v.id as string,
        name: v.name as string,
        category: v.category as string,
        domain: v.domain as string,
        country: v.country as string,
        dpa_status: v.dpa_status as string,
        risk_tier: v.risk_tier as string,
        owner: v.owner as string,
        notes: v.notes as string,
        discovered_via: v.discovered_via as string,
        created_at: v.created_at as string,
      }))
    )
  );
  return <VendorsClient vendors={vendors} />;
}
