import { q, qOne, run, ok, bad, body, record, newId, nowIso } from "@/server/api";
import { classifyField } from "@/server/classify";
import { githubHeaders, readGithubToken } from "@/server/github";

/**
 * POST /api/scan/github — real codebase scan of a GitHub repo.
 *
 * Walks the repo tree (up to 200 text files, 200KB each), runs the rule-based
 * PII classifier over file paths and code identifiers found in contents, and
 * records matches as data_fields + findings (source 'github'). Uses the
 * configured GitHub token when present; without one, scans run unauthenticated
 * (60 req/hr, public repos only).
 */

const MAX_FILES = 200;
const MAX_FILE_BYTES = 200 * 1024;

const TEXT_EXTENSIONS = new Set([
  // code
  "ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs", "py", "pyi", "rb", "erb",
  "go", "rs", "java", "kt", "kts", "scala", "swift", "php", "cs", "vb", "cpp",
  "cc", "cxx", "h", "hpp", "hxx", "c", "m", "mm", "lua", "r", "jl", "dart",
  "ex", "exs", "erl", "hrl", "clj", "hs", "ml", "fs", "fsx", "sol", "vue",
  "svelte", "astro", "ejs", "hbs", "njk", "twig",
  // markup/styles
  "html", "htm", "xhtml", "css", "scss", "sass", "less",
  // config/data
  "json", "jsonc", "json5", "yaml", "yml", "toml", "ini", "cfg", "conf", "config",
  "env", "example", "properties", "plist", "xml", "xsd", "tf", "tfvars", "hcl",
  "gradle", "prisma", "graphql", "gql", "sql",
  // docs/text
  "txt", "md", "mdx", "rst", "adoc", "text",
  // scripts
  "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd",
]);

const TEXT_BASENAMES = new Set([
  "dockerfile", "containerfile", "makefile", "rakefile", "gemfile", "procfile",
  "vagrantfile", "brewfile", "justfile", "readme", "license", "licence", "changelog",
  "notice", "authors", "contributing", "codeowners",
]);

const MINIFIED = /(\.min|\.bundle)\.(js|css)$/i;

interface ScanBody {
  owner: string;
  repo: string;
  branch?: string;
}

interface GhError {
  status: number;
  message: string;
}

function ghError(status: number, message: string): GhError {
  return { status, message };
}

async function ghJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
  if (res.status === 404) throw ghError(404, "repo not found");
  if (res.status === 401) throw ghError(401, "Invalid GitHub token — GitHub rejected it. Check the token in Settings.");
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const reset = res.headers.get("x-ratelimit-reset");
      const when = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : "shortly";
      const authed = headers.Authorization ? "authenticated" : "unauthenticated (60 req/hr)";
      throw ghError(429, `GitHub rate limit hit — ${authed} quota exhausted, resets around ${when}.`);
    }
    throw ghError(403, "GitHub refused the request (403) — the repo may be private or the token lacks access.");
  }
  if (!res.ok) throw ghError(502, `GitHub API error ${res.status} — try again.`);
  return res.json();
}

