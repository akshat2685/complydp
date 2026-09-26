import { strict as assert } from "node:assert";
import { initialTenant, initialFindings, initialWebProperty } from "../src/lib/mock-data";
import {
  initialConsentEvents,
  initialRequests,
  initialIncidents,
  initialPersonalDataFields,
  initialProcessingActivities,
  initialVendors,
} from "../src/lib/mock-data-extended";
import { generateEvidenceHash } from "../src/lib/store";


console.log("=== COMPLYDP SMOKE & REGULATORY TEST SUITE ===");

// Test 1: Tenant & Regulatory Framework Verification
console.log("[Test 1] Verifying Tenant & DPDP 2026 Framework Configuration...");
assert.equal(initialTenant.domain, "asterpay.in");
assert.ok(initialTenant.regulatoryFramework.includes("DPDP"));
assert.equal(initialTenant.dpoName, "Priya Sharma");
console.log("  ✓ Tenant and DPO configured for AsterPay Technologies Pvt. Ltd.");

// Test 2: Attention Queue & Finding Detection Model
console.log("[Test 2] Verifying Operational Findings & Attention Queue...");
assert.equal(initialFindings.length, 12, "Must initialize with 12 operational attention items");
const consentGaps = initialFindings.filter((f) => f.type === "CONSENT_GAP");
assert.ok(consentGaps.length >= 1, "Must detect consent gap (Segment on checkout)");
const unmappedData = initialFindings.filter((f) => f.type === "UNMAPPED_DATA");
assert.ok(unmappedData.length >= 1, "Must detect unmapped PII field (customer_phone)");
console.log("  ✓ 12 attention findings verified with provenance");

// Test 3: Dual Incident Clocks (DPBI 72h vs Direct Notice)
console.log("[Test 3] Verifying DPBI 72h Clock vs Data Principal Direct Notice Distinction...");
const incident = initialIncidents[0];
assert.ok(incident, "Incident INC-2026-004 must exist");
const dpbiObligation = incident.obligations.find((o) => o.authority.includes("DPBI"));
assert.ok(dpbiObligation, "DPBI obligation must exist");
assert.equal(dpbiObligation.statutoryClockHours, 72, "DPBI clock must be exactly 72 hours under Rule 11");
assert.equal(dpbiObligation.hoursRemaining, 51);

const principalObligation = incident.obligations.find((o) => o.authority.includes("Data Principals"));
assert.ok(principalObligation, "Data Principal obligation must exist");
assert.ok(principalObligation.deadlineText.includes("Without delay"), "Data Principal notice must be 'Without delay'");
assert.notEqual(principalObligation.deadlineText, dpbiObligation.deadlineText, "Must NOT confuse DPBI 72h with principal notice!");
console.log("  ✓ Regulatory distinction verified: DPBI 72h board reporting vs Principal 'without delay' notice");

// Test 4: Cryptographic Evidence Hashes & Minimization
console.log("[Test 4] Verifying Evidence Hashes & Pseudonymous Consent Ledger...");
assert.ok(initialConsentEvents.length >= 5);
for (const evt of initialConsentEvents) {
  assert.ok(evt.visitorRef.startsWith("anon_sha256_"), "Visitor identifier must be pseudonymous hash");
  assert.ok(evt.evidenceHash.length >= 32, "Evidence hash must be valid cryptographic proof");
}
const testHash = generateEvidenceHash("test_seed_123");
assert.ok(testHash.length >= 64, "Generated evidence hash must be 64+ char hex");
console.log("  ✓ Data minimization & cryptographic provenance hashes validated");

// Test 5: Personal Data Field Mapping (RoPA)
console.log("[Test 5] Verifying Personal Data Fields and RoPA mapping...");
assert.ok(initialPersonalDataFields.length >= 6);
const phoneField = initialPersonalDataFields.find((f) => f.fieldName === "customer_phone");
assert.ok(phoneField);
assert.equal(phoneField.category, "Contact Information");
assert.equal(phoneField.sourceRepo, "asterpay/core-checkout");

assert.ok(initialProcessingActivities.length >= 4);
const kycActivity = initialProcessingActivities.find((a) => a.id === "act_01");
assert.ok(kycActivity);
assert.ok(kycActivity.name.includes("KYC"));
console.log("  ✓ RoPA mapping relationships validated");

console.log("\nALL 5 SMOKE & REGULATORY TESTS PASSED SUCCESSFULLY! ✓\n");
