import { headers } from "next/headers";
import { db, parseJson } from "@/server/db";
import { PageHead } from "@/components/ui";
import { ConsentTabs } from "./ConsentTabs";
import type { ConsentSettings, CookieRow, ConsentEvent, BannerCfg } from "./types";

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
  const d = db();

  const t = d.prepare("SELECT settings_json FROM tenant WHERE id = 'tenant_meridian'").get() as { settings_json: string };
  const raw = parseJson<Partial<ConsentSettings>>(t.settings_json, {});
  const settings: ConsentSettings = {
    age_gating: raw.age_gating ?? false,
    notice_version: raw.notice_version ?? "",
    banner: { ...DEFAULT_BANNER, ...(raw.banner ?? {}) },
  };

  // node:sqlite returns rows with a null prototype, which Next.js refuses to
  // serialize into client components — normalize to plain objects.
  const plain = <T,>(rows: unknown): T => JSON.parse(JSON.stringify(rows)) as T;

  const cookies = plain<CookieRow[]>(
    d.prepare(`SELECT * FROM cookies WHERE property_id = 'prop_main' ORDER BY category, name`).all()
  );

  const eventRows = plain<Array<Omit<ConsentEvent, "categories"> & { categories_json: string }>>(
    d.prepare(`SELECT * FROM consent_events WHERE property_id = 'prop_main' ORDER BY created_at DESC LIMIT 100`).all()
  );
  const events: ConsentEvent[] = eventRows.map((r) => ({
    ...r,
    categories: parseJson(r.categories_json, { necessary: true, functional: false, analytics: false, marketing: false }),
  }));

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
      <ConsentTabs settings={settings} cookies={cookies} events={events} snippetUrl={snippetUrl} />
    </div>
  );
}