async function ghRaw(url: string, headers: Record<string, string>): Promise<string | null> {
  const res = await fetch(url, {
    headers: { ...headers, Accept: "application/vnd.github.raw" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text.slice(0, MAX_FILE_BYTES);
}

function isTextFile(path: string): boolean {
  if (MINIFIED.test(path)) return false;
  const base = path.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot > 0) {
    return TEXT_EXTENSIONS.has(base.slice(dot + 1).toLowerCase());
  }
  return TEXT_BASENAMES.has(base.toLowerCase());
}

/** Split an identifier-ish token into sub-words for classification (camelCase, snake_case, kebab). */
function subWords(token: string): string[] {
  return token
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w.length >= 3);
}

interface PiiHit {
  path: string;
  identifier: string;
  category: string;
  label: string;
  reason: string;
  via: "path" | "content";
}

const MAX_TOKENS_PER_FILE = 2000;

function classifyContent(path: string, content: string): PiiHit[] {
  const hits: PiiHit[] = [];
  const seen = new Set<string>();
  const consider = (token: string, via: "path" | "content") => {
    for (const word of subWords(token)) {
      const key = `${word.toLowerCase()}@${via}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const c = classifyField(word);
      if (c.category !== "none") {
        hits.push({ path, identifier: word, category: c.category, label: c.label, reason: c.reason, via });
      }
    }
  };

  // 1. File path segments (e.g. src/models/customer_email.py)
  const pathNoExt = path.replace(/\.[a-zA-Z0-9]+$/, "");
  for (const seg of pathNoExt.split(/[\/\\]+/)) {
    if (seg) consider(seg, "path");
  }

  // 2. Identifier-like tokens + JSON/object keys in the content
  const tokens = new Set<string>();
  const ident = /[A-Za-z_][A-Za-z0-9_]{2,63}/g;
  let m: RegExpExecArray | null;
  while ((m = ident.exec(content)) !== null && tokens.size < MAX_TOKENS_PER_FILE) {
    tokens.add(m[0]);
  }
  const keys = /"([A-Za-z_][A-Za-z0-9_ ]{2,60})"\s*:/g;
  while ((m = keys.exec(content)) !== null && tokens.size < MAX_TOKENS_PER_FILE) {
    tokens.add(m[1]);
  }
  for (const t of tokens) consider(t, "content");
  return hits;
}

export async function POST(req: Request) {
  const b = await body<ScanBody>(req);
  const owner = (b?.owner ?? "").trim();
  const repo = (b?.repo ?? "").trim();
  const nameRe = /^[A-Za-z0-9_.-]+$/;
  if (!owner || !repo) return bad("owner and repo are required");
  if (!nameRe.test(owner) || !nameRe.test(repo)) return bad("owner/repo contain invalid characters");

  const token = await readGithubToken();
  const headers = githubHeaders(token);
  const scanId = newId("scan");
  const started = nowIso();
  const repoName = `${owner}/${repo}`;
  await run(`INSERT INTO scans (id, property_id, kind, status, started_at, stats_json) VALUES (?, NULL, 'github', 'running', ?, '{}')`, scanId, started);

  const fail = async (message: string, status: number) => {
    const finished = nowIso();
    await run(`UPDATE scans SET status = 'failed', finished_at = ?, error = ? WHERE id = ?`, finished, message, scanId);
    await record("scan.failed", "scan", scanId, `GitHub scan failed for ${repoName}: ${message}`, { owner, repo });
    return bad(message, status);
  };

  try {
    // 1. Repo metadata: honest 404 + default branch.
    const repoMeta = (await ghJson(`https://api.github.com/repos/${owner}/${repo}`, headers)) as {
      default_branch?: string;
    };
    const branch = (b?.branch ?? "").trim() || repoMeta.default_branch || "main";

    // 2. Full tree.
    const treeRes = (await ghJson(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      headers
    )) as {
      truncated?: boolean;
      tree: Array<{ type: string; path: string; url?: string; size?: number }>;
    };
    const truncated = !!treeRes.truncated;

    const blobs = treeRes.tree.filter((t) => t.type === "blob" && t.url && isTextFile(t.path));
    const candidates = blobs.slice(0, MAX_FILES);
    let skippedBytes = 0;
    const scanned: string[] = [];
    const skipped: string[] = [];
    const hits: PiiHit[] = [];

    // 3. Fetch + classify each file.
    for (const entry of candidates) {
      if ((entry.size ?? 0) > MAX_FILE_BYTES) {
        skippedBytes++;
        skipped.push(`${entry.path} (over 200KB)`);
        continue;
      }
      const raw = await ghRaw(entry.url as string, headers);
      if (raw === null) {
        skipped.push(`${entry.path} (fetch failed)`);
        continue;
      }
      scanned.push(entry.path);
      hits.push(...classifyContent(entry.path, raw));
    }

    // 4. Persist: one codebase system for the repo (reused across scans).
    const sysName = repoName;
    let sys = await qOne(`SELECT id FROM systems WHERE name = ? AND kind = 'codebase'`, sysName) as | { id: string }
      | undefined;
    let systemId: string;
    if (sys) {
      systemId = sys.id;
    } else {
      systemId = newId("sys");
      await run(`INSERT INTO systems (id, name, kind, owner_team, description, created_at) VALUES (?, ?, 'codebase', 'Engineering', ?, ?)`, systemId, sysName, `GitHub repository scanned for personal-data fields (${branch}).`, started);
    }

    const finished = nowIso();
    const note = `Found by GitHub scan of ${repoName}@${branch}`;
    const existing = new Set(
      (await q(`SELECT field_name FROM data_fields WHERE system_id = ?`, systemId) as Array<{ field_name: string }>)
        .map((r) => r.field_name)
    );
    let fieldsAdded = 0;
    for (const h of hits) {
      const fieldName = h.via === "path" ? h.path : `${h.path}: ${h.identifier}`;
      if (existing.has(fieldName)) continue;
      existing.add(fieldName);
      await run(`INSERT INTO data_fields (id, system_id, field_name, pii_category, classification_source, mapped_activity_id, note)
       VALUES (?, ?, ?, ?, 'auto', '', ?)`, newId("fld"), systemId, fieldName, h.category, `${note} — ${h.reason} (${h.via === "path" ? "file path" : "code identifier"})`);
      fieldsAdded++;
    }

    // 5. Findings, aggregated by PII category so the queue stays readable.
    const byCat = new Map<string, PiiHit[]>();
    for (const h of hits) {
      if (!byCat.has(h.category)) byCat.set(h.category, []);
      byCat.get(h.category)!.push(h);
    }
    let findingsAdded = 0;
    for (const [cat, list] of byCat) {
      const examples = list
        .slice(0, 8)
        .map((h) => `${h.path}${h.via === "path" ? "" : `: ${h.identifier}`} — ${h.reason}`)
        .join("\n");
      const more = list.length > 8 ? `\n… and ${list.length - 8} more.` : "";
      await run(`INSERT INTO findings (id, category, title, detail, severity, status, legal_ref, source, created_at)
       VALUES (?, 'data_map', ?, ?, 'medium', 'needs_review', 'DPDP Act §4 — purpose limitation', 'github', ?)`, newId("fnd"),
        `GitHub scan: ${list.length} ${cat.replace(/_/g, " ")} field${list.length === 1 ? "" : "s"} in ${repoName}`,
        `The rule-based PII classifier flagged these in ${repoName}@${branch}:\n${examples}${more}\n\nMap them to processing activities in the data map.`,
        finished);
      findingsAdded++;
    }

    const stats = {
      repo: repoName,
      branch,
      authenticated: !!token,
      files_scanned: scanned.length,
      files_skipped: skipped.length,
      tree_truncated: truncated,
      pii_hits: hits.length,
      fields_added: fieldsAdded,
      findings_added: findingsAdded,
    };
    await run(`UPDATE scans SET status = 'complete', finished_at = ?, stats_json = ? WHERE id = ?`, finished, JSON.stringify(stats), scanId);
    await record(
      "scan.github_completed",
      "scan",
      scanId,
      fieldsAdded > 0
        ? `GitHub scan of ${repoName}@${branch}: ${scanned.length} files, ${fieldsAdded} PII fields (${hits.length} hits)`
        : `GitHub scan of ${repoName}@${branch}: ${scanned.length} files — no PII found by the rule-based classifier`,
      stats
    );

    return ok(
      {
        scan_id: scanId,
        repo: repoName,
        branch,
        authenticated: !!token,
        files_scanned: scanned.length,
        files_skipped: skipped.length,
        skipped_detail: skipped,
        tree_truncated: truncated,
        fields_found: fieldsAdded,
        findings_added: findingsAdded,
        note: fieldsAdded === 0
          ? "No PII-like identifiers found by the rule-based classifier."
          : `${fieldsAdded} fields recorded in the data map; ${findingsAdded} findings raised.`,
      },
      201
    );
  } catch (e) {
    if (e && typeof e === "object" && "status" in e && "message" in e) {
      const ge = e as GhError;
      return fail(ge.message, ge.status);
    }
    return fail(e instanceof Error ? e.message : "Scan failed", 502);
  }
}
