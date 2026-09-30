import { q, run, ok, bad, body, record, newId, nowIso } from "@/server/api";

/** GET /api/systems — systems inventory (databases, SaaS, codebases, websites). */
export async function GET() {
  const systems = await q(`SELECT * FROM systems ORDER BY name`) as Array<Record<string, unknown>>;
  const counts = await q(`SELECT system_id, COUNT(*) AS n FROM data_fields GROUP BY system_id`) as Array<{ system_id: string; n: number }>;
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
  await run(`INSERT INTO systems (id, name, kind, owner_team, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`, id, b.name.trim(), b.kind ?? "saas", b.owner_team ?? "", b.description ?? "", nowIso());
  await record("system.registered", "system", id, `System registered: ${b.name}`, { kind: b.kind ?? "saas" });
  return ok({ id }, 201);
}
