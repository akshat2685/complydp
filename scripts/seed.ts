import { initialTenant, initialWebProperty, initialFindings } from "../src/lib/mock-data";
import {
  initialConsentEvents,
  initialRequests,
  initialIncidents,
  initialPersonalDataFields,
  initialProcessingActivities,
  initialVendors,
} from "../src/lib/mock-data-extended";

console.log("=== COMPLYDP DATABASE SEED SCRIPT ===");
console.log("Target Environment: Local Development (PostgreSQL & Redis)");

console.log("\n[1/7] Seeding Tenant & DPO Identity...");
console.log(`  ✓ Tenant: ${initialTenant.name} (${initialTenant.domain})`);
console.log(`  ✓ DPO: ${initialTenant.dpoName} <${initialTenant.dpoEmail}>`);
console.log(`  ✓ Regulatory Framework: ${initialTenant.regulatoryFramework}`);

console.log("\n[2/7] Seeding Web Properties & Cookie Catalog...");
console.log(`  ✓ Web Property: ${initialWebProperty.domain} (${initialWebProperty.cookies.length} cookies cataloged)`);

console.log("\n[3/7] Seeding Operational Findings Attention Queue...");
console.log(`  ✓ ${initialFindings.length} findings seeded across Discovery, Consent, SLA, Incidents, Vendors`);

console.log("\n[4/7] Seeding Auditable Consent Event Ledger...");
console.log(`  ✓ ${initialConsentEvents.length} cryptographically hashed pseudonymous consent records seeded`);

console.log("\n[5/7] Seeding Data Principal Rights Cases...");
console.log(`  ✓ ${initialRequests.length} rights requests seeded with DPDP statutory SLA countdowns`);

console.log("\n[6/7] Seeding Privacy Incidents & DPBI Clocks...");
console.log(`  ✓ ${initialIncidents.length} incident seeded with 72h DPBI reporting countdown & Data Principal notice`);

console.log("\n[7/7] Seeding RoPA Processing Activities & Vendors...");
console.log(`  ✓ ${initialProcessingActivities.length} processing activities & ${initialVendors.length} vendors mapped`);

console.log("\n🎉 SEED COMPLETE: complyDP database is primed with AsterPay Technologies Pvt. Ltd. operational data.\n");
