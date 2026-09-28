import { db, ok, bad, body, record, newId, nowIso, parseJson } from "@/server/api";

/** GET /api/incidents — breach cases with live clock data. */
export async function GET() {
  const rows = db().prepare(`SELECT * FROM breach_cases ORDER BY created_at DESC`).all() as Array<Record<string, unknown>>;
  const comms = db().prepare(`SELECT breach_id, COUNT(*) AS n FROM breach_comms GROUP BY breach_id`).all() as Array<{ breach_id: string; n: number }>;
  const commCount: Record<string, number> = {};
  for (const c of comms) commCount[c.breach_id] = c.n;
  return ok({
    incidents: rows.map((r) => ({
      ...r,
      systems: parseJson(r.systems_json as string, []),
      categories: parseJson(r.categories_json as string, []),
      comms: commCount[r.id as string] ?? 0,
      // Statutory clocks, computed live by clients from awareness_at:
      clocks: {
        board_deadline: new Date(new Date(r.awareness_at as string).getTime() + 72 * 3600_000).toISOString(),
        awareness_at: r.awareness_at,
      },
    })),
  });
}

interface BreachBody {
  title: string;
  description?: string;
  severity?: string;
  systems?: string[];
  categories?: string[];
  affected_count?: number;
}

/** POST /api/incidents — open a breach case (step 0). */
export async function POST(req: Request) {
  const b = await body<BreachBody>(req);
  if (!b?.title) return bad("title is required");
  const d = db();
  const n = (d.prepare("SELECT COUNT(*) AS n FROM breach_cases").get() as { n: number }).n;
  const code = `BR-2026-${String(118 + n).padStart(4, "0")}`;
  const id = newId("breach");
  const awareness = nowIso();
  d.prepare(
    `INSERT INTO breach_cases (id, code, title, description, status, severity, awareness_at, systems_json, categories_json, affected_count, step, created_at)
     VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, 0, ?)`
  ).run(id, code, b.title.trim(), (b.description ?? "").trim(), b.severity ?? "high", awareness,
    JSON.stringify(b.systems ?? []), JSON.stringify(b.categories ?? []), b.affected_count ?? 0, awareness);
  record("breach.opened", "breach_case", id, `Breach ${code} opened: ${b.title}`, { severity: b.severity ?? "high" });
  return ok({ id, code }, 201);
}

/** PATCH /api/incidents — advance step / update fields / close. */
export async function PATCH(req: Request) {
  const b = await body<{
    id: string; step?: number; status?: string; severity?: string; title?: string;
    description?: string; affected_count?: number; board_notified_at?: string; users_notified_at?: string;
  }>(req);
  if (!b?.id) return bad("id is required");
  const d = db();
  const row = d.prepare("SELECT * FROM breach_cases WHERE id = ?").get(b.id) as Record<string, unknown> | undefined;
  if (!row) return bad("Breach not found", 404);

  const updates: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, v: unknown) => { updates.push(`${col} = ?`); params.push(v); };
  if (typeof b.step === "number") {
    if (b.step < 0 || b.step > 3) return bad("step must be 0-3");
    set("step", b.step);
  }
  if (b.status) set("status", b.status);
  if (b.severity) set("severity", b.severity);
  if (b.title) set("title", b.title);
  if (typeof b.description === "string") set("description", b.description);
  if (typeof b.affected_count === "number") set("affected_count", b.affected_count);
  if (b.board_notified_at) set("board_notified_at", b.board_notified_at);
  if (b.users_notified_at) set("users_notified_at", b.users_notified_at);
  if (b.status === "closed") set("closed_at", nowIso());
  if (!updates.length) return bad("Nothing to update");
  params.push(b.id);
  d.prepare(`UPDATE breach_cases SET ${updates.join(", ")} WHERE id = ?`).run(...(params as []));

  if (typeof b.step === "number" && b.step !== row.step) {
    record("breach.step_advanced", "breach_case", b.id, `Breach ${row.code} moved to step ${b.step + 1}`, { step: b.step, from: row.step });
  } else {
    record("breach.updated", "breach_case", b.id, `Breach ${row.code} updated`, { status: b.status ?? row.status });
  }
  return ok({ id: b.id });
}
