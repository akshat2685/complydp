/** GitHub token storage + request helpers (server-only). */
import { qOne, parseJson, getTenantId } from "@/server/db";

/** Mask a token for display — only first/last 4 chars ever leave the server. */
export function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}

/** Read the user-pasted GitHub token from tenant settings (read-modify-write elsewhere). */
export async function readGithubToken(): Promise<string | null> {
  const tid = await getTenantId();
  if (!tid) return null;
  const t = await qOne<{ settings_json: string }>(
    "SELECT settings_json FROM tenant WHERE id = ?", tid
  );
  if (!t) return null;
  const settings = parseJson<Record<string, unknown>>(t.settings_json, {});
  return typeof settings.github_token === "string" && settings.github_token.length > 0
    ? (settings.github_token as string)
    : null;
}

/** Headers for GitHub API calls: bearer auth when configured, User-Agent always. */
export function githubHeaders(token: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": "pramaan-mvp",
    Accept: "application/vnd.github+json",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
