import { q, qOne } from "@/server/db";
import { VendorsClient } from "./VendorsClient";

export interface VendorQuestionnaire {
  id: string;
  status: string; // 'sent' | 'responded'
  link: string; // public /q/[token] link (relative)
  created_at: string;
  submitted_at: string | null;
  answers: Record<string, string> | null;
}

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
  questionnaire: VendorQuestionnaire | null;
}

export default async function VendorsPage() {
  const rows = await q(`SELECT * FROM vendors ORDER BY risk_tier DESC, name`) as Array<
    Record<string, unknown>
  >;
  // node:sqlite returns rows as [Object: null prototype]; Next.js refuses to
  // serialize those into client components. Deep-clone to plain objects.
  const vendors: VendorRow[] = JSON.parse(
    JSON.stringify(
      await Promise.all(
        rows.map(async (v) => {
          const qn = await qOne(`SELECT * FROM questionnaires WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1`, v.id as string) as | { id: string; token: string; status: string; created_at: string }
            | undefined;
          let questionnaire: VendorRow["questionnaire"] = null;
          if (qn) {
            const r = await qOne(`SELECT * FROM questionnaire_responses WHERE questionnaire_id = ? ORDER BY submitted_at DESC LIMIT 1`, qn.id) as | { answers_json: string; submitted_at: string }
              | undefined;
            questionnaire = {
              id: qn.id,
              status: qn.status,
              link: `/q/${qn.token}`,
              created_at: qn.created_at,
              submitted_at: r?.submitted_at ?? null,
              answers: r ? (JSON.parse(r.answers_json) as Record<string, string>) : null,
            };
          }
          return {
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
            questionnaire,
          };
        })
      )
    )
  );
  return <VendorsClient vendors={vendors} />;
}
