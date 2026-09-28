import { q, qOne, run, ok, bad, body, record, newId, nowIso, parseJson } from "@/server/api";
import { scanWebsite } from "@/server/scanner";

/** GET /api/scan — recent scan runs. */
export async function GET() {
  const rows = await q(`SELECT * FROM scans ORDER BY started_at DESC LIMIT 20`);
  return ok({
    scans: (rows as Array<Record<string, unknown>>).map((r) => ({
      ...r,
      stats: parseJson(r.stats_json as string, {}),
    })),
  });
}

interface ScanBody {
  url: string;
  property_id?: string;
}

/**
 * POST /api/scan — run a real static cookie scan against a URL.
 * Persists new cookies, upserts seen ones, records the scan, and raises
 * findings for unclassified cookies.
 */
export async function POST(req: Request) {
  const b = await body<ScanBody>(req);
  if (!b?.url) return bad("url is required");
  const prop = b.property_id ?? "prop_main";
  const scanId = newId("scan");
  const started = nowIso();
  await run(`INSERT INTO scans (id, property_id, kind, status, started_at, stats_json) VALUES (?, ?, 'cookie', 'running', ?, '{}')`, scanId, prop, started);

  const result = await scanWebsite(b.url);
  const finished = nowIso();

  if (!result.ok) {
    await run(`UPDATE scans SET status = 'failed', finished_at = ?, error = ? WHERE id = ?`, finished, result.error ?? "unknown", scanId);
    await record("scan.failed", "scan", scanId, `Cookie scan failed for ${b.url}`, { error: result.error });
    return bad(result.error ?? "Scan failed", 502);
  }

  let added = 0;
  let seen = 0;
  for (const c of result.cookies) {
    const existing = await qOne("SELECT id FROM cookies WHERE property_id = ? AND name = ?", prop, c.name) as { id: string } | undefined;
    if (existing) {
      seen++;
      await run("UPDATE cookies SET last_seen = ? WHERE id = ?", finished, existing.id);
    } else {
      await run(`INSERT INTO cookies (id, property_id, name, category, source, description, duration, vendor_hint, first_seen, last_seen)
     VALUES (?, ?, ?, ?, 'auto', ?, ?, ?, ?, ?)
     ON CONFLICT(property_id, name) DO UPDATE SET last_seen = excluded.last_seen, vendor_hint = excluded.vendor_hint`, newId("ck"), prop, c.name, c.category, `${c.evidence}.`, c.duration, c.vendor_hint, started, finished);
      added++;
      if (c.category === "unclassified") {
        await run(`INSERT INTO findings (id, category, title, detail, severity, status, legal_ref, source, created_at)
           VALUES (?, 'consent', ?, ?, 'medium', 'needs_review', 'DPDP Act §6 — classify before use', 'cookie_scan', ?)`, newId("fnd"), `Unclassified cookie: ${c.name}`, `${c.evidence}. Classify it before relying on consent coverage.`, finished);
      }
    }
  }

  // Auto-register tracker vendors discovered via scan
  for (const host of result.third_party_domains) {
    const known = await qOne("SELECT id FROM vendors WHERE domain LIKE ?", `%${host}%`);
    if (!known) {
      const vendorName = host.replace(/^www\./, "").split(".")[0];
      const name = vendorName.charAt(0).toUpperCase() + vendorName.slice(1);
      await run(`INSERT INTO vendors (id, name, category, domain, country, dpa_status, risk_tier, owner, discovered_via, created_at)
         VALUES (?, ?, 'Discovered tracker', ?, 'Unknown', 'not_started', 'medium', '', 'cookie_scan', ?)`, newId("ven"), name, host, finished);
    }
  }

  const stats = { pages_crawled: result.pages_crawled, cookies_found: result.cookies.length, new_since_last: added, third_party_domains: result.third_party_domains };
  await run(`UPDATE scans SET status = 'complete', finished_at = ?, stats_json = ? WHERE id = ?`, finished, JSON.stringify(stats), scanId);
  await record("scan.completed", "scan", scanId, `Cookie scan of ${result.url}: ${result.cookies.length} cookies, ${added} new`, stats);

  return ok({ scan_id: scanId, ...result, added, seen, note: result.note }, 201);
}
