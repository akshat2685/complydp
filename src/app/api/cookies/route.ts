import { db, ok, bad, body, record, newId, nowIso } from "@/server/api";

/** GET /api/cookies?property_id= — cookie inventory. */
export async function GET(req: Request) {
  const propertyId = new URL(req.url).searchParams.get("property_id") ?? "prop_main";
  const rows = db()
    .prepare(`SELECT * FROM cookies WHERE property_id = ? ORDER BY category, name`)
    .all(propertyId);
  return ok({ cookies: rows, property_id: propertyId });
}

interface CookieBody {
  property_id?: string;
  name: string;
  category?: string;
  description?: string;
  duration?: string;
  vendor_hint?: string;
}

/** POST /api/cookies — add a cookie manually (source=manual). */
export async function POST(req: Request) {
  const b = await body<CookieBody>(req);
  if (!b?.name) return bad("name is required");
  const d = db();
  const t = nowIso();
  const prop = b.property_id ?? "prop_main";
  const existing = d.prepare("SELECT id FROM cookies WHERE property_id = ? AND name = ?").get(prop, b.name) as { id: string } | undefined;
  if (existing) {
    d.prepare(
      `UPDATE cookies SET category = COALESCE(?, category), description = COALESCE(?, description),
       duration = COALESCE(?, duration), vendor_hint = COALESCE(?, vendor_hint), last_seen = ? WHERE id = ?`
    ).run(b.category ?? null, b.description ?? null, b.duration ?? null, b.vendor_hint ?? null, t, existing.id);
    record("cookie.reclassified", "cookie", existing.id, `Cookie ${b.name} updated manually`, { category: b.category });
    return ok({ id: existing.id, updated: true });
  }
  const id = newId("ck");
  d.prepare(
    `INSERT INTO cookies (id, property_id, name, category, source, description, duration, vendor_hint, first_seen, last_seen)
     VALUES (?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?)`
  ).run(id, prop, b.name, b.category ?? "unclassified", b.description ?? "", b.duration ?? "", b.vendor_hint ?? "", t, t);
  record("cookie.added", "cookie", id, `Cookie ${b.name} added manually`, { category: b.category ?? "unclassified" });
  return ok({ id }, 201);
}

/** PATCH /api/cookies — reclassify a cookie (admin override). */
export async function PATCH(req: Request) {
  const b = await body<{ id: string; category?: string; description?: string; vendor_hint?: string }>(req);
  if (!b?.id) return bad("id is required");
  const d = db();
  const row = d.prepare("SELECT * FROM cookies WHERE id = ?").get(b.id) as Record<string, unknown> | undefined;
  if (!row) return bad("Cookie not found", 404);
  d.prepare(
    `UPDATE cookies SET category = COALESCE(?, category), description = COALESCE(?, description),
     vendor_hint = COALESCE(?, vendor_hint), source = 'manual', last_seen = ? WHERE id = ?`
  ).run(b.category ?? null, b.description ?? null, b.vendor_hint ?? null, nowIso(), b.id);
  record("cookie.reclassified", "cookie", b.id, `Cookie ${row.name} reclassified to ${b.category ?? row.category}`, {
    from: row.category,
    to: b.category ?? row.category,
  });
  return ok({ id: b.id });
}
