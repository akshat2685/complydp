/** Shared helpers for API routes. */
import { NextResponse } from "next/server";
import { db, q, qOne, run, IS_REMOTE, ledgerAppend, ledgerVerify, nowIso, newId, parseJson } from "@/server/db";

export { db, q, qOne, run, IS_REMOTE, ledgerAppend, ledgerVerify, nowIso, newId, parseJson };

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function body<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** Append a ledger entry for a mutation. Actor defaults to "dpo". */
export async function record(
  action: string,
  entity_type: string,
  entity_id: string,
  summary: string,
  details?: Record<string, unknown>,
  actor = "dpo"
) {
  return ledgerAppend({ actor, action, entity_type, entity_id, summary, details });
}

export function rowToJson<T>(row: Record<string, unknown>, jsonKeys: string[]): T {
  const out: Record<string, unknown> = { ...row };
  for (const k of jsonKeys) out[k] = parseJson(row[k] as string, k.endsWith("_json") ? [] : {});
  return out as T;
}

/**
 * CORS for the public consent endpoints. The install snippet runs on customer
 * sites (different origins), so GET config + POST events must be callable
 * cross-origin. Mutating admin endpoints intentionally stay same-origin.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function cors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export function corsPreflight(): NextResponse {
  return cors(new NextResponse(null, { status: 204 }));
}
