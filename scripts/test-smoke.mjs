/**
 * Pramaan MVP smoke test — exercises the REAL API against a running dev server.
 * Usage: npm test  (expects the dev server on $BASE_URL or http://localhost:3000)
 *
 * Every assertion hits the live SQLite-backed API. No mocks.
 */
import { strict as assert } from "node:assert";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.PRAMAAN_ADMIN_KEY || "";
const j = (r) => r.json();

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(ADMIN_KEY ? { "x-pramaan-key": ADMIN_KEY } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await j(r).catch(() => ({}));
  return { status: r.status, data };
}

console.log("=== PRAMAAN SMOKE TEST ===");

// 0. Resolve the real property id (no hardcoded demo ids)
const cfg = await api("GET", "/api/consent/config");
assert.equal(cfg.status, 200, "consent config must load (workspace set up?)");
const PROP = cfg.data.property.id;
assert.ok(PROP, "a property must exist");
console.log(`  [0] property: ${PROP} (${cfg.data.property.domain})`);

// 1. Health: real DB + valid chain
{
  const { status, data } = await api("GET", "/api/health");
  assert.equal(status, 200);
  assert.equal(data.status, "ok");
  assert.ok(data.database.startsWith("connected"));
  assert.match(data.evidence_ledger.chain, /^valid/);
  console.log(`  [1] health ok — ${data.evidence_ledger.chain}`);
}

// 2. Evidence chain verifies end-to-end
{
  const { data } = await api("GET", "/api/evidence?verify=1");
  assert.equal(data.verify.ok, true);
  assert.ok(data.verify.checked >= 1);
  console.log(`  [2] evidence chain valid (${data.verify.checked} entries)`);
}

// 3. Consent event append is hash-chained
{
  const vh = `test-${Date.now()}`;
  const { status, data } = await api("POST", "/api/consent/events", {
    visitor_hash: vh,
    age_band: "adult",
    categories: { necessary: true, functional: false, analytics: false, marketing: false },
    consent_mode: "smoke_test",
  });
  assert.equal(status, 201);
  assert.equal(data.event_hash.length, 64, "event_hash must be a real SHA-256 hex string");
  const list = await api("GET", "/api/consent/events?limit=5");
  assert.ok(list.data.events.some((e) => e.visitor_hash === vh));
  console.log(`  [3] consent event chained (sha256 ${data.event_hash.slice(0, 12)}…)`);
}

// 4. Age-gating enforcement: under-18 → necessary-only
{
  const { data } = await api("POST", "/api/consent/events", {
    visitor_hash: `minor-${Date.now()}`,
    age_band: "under18",
    categories: { necessary: true, functional: true, analytics: true, marketing: true },
    consent_mode: "smoke_test",
  });
  assert.equal(data.age_band, "under18");
  assert.deepEqual(data.categories, { necessary: true, functional: false, analytics: false, marketing: false });
  console.log("  [4] age-gating enforced: under-18 forced to necessary-only");
}

// 5. Real cookie scan against example.com
{
  const { status, data } = await api("POST", "/api/scan", { url: "https://example.com" });
  assert.equal(status, 201);
  assert.equal(data.ok, true);
  assert.ok(data.pages_crawled >= 1);
  console.log(`  [5] real scan: ${data.pages_crawled} pages, ${data.cookies.length} cookies`);
}

// 6. DSR lifecycle: file → assign → resolve
{
  const created = await api("POST", "/api/requests", {
    type: "deletion",
    requester_name: "Smoke Test",
    requester_email: "smoke@example.in",
    note: "automated smoke test — safe to delete",
  });
  assert.equal(created.status, 201);
  const id = created.data.id;
  const patched = await api("PATCH", "/api/requests", { id, status: "in_progress", assignee: "smoke" });
  assert.equal(patched.status, 200);
  const resolved = await api("PATCH", "/api/requests", { id, status: "resolved", resolution_note: "smoke test cleanup" });
  assert.equal(resolved.status, 200);
  console.log(`  [6] DSR lifecycle ok (${id})`);
}

