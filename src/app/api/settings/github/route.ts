import { qOne, run, ok, bad, body, record, parseJson, getTenantId } from "@/server/api";
import { maskToken, readGithubToken } from "@/server/github";

/** GET /api/settings/github — token presence, masked. The raw value never leaves the server. */
export async function GET() {
  const token = await readGithubToken();
  return ok({ configured: !!token, masked: token ? maskToken(token) : null });
}

interface TokenBody {
  token?: string;
}

/**
 * POST /api/settings/github — save or clear the GitHub token.
 * { token } saves it into tenant settings (read-modify-write, other keys kept);
 * an empty/missing token clears it.
 */
export async function POST(req: Request) {
  const b = await body<TokenBody>(req);
  if (!b) return bad("Invalid JSON body");
  const tid = await getTenantId();
  if (!tid) return bad("Workspace is not set up yet", 503);
  const t = await qOne("SELECT settings_json FROM tenant WHERE id = ?", tid) as { settings_json: string };
  const settings = parseJson<Record<string, unknown>>(t.settings_json, {});
  const token = (b.token ?? "").trim();

  if (token === "") {
    delete settings.github_token;
    await run("UPDATE tenant SET settings_json = ? WHERE id = ?", JSON.stringify(settings), tid);
    await record("settings.github_token_removed", "tenant", tid, "GitHub token removed — scans run unauthenticated");
    return ok({ configured: false, masked: null });
  }

  // Light sanity check only; a genuinely bad token surfaces honestly at scan time.
  if (token.length < 10) return bad("That doesn't look like a GitHub token — it is far too short");

  settings.github_token = token;
  await run("UPDATE tenant SET settings_json = ? WHERE id = ?", JSON.stringify(settings), tid);
  await record("settings.github_token_saved", "tenant", tid, "GitHub token saved (server-side, masked in UI)");
  return ok({ configured: true, masked: maskToken(token) });
}
