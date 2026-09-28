/**
 * Demo seed for the Pramaan MVP.
 *
 * Fictional tenant: Meridian Foods Pvt. Ltd. (meridianfoods.in), a D2C food
 * brand. All people, events and numbers are invented for the demo — the
 * plumbing (hash chains, persistence, scanners) is real.
 */
import type { DatabaseSync } from "node:sqlite";
import { newId, nowIso, sha256, ledgerAppend, consentAppend } from "./db";

const H = (s: string) => sha256(s).slice(0, 16);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export function seedDemoTenant(db: DatabaseSync) {
  const t = nowIso();

  /* ---------------- Tenant & property ---------------- */
  db.prepare(
    `INSERT INTO tenant (id, name, domain, dpo_name, dpo_email, settings_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "tenant_meridian",
    "Meridian Foods Pvt. Ltd.",
    "meridianfoods.in",
    "Rudra Pratap Dalei",
    "dpo@meridianfoods.in",
    JSON.stringify({
      age_gating: true,
      notice_version: "v2.3",
      banner: {
        title: "We value your privacy",
        text: "Meridian Foods uses cookies to run the store, remember your cart and — with your permission — measure and personalise. Read our Privacy Notice.",
        accept_label: "Accept all",
        reject_label: "Reject non-essential",
        customize_label: "Customise",
        position: "bottom",
        theme: "paper",
      },
      form_branding: { heading: "Exercise your privacy rights", accent: "seal" },
    }),
    t
  );

  db.prepare(
    `INSERT INTO properties (id, tenant_id, domain, display_name, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run("prop_main", "tenant_meridian", "meridianfoods.in", "Meridian Foods — Web Store", t);

  /* ---------------- Cookie inventory ---------------- */
  const cookies: Array<[string, string, string, string, string, string, string]> = [
    // name, category, source, description, duration, vendor_hint, first_seen_offset
    ["mf_session", "necessary", "auto", "Keeps you signed in between pages during checkout.", "Session", "Meridian Foods", "14d"],
    ["cart_id", "necessary", "auto", "Remembers the items in your shopping cart.", "30 days", "Meridian Foods", "14d"],
    ["mf_consent", "necessary", "auto", "Stores the consent choices you make in this banner.", "12 months", "Meridian Foods", "14d"],
    ["cf_clearance", "necessary", "auto", "Bot protection challenge token.", "30 minutes", "Cloudflare", "14d"],
    ["razorpay_session", "necessary", "auto", "Payment session for Razorpay checkout.", "Session", "Razorpay", "14d"],
    ["mf_pref_lang", "functional", "auto", "Remembers your language preference (EN/HI).", "12 months", "Meridian Foods", "13d"],
    ["mf_ab_bucket", "functional", "auto", "A/B test bucket for homepage experiments.", "30 days", "Meridian Foods", "10d"],
    ["_ga", "analytics", "auto", "Google Analytics: distinguishes visitors.", "2 years", "Google", "14d"],
    ["_ga_MF9X2KQ", "analytics", "auto", "Google Analytics: persists session state.", "2 years", "Google", "14d"],
    ["_fbp", "marketing", "auto", "Meta Pixel: tracks visits for ad measurement.", "3 months", "Meta", "12d"],
    ["_gcl_au", "marketing", "auto", "Google Ads: stores click identifiers.", "3 months", "Google", "12d"],
    ["_mf_track", "unclassified", "auto", "Seen on /checkout — vendor not yet identified.", "Unknown", "", "2d"],
    ["px_uid", "unclassified", "auto", "Seen on /blog — vendor not yet identified.", "Unknown", "", "1d"],
  ];
  const cookieStmt = db.prepare(
    `INSERT INTO cookies (id, property_id, name, category, source, description, duration, vendor_hint, first_seen, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const [name, cat, src, desc, dur, vendor, seen] of cookies) {
    cookieStmt.run(newId("ck"), "prop_main", name, cat, src, desc, dur, vendor, daysAgo(parseInt(seen)), t);
  }

  /* ---------------- Scans ---------------- */
  db.prepare(
    `INSERT INTO scans (id, property_id, kind, status, started_at, finished_at, stats_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId("scan"),
    "prop_main",
    "cookie",
    "complete",
    daysAgo(1),
    daysAgo(1),
    JSON.stringify({ pages_crawled: 14, cookies_found: 13, new_since_last: 2, trackers_blocked_pre_consent: 0 })
  );

  /* ---------------- Consent events (hash-chained) ---------------- */
  const consentModes: Array<[string, { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean }, string, string]> = [
    ["adult", { necessary: true, functional: true, analytics: true, marketing: true }, "banner", "3d"],
    ["adult", { necessary: true, functional: false, analytics: false, marketing: false }, "banner", "3d"],
    ["adult", { necessary: true, functional: true, analytics: false, marketing: false }, "banner", "2d"],
    ["under18", { necessary: true, functional: false, analytics: false, marketing: false }, "age_gate", "2d"],
    ["adult", { necessary: true, functional: true, analytics: true, marketing: false }, "banner", "2d"],
    ["adult", { necessary: true, functional: false, analytics: true, marketing: true }, "banner", "1d"],
    ["under18", { necessary: true, functional: false, analytics: false, marketing: false }, "age_gate", "1d"],
    ["adult", { necessary: true, functional: true, analytics: true, marketing: true }, "banner", "1d"],
    ["adult", { necessary: true, functional: false, analytics: false, marketing: false }, "banner", "20h"],
    ["adult", { necessary: true, functional: true, analytics: false, marketing: true }, "banner", "12h"],
    ["adult", { necessary: true, functional: true, analytics: true, marketing: true }, "banner", "6h"],
    ["under18", { necessary: true, functional: false, analytics: false, marketing: false }, "age_gate", "2h"],
  ];
  // Insert oldest-first so the chain builds in chronological order.
  for (const [band, cats, mode, ago] of [...consentModes].reverse()) {
    // Temporarily backdate: consentAppend uses nowIso; we insert then fix created_at.
    const { id } = consentAppend(db, {
      property_id: "prop_main",
      visitor_hash: H("visitor-" + Math.random().toString(36).slice(2)),
      age_band: band,
      categories: cats,
      consent_mode: mode,
      notice_version: "v2.3",
    });
    const when = ago.endsWith("d") ? daysAgo(parseInt(ago)) : hoursAgo(parseInt(ago));
    db.prepare("UPDATE consent_events SET created_at = ? WHERE id = ?").run(when, id);
  }

  /* ---------------- DSR cases ---------------- */
  const dsrStmt = db.prepare(
    `INSERT INTO dsr_cases (id, type, requester_name, requester_email, note, status, assignee, sla_due_at, created_at, resolved_at, resolution_note, tasks_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  dsrStmt.run(
    "DSR-2026-0041", "access", "Ananya Iyer", "ananya.iyer@example.in",
    "Please share all personal data you hold about me, including order history.",
    "in_progress", "Rudra Pratap Dalei",
    new Date(Date.now() + 26 * 3600_000).toISOString(), daysAgo(2), null, "",
    JSON.stringify([
      { label: "Verify requester identity (OTP to registered email)", done: true },
      { label: "Pull records: users, orders, support tickets", done: true },
      { label: "Redact other individuals' data", done: false },
      { label: "Send data package + confirmation email", done: false },
    ])
  );
  dsrStmt.run(
    "DSR-2026-0042", "deletion", "Vikram Malhotra", "vikram.m@example.in",
    "Delete my account and all associated data. Order #MF-88213 was cancelled.",
    "new", "",
    new Date(Date.now() + 3 * 86_400_000).toISOString(), hoursAgo(5), null, "",
    JSON.stringify([
      { label: "Verify requester identity", done: false },
      { label: "Check retention overrides (tax invoices: 8 yrs)", done: false },
      { label: "Delete from prod DB, warehouse, backups queue", done: false },
      { label: "Confirm deletion to requester", done: false },
    ])
  );
  dsrStmt.run(
    "DSR-2026-0039", "correction", "Sana Sheikh", "sana.sheikh@example.in",
    "My phone number on the account is wrong — updated to the one in this email.",
    "resolved", "Rudra Pratap Dalei",
    daysAgo(1), daysAgo(4), daysAgo(2), "Phone number corrected in users table; confirmation email sent.",
    JSON.stringify([{ label: "Verify identity", done: true }, { label: "Update phone", done: true }])
  );

  /* ---------------- Breach case (live clocks) ---------------- */
  const awareness = hoursAgo(30);
  db.prepare(
    `INSERT INTO breach_cases (id, code, title, description, status, severity, awareness_at, systems_json, categories_json, affected_count, step, board_notified_at, users_notified_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "breach_001", "BR-2026-0117",
    "Support export emailed to wrong recipient",
    "A CSV export of 1,240 customer support interactions (names, phone numbers, order references) was emailed to a former support agent whose access was not revoked. Export generated from Zendesk by the support lead.",
    "open", "high", awareness,
    JSON.stringify(["Zendesk", "Gmail"]),
    JSON.stringify(["customer_name", "customer_phone", "order_history"]),
    1240, 1, null, null, awareness
  );

  /* ---------------- Vendors ---------------- */
  const vendors: Array<[string, string, string, string, string, string, string, string]> = [
    ["Razorpay", "Payments", "razorpay.com", "India", "signed", "low", "Engineering", "manual"],
    ["Amazon Web Services", "Cloud hosting (ap-south-1)", "aws.amazon.com", "India", "signed", "low", "Engineering", "manual"],
    ["Delhivery", "Logistics", "delhivery.com", "India", "signed", "medium", "Operations", "manual"],
    ["Freshdesk", "Customer support", "freshworks.com", "India", "signed", "medium", "Support", "manual"],
    ["SendGrid", "Transactional email", "sendgrid.com", "USA", "under_review", "medium", "Engineering", "cookie_scan"],
    ["Meta", "Advertising pixel", "meta.com", "USA", "not_started", "high", "Growth", "cookie_scan"],
    ["Google", "Analytics & Ads", "google.com", "USA", "under_review", "medium", "Growth", "cookie_scan"],
  ];
  const vendorStmt = db.prepare(
    `INSERT INTO vendors (id, name, category, domain, country, dpa_status, risk_tier, owner, notes, discovered_via, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const vendorIds: Record<string, string> = {};
  for (const [name, cat, domain, country, dpa, risk, owner, via] of vendors) {
    const id = newId("ven");
    vendorIds[name] = id;
    vendorStmt.run(id, name, cat, domain, country, dpa, risk, owner, "", via, t);
  }

  /* ---------------- Systems & data fields ---------------- */
  const systems: Array<[string, string, string, string]> = [
    ["Production Postgres (ap-south-1)", "database", "Engineering", "Primary order & customer database on RDS Mumbai."],
    ["meridianfoods.in", "website", "Engineering", "Next.js storefront; consent banner deployed."],
    ["meridian-store (GitHub)", "codebase", "Engineering", "Monorepo: storefront, checkout service, admin."],
    ["Razorpay Dashboard", "saas", "Finance", "Payment settlements & refunds."],
    ["Zendesk", "saas", "Support", "Customer support tickets & chat."],
  ];
  const sysStmt = db.prepare(
    `INSERT INTO systems (id, name, kind, owner_team, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const sysIds: Record<string, string> = {};
  for (const [name, kind, team, desc] of systems) {
    const id = newId("sys");
    sysIds[name] = id;
    sysStmt.run(id, name, kind, team, desc, t);
  }

  const fields: Array<[string, string, string, string, string]> = [
    // system, field, pii_category, source, note
    ["Production Postgres (ap-south-1)", "users.email", "direct_identifier", "auto", ""],
    ["Production Postgres (ap-south-1)", "users.phone", "direct_identifier", "auto", "Indian mobile numbers"],
    ["Production Postgres (ap-south-1)", "users.pan_number", "govt_id", "auto", "PAN collected for invoices above threshold"],
    ["Production Postgres (ap-south-1)", "users.dob", "quasi_identifier", "auto", ""],
    ["Production Postgres (ap-south-1)", "users.marketing_opt_in", "consent_record", "auto", ""],
    ["Production Postgres (ap-south-1)", "orders.upi_txn_id", "financial", "auto", "UPI transaction references"],
    ["Production Postgres (ap-south-1)", "orders.shipping_address", "direct_identifier", "auto", ""],
    ["Zendesk", "tickets.aadhaar_ref", "govt_id", "auto", "Agents sometimes paste Aadhaar refs — needs mapping"],
    ["meridianfoods.in", "analytics_events.ip_hash", "technical", "auto", "Hashed at collection"],
    ["meridian-store (GitHub)", "checkout.service.ts: buyerPhone", "direct_identifier", "auto", "Found by codebase scan"],
  ];
  const fieldStmt = db.prepare(
    `INSERT INTO data_fields (id, system_id, field_name, pii_category, classification_source, mapped_activity_id, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const [sys, field, cat, src, note] of fields) {
    fieldStmt.run(newId("fld"), sysIds[sys], field, cat, src, "", note);
  }

  /* ---------------- Processing activities ---------------- */
  const activities: Array<[string, string, string, string, string, string, string[]]> = [
    ["Checkout & Payments", "Take orders and collect payment for food orders.", "Engineering", '["customers"]', "Contract", "7 years (tax)", ["Razorpay", "Amazon Web Services"]],
    ["Order Fulfilment & Delivery", "Pick, pack and deliver orders to customers.", "Operations", '["customers"]', "Contract", "2 years", ["Delhivery", "Amazon Web Services"]],
    ["Marketing Campaigns", "Email/SMS offers and ad measurement.", "Growth", '["customers", "prospects"]', "Consent", "Until consent withdrawn", ["SendGrid", "Meta", "Google"]],
    ["Customer Support", "Resolve order issues over ticket, chat and phone.", "Support", '["customers"]', "Legitimate interest", "3 years", ["Freshdesk"]],
    ["Product Analytics", "Understand store usage to improve the experience.", "Product", '["visitors", "customers"]', "Consent", "14 months", ["Google", "Amazon Web Services"]],
  ];
  const actStmt = db.prepare(
    `INSERT INTO processing_activities (id, name, purpose, owner_team, data_subjects_json, lawful_basis, retention, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const linkStmt = db.prepare(`INSERT INTO activity_vendors (activity_id, vendor_id) VALUES (?, ?)`);
  for (const [name, purpose, team, subjects, basis, retention, vnames] of activities) {
    const id = newId("act");
    actStmt.run(id, name, purpose, team, subjects, basis, retention, t);
    for (const vn of vnames) linkStmt.run(id, vendorIds[vn]);
  }

  /* ---------------- Findings (attention queue) ---------------- */
  const findings: Array<[string, string, string, string, string, string, string, string]> = [
    ["consent", "Marketing cookies fire before consent on /checkout", "_fbp and _gcl_au observed in network log before any banner interaction on the checkout page.", "high", "needs_review", "DPDP Act §6 — consent must precede processing", "cookie_scan", "14d"],
    ["breach", "BR-2026-0117: user notification pending beyond 24h", "Breach awareness was 30h ago; affected users have not yet been notified.", "high", "needs_review", "DPDP Act §8(6) — notify affected principals without delay", "breach_center", "30h"],
    ["data_map", "Aadhaar reference field unmapped", "tickets.aadhaar_ref in Zendesk classified as govt_id but not mapped to any processing activity.", "medium", "needs_review", "DPDP Act §4 — purpose limitation", "classifier", "6d"],
    ["vendor", "Meta DPA not started", "Meta Pixel drops _fbp (marketing). No DPA on file; cross-border transfer safeguards unassessed.", "medium", "needs_review", "DPDP Act §16 — cross-border transfer", "cookie_scan", "12d"],
    ["dsr", "DSR-2026-0041 access request due in ~26h", "Access request from Ananya Iyer awaiting redaction + data package.", "medium", "needs_review", "DPDP Act §11, §13", "rights_center", "2d"],
    ["consent", "Cookie policy page updated to v2.3", "Notice version bumped; banner text re-published across property.", "low", "resolved", "", "manual", "3d"],
  ];
  const fStmt = db.prepare(
    `INSERT INTO findings (id, category, title, detail, severity, status, legal_ref, source, created_at, resolved_at, resolution_note, evidence_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const [cat, title, detail, sev, status, legal, src, ago] of findings) {
    const when = ago.endsWith("d") ? daysAgo(parseInt(ago)) : hoursAgo(parseInt(ago));
    const resolved = status === "resolved";
    fStmt.run(
      newId("fnd"), cat, title, detail, sev, status, legal, src, when,
      resolved ? daysAgo(2) : null, resolved ? "Notice v2.3 published; banner re-rendered." : "",
      resolved ? H("notice-v2.3") : ""
    );
  }

  /* ---------------- Privacy notice ---------------- */
  db.prepare(
    `INSERT INTO notices (id, version, title, content, published_at, active) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    newId("notice"), "v2.3", "Privacy Notice",
    [
      "Meridian Foods Pvt. Ltd. (\"we\") collects your name, contact details, order and payment information to fulfil your orders, and — only with your consent — to personalise offers and measure our store.",
      "Your rights under the DPDP Act, 2023: access a summary of your data; correct or complete it; erase it; nominate another person in case of incapacity; and withdraw consent at any time. Write to dpo@meridianfoods.in or use the request form on our website.",
      "We keep order records for 7 years for tax law and delete marketing data when you withdraw consent. We do not sell your personal data.",
      "If you are under 18, only strictly necessary cookies run on this site, and certain personalised features are disabled until a parent or guardian consents.",
    ].join("\n\n"),
    daysAgo(3), 1
  );

  /* ---------------- Seed ledger entries (chained) ---------------- */
  const L = (action: string, et: string, eid: string, summary: string, details: Record<string, unknown>, actor = "system") =>
    ledgerAppend(db, { actor, action, entity_type: et, entity_id: eid, summary, details });
  L("tenant.created", "tenant", "tenant_meridian", "Tenant workspace created for Meridian Foods Pvt. Ltd.", { domain: "meridianfoods.in" });
  L("notice.published", "notice", "v2.3", "Privacy Notice v2.3 published", { version: "v2.3" }, "Rudra Pratap Dalei");
  L("scan.completed", "scan", "cookie", "Cookie scan completed: 13 cookies across 14 pages", { cookies: 13, pages: 14 });
  L("consent.config_updated", "property", "prop_main", "Age-gating enabled; under-18 visitors get necessary-only mode", { age_gating: true }, "Rudra Pratap Dalei");
  L("dsr.received", "dsr_case", "DSR-2026-0041", "Access request received from Ananya Iyer", { channel: "hosted_form" });
  L("dsr.received", "dsr_case", "DSR-2026-0042", "Deletion request received from Vikram Malhotra", { channel: "hosted_form" });
  L("dsr.resolved", "dsr_case", "DSR-2026-0039", "Correction request resolved: phone number updated", {}, "Rudra Pratap Dalei");
  L("breach.opened", "breach_case", "breach_001", "Breach BR-2026-0117 opened: support export misdirected", { affected: 1240, severity: "high" }, "Rudra Pratap Dalei");
  L("breach.step_advanced", "breach_case", "breach_001", "Breach moved to step 2: clocks started (72h Board, user notice)", { step: 1 });
  L("finding.resolved", "finding", "notice-v2.3", "Finding resolved: cookie policy page updated to v2.3", {}, "Rudra Pratap Dalei");
}