// 7. Breach: open → notify (logged) → step advance
{
  const opened = await api("POST", "/api/incidents", {
    title: "Smoke test breach",
    description: "automated test",
    severity: "low",
    affected_count: 1,
  });
  assert.equal(opened.status, 201);
  const bid = opened.data.id;
  const notified = await api("POST", `/api/incidents/${bid}/notify`, {
    channel: "board_email",
    recipient: "board@example.in",
    subject: "Smoke test",
    message: "test notification",
  });
  assert.equal(notified.data.status, "logged");
  const stepped = await api("PATCH", "/api/incidents", { id: bid, step: 2 });
  assert.equal(stepped.status, 200);
  const closed = await api("PATCH", "/api/incidents", { id: bid, status: "closed" });
  assert.equal(closed.status, 200);
  console.log(`  [7] breach flow ok (${opened.data.code})`);
}

// 8. PII classifier: Indian identifiers
{
  const sys = await api("POST", "/api/systems", { name: "Smoke Test CRM", kind: "saas" });
  assert.equal(sys.status, 201);
  const { data } = await api("POST", "/api/data-fields", {
    system_id: sys.data.id,
    field_name: "smoke_test_voter_id",
  });
  assert.equal(data.classification.category, "govt_id");
  console.log("  [8] classifier: voter_id → govt_id");
}

// 9. Cookie reclassification (admin override)
{
  const cookies = await api("GET", "/api/cookies");
  const target = cookies.data.cookies.find((c) => c.category === "unclassified");
  if (target) {
    const r = await api("PATCH", "/api/cookies", { id: target.id, category: "analytics" });
    assert.equal(r.status, 200);
    console.log(`  [9] reclassified ${target.name} → analytics`);
  } else {
    console.log("  [9] skipped (no unclassified cookies)");
  }
}

// 11. Guardian consent flow: record → list → verify
{
  const vh = `guardian-${Date.now()}`;
  const created = await api("POST", "/api/consent/guardian", {
    property_id: PROP,
    visitor_hash: vh,
    guardian_name: "Test Guardian",
    relationship: "Parent",
    contact: "guardian@example.in",
    consent_given: true,
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.contact_hash.length, 64, "contact_hash must be real SHA-256");
  assert.ok(!JSON.stringify(created.data).includes("guardian@example.in"), "raw contact must not echo");
  const rejected = await api("POST", "/api/consent/guardian", {
    property_id: PROP,
    visitor_hash: vh,
    guardian_name: "Test Guardian",
    relationship: "Parent",
    contact: "guardian@example.in",
    consent_given: false,
  });
  assert.equal(rejected.status, 400);
  const list = await api("GET", `/api/consent/guardian?property_id=${PROP}`);
  assert.ok(list.data.consents.some((g) => g.visitor_hash === vh));
  const verified = await api("PATCH", `/api/consent/guardian/${created.data.id}`, { action: "verify" });
  assert.equal(verified.status, 200);
  assert.ok(verified.data.verified_at);
  console.log(`  [11] guardian consent recorded + verified (${created.data.id})`);
}

// 12. Snippet has the guardian step (cookie table holds only real scan results now)
{
  const snippet = await fetch(`${BASE}/api/consent/snippet`);
  const js = await snippet.text();
  assert.match(js.toLowerCase(), /guardian/, "snippet must include the guardian step");
  console.log("  [12] snippet has guardian step");
}

// 13. Real notification sending via local mock (Resend-compatible)
const mockHits = [];
let mockServer;
let mockPort;
{
  const http = await import("node:http");
  mockServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      mockHits.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body || "{}") });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: "mock_msg_123" }));
    });
  });
  await new Promise((r) => mockServer.listen(0, "127.0.0.1", r));
  mockPort = mockServer.address().port;

  const saved = await api("POST", "/api/admin/notifications", {
    resend_api_key: "re_test_key_abc",
    resend_from: "dpo@smoke.test",
    resend_base_url: `http://127.0.0.1:${mockPort}`,
  });
  assert.equal(saved.status, 200);

  const opened = await api("POST", "/api/incidents", {
    title: "Smoke notify test",
    description: "mock provider test",
    severity: "low",
    affected_count: 1,
  });
  const bid = opened.data.id;
  const sent = await api("POST", `/api/incidents/${bid}/notify`, {
    channel: "user_email",
    recipient: "user@smoke.test",
    subject: "Breach notice",
    message: "test breach message",
  });
  assert.equal(sent.data.status, "sent");
  assert.equal(sent.data.provider_id, "mock_msg_123");
  assert.equal(mockHits.length, 1);
  assert.equal(mockHits[0].auth, "Bearer re_test_key_abc");
  assert.deepEqual(mockHits[0].body.to, ["user@smoke.test"]);
  assert.equal(mockHits[0].body.subject, "Breach notice");

  // Not configured → honest log-only
  await api("POST", "/api/admin/notifications", { resend_api_key: "", resend_from: "", resend_base_url: "", whatsapp_webhook_url: "", whatsapp_bearer: "" });
  const hitsBefore = mockHits.length;
  const logged = await api("POST", `/api/incidents/${bid}/notify`, {
    channel: "user_whatsapp",
    recipient: "+910000000000",
    message: "test",
  });
  assert.equal(logged.data.status, "logged");
  assert.equal(mockHits.length, hitsBefore, "no provider hit when unconfigured");
  const status = await api("GET", `/api/incidents/${bid}/notify`);
  assert.match(status.data.sender_status, /not_configured/);
  console.log("  [13] notify: sent via mock provider, honest log-only when unconfigured");
}

