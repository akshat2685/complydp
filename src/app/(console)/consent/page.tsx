import { headers } from "next/headers";
import { q, qOne, parseJson, getTenantId, getDefaultPropertyId } from "@/server/db";
import { PageHead } from "@/components/ui";
import { ConsentTabs } from "./ConsentTabs";
import type { ConsentSettings, CookieRow, ConsentEvent, BannerCfg, GuardianConsent } from "./types";

const DEFAULT_BANNER: BannerCfg = {
  title: "We value your privacy",
  text: "",
  accept_label: "Accept all",
  reject_label: "Reject non-essential",
  customize_label: "Customise",
  position: "bottom",
  theme: "paper",
};

export default async function ConsentPage() {

  const tid = await getTenantId();
  const t = tid
    ? await qOne("SELECT settings_json, domain FROM tenant WHERE id = ?", tid) as { settings_json: string; domain: string }
    : { settings_json: "{}", domain: "" };
  const raw = parseJson<Partial<ConsentSettings>>(t.settings_json, {});
  const settings: ConsentSettings = {
    age_gating: raw.age_gating ?? false,
    notice_version: raw.notice_version ?? "",
    banner: { ...DEFAULT_BANNER, ...(raw.banner ?? {}) },
  };

  // node:sqlite returns rows with a null prototype, which Next.js refuses to
  // serialize into client components — normalize to plain objects.
  const plain = <T,>(rows: unknown): T => JSON.parse(JSON.stringify(rows)) as T;

  const propId = await getDefaultPropertyId();
  const cookies = plain<CookieRow[]>(
    propId
      ? await q(`SELECT * FROM cookies WHERE property_id = ? ORDER BY category, name`, propId)
      : []
  );

  const eventRows = plain<Array<Omit<ConsentEvent, "categories"> & { categories_json: string }>>(
    propId
      ? await q(`SELECT * FROM consent_events WHERE property_id = ? ORDER BY created_at DESC LIMIT 100`, propId)
      : []
  );
  const events: ConsentEvent[] = eventRows.map((r) => ({
    ...r,
    categories: parseJson(r.categories_json, { necessary: true, functional: false, analytics: false, marketing: false }),
  }));

  const guardians = plain<GuardianConsent[]>(
    propId
      ? await q(`SELECT * FROM guardian_consents WHERE property_id = ? ORDER BY created_at DESC LIMIT 200`, propId)
      : []
  );

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const snippetUrl = `${proto}://${host}/api/consent/snippet`;

  return (
    <div>
      <PageHead
        kicker="Rights & Consent · Consent Manager"
        title="Consent, recorded as evidence"
        lede="DPDP Act §6: consent must be free, specific, informed and withdrawable — and you must be able to prove it. Every choice below is hash-chained into an append-only log."
      />
      <ConsentTabs settings={settings} cookies={cookies} events={events} guardians={guardians} snippetUrl={snippetUrl} domain={t.domain} />
    </div>
  );
}
