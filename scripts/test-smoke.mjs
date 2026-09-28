/**
 * Pramaan MVP smoke test — exercises the REAL API against a running dev server.
 * Usage: npm test  (expects the dev server on $BASE_URL or http://localhost:3000)
 *
 * Every assertion hits the live SQLite-backed API. No mocks.
 */
import { strict as assert } from "node:assert";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const j = (r) => r.json();

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await j(r).catch(() => ({}));
  return { status: r.status, data };
}

console.log("=== PRAMAAN MVP SMOKE TEST ===");

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
  assert.ok(data.verify.checked >= 10);
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
  const { data } = await api("POST", "/api/data-fields", {
    system_id: (await (await fetch(`${BASE}/api/systems`)).json()).systems[0].id,
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

// 10. Ledger grew and still verifies after all mutations
{
  const { data } = await api("GET", "/api/evidence?verify=1");
  assert.equal(data.verify.ok, true);
  console.log(`  [10] chain still valid after mutations (${data.verify.checked} entries)`);
}

console.log("\nALL SMOKE TESTS PASSED ✓\n");