// 14. DSR resolution email (sent + logged paths)
{
  // Re-configure mock provider
  await api("POST", "/api/admin/notifications", {
    resend_api_key: "re_test_key_abc",
    resend_from: "dpo@smoke.test",
    resend_base_url: `http://127.0.0.1:${mockPort}`,
  });
  const c1 = await api("POST", "/api/requests", {
    type: "access",
    requester_name: "Smoke",
    requester_email: "requester@smoke.test",
    note: "resolution email test",
  });
  const r1 = await api("PATCH", "/api/requests", { id: c1.data.id, status: "resolved", resolution_note: "done" });
  assert.equal(r1.data.email_status, "sent");
  assert.equal(mockHits[mockHits.length - 1].body.to[0], "requester@smoke.test");

  await api("POST", "/api/admin/notifications", { resend_api_key: "", resend_from: "", resend_base_url: "" });
  const c2 = await api("POST", "/api/requests", {
    type: "access",
    requester_name: "Smoke",
    requester_email: "requester2@smoke.test",
    note: "resolution email test 2",
  });
  const r2 = await api("PATCH", "/api/requests", { id: c2.data.id, status: "resolved", resolution_note: "done" });
  assert.equal(r2.data.email_status, "logged_not_configured");
  console.log("  [14] DSR resolution email: sent + logged_not_configured paths ok");
}

// 15. Vendor questionnaire: register → send → public submit → responded
{
  const reg = await api("POST", "/api/vendors", { name: "Smoke Test Vendor", category: "cloud", country: "India" });
  assert.equal(reg.status, 201);
  const vid = reg.data.id;
  const sent = await api("POST", `/api/vendors/${vid}/questionnaire`, {});
  assert.equal(sent.status, 201);
  assert.ok(sent.data.token.length > 20, "token must be unguessable");
  const token = sent.data.token;
  const answers = {
    data_categories: "names, emails",
    purposes: "order fulfilment",
    retention: "3 years",
    sub_processors: "none",
    cross_border: "none",
    security_measures: "encryption at rest",
    dpa_signed: "yes",
    dpa_date: "2026-01-15",
    breach_notification: "within 24 hours",
    grievance_contact: "dpo@vendor.test",
    dsr_handling: "via privacy inbox",
  };
  const submitted = await api("POST", `/api/q/${token}`, { answers });
  assert.equal(submitted.status, 201);
  const dup = await api("POST", `/api/q/${token}`, { answers });
  assert.equal(dup.status, 409);
  const badToken = await api("POST", "/api/q/bad_token_xyz", { answers });
  assert.equal(badToken.status, 404);
  const latest = await api("GET", `/api/vendors/${vid}/questionnaire`);
  assert.equal(latest.data.questionnaire.status, "responded");
  console.log(`  [15] questionnaire: sent → submitted → responded (${token.slice(0, 12)}…)`);
}

// 16. GitHub code scan (small public repo, unauthenticated)
{
  const { status, data } = await api("POST", "/api/scan/github", { owner: "octocat", repo: "Hello-World" });
  assert.equal(status, 201);
  assert.ok(data.scan_id, "scan should return a scan_id");
  console.log(`  [16] github scan ok (${data.files_scanned} files, ${data.fields_found} fields)`);
}

// 17. Ledger grew and still verifies after all mutations
{
  const { data } = await api("GET", "/api/evidence?verify=1");
  assert.equal(data.verify.ok, true);
  console.log(`  [17] chain still valid after mutations (${data.verify.checked} entries)`);
}

if (mockServer) mockServer.close();
console.log("\nALL SMOKE TESTS PASSED ✓\n");
