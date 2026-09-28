import { db, ok, bad, body, record, newId, nowIso } from "@/server/api";

/** GET /api/systems — systems inventory (databases, SaaS, codebases, websites). */
export async function GET() {
  const d = db();
  const systems = d.prepare(`SELECT * FROM systems ORDER BY name`).all() as Array<Record<string, unknown>>;
  const counts = d.prepare(`SELECT system_id, COUNT(*) AS n FROM data_fields GROUP BY system_id`).all() as Array<{ system_id: string; n: number }>;
  const bySys: Record<string, number> = {};
  for (const c of counts) bySys[c.system_id] = c.n;
  return ok({ systems: systems.map((s) => ({ ...s, field_count: bySys[s.id as string] ?? 0 })) });
}

/** POST /api/systems — register a system (manual entry for the MVP). */
export async function POST(req: Request) {
  const b = await body<{ name: string; kind?: string; owner_team?: string; description?: string }>(req);
  if (!b?.name) return bad("name is required");
  const kinds = ["database", "saas", "codebase", "website"];
  if (b.kind && !kinds.includes(b.kind)) return bad(`kind must be one of ${kinds.join(", ")}`);
  const id = newId("sys");
  db().prepare(`INSERT INTO systems (id, name, kind, owner_team, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, b.name.trim(), b.kind ?? "saas", b.owner_team ?? "", b.description ?? "", nowIso());
  record("system.registered", "system", id, `System registered: ${b.name}`, { kind: b.kind ?? "saas" });
  return ok({ id }, 201);
}
