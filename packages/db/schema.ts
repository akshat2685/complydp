/**
 * complyDP — Core Relational Database Schema for PostgreSQL
 * Implements strict tenant isolation, UUID primary keys, and immutable audit trails.
 */

export interface TenantRow {
  id: string; // UUID
  name: string;
  jurisdiction: string;
  domain: string;
  dpoName: string;
  dpoEmail: string;
  regulatoryFramework: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRow {
  id: string; // UUID
  email: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "PRIVACY_MANAGER" | "ANALYST" | "VIEWER";
  createdAt: string;
}

export interface WebPropertyRow {
  id: string; // UUID
  tenantId: string;
  domain: string;
  status: "ACTIVE" | "SCANNING" | "PAUSED";
  consentBannerVersion: string;
  policyVersion: string;
  lastScannedAt?: string;
  createdAt: string;
}

export interface CookieCatalogRow {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  domain: string;
  category: "Necessary" | "Analytics" | "Functional" | "Advertising" | "Unknown";
  vendor: string;
  consentRequired: boolean;
  purpose: string;
  scriptSource: string;
  observedBeforeConsent: boolean;
  approvalState: "AI Suggested" | "Needs Review" | "Approved" | "Overridden";
  evidenceHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentEventRow {
  id: string;
  tenantId: string;
  propertyId: string;
  eventType: "consent_granted" | "consent_denied" | "consent_withdrawn" | "preference_changed";
  visitorRef: string; // Pseudonymous SHA-256 hash (Zero raw IP / identity stored)
  categories: string[];
  bannerVersion: string;
  policyVersion: string;
  ipHash: string;
  evidenceHash: string;
  timestamp: string;
}

export interface PrivacyRequestRow {
  id: string; // e.g. PR-2026-081
  tenantId: string;
  type: "Delete my data" | "Request a copy of my data" | "Correct my data" | "Third-party disclosure";
  requesterRef: string; // Masked identifier
  status: "Submitted" | "Verification" | "Assigned" | "In Progress" | "Waiting" | "Completed" | "Rejected";
  owner: string;
  submittedAt: string;
  slaDeadline: string;
  daysRemaining: number;
  verificationStatus: "Verified" | "Pending Document" | "Failed";
  notes: string;
  resolutionEvidenceHash?: string;
}

export interface IncidentRow {
  id: string; // e.g. INC-2026-004
  tenantId: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Detected" | "Triage" | "Assessing" | "Obligations Determined" | "Notifying" | "Remediated" | "Closed";
  detectedAt: string;
  leadInvestigator: string;
  affectedSystems: string[];
  affectedDataCategories: string[];
  affectedPopulation: number;
  evidenceHash: string;
  summary: string;
}

export interface IncidentObligationRow {
  id: string;
  incidentId: string;
  authority: "Data Protection Board of India (DPBI)" | "Affected Data Principals" | "CERT-In";
  requirement: string;
  deadlineIso: string;
  status: "Pending" | "In Preparation" | "Submitted" | "Waived";
  statutoryClockHours?: number; // 72 for DPBI under Rule 11
  hoursRemaining?: number;
  actionRequired: string;
}

export interface DiscoveryScanRow {
  id: string;
  tenantId: string;
  scannerType: "WEBSITE_CRAWLER" | "GITHUB_AST" | "DATABASE_PROFILER";
  target: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  findingsCount: number;
  evidenceHash: string;
  createdAt: string;
  completedAt?: string;
}

export interface DiscoveryFindingRow {
  id: string;
  tenantId: string;
  scanId: string;
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Needs Review" | "Investigating" | "Approved" | "Resolved" | "Dismissed";
  source: string;
  whyItMatters: string;
  suggestedAction: string;
  confidence: number;
  evidenceHash: string;
  createdAt: string;
}

export interface ProcessingActivityRow {
  id: string;
  tenantId: string;
  name: string;
  purpose: string;
  legalBasis: "Consent" | "Certain Legitimate Uses (DPDP S.7)" | "Legal Obligation";
  dataCategories: string[];
  systems: string[];
  vendors: string[];
  owner: string;
  retentionPeriod: string;
  evidenceCount: number;
  status: "Approved" | "Under Review";
}

export interface VendorRow {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  country: string;
  dpaStatus: "Signed & Current" | "Missing DPA" | "Under Review";
  crossBorderTransfer: "Compliant (Permitted Territory)" | "Restricted";
  riskRating: "Low" | "Medium" | "High";
}

export interface AuditEventRow {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  objectType: string;
  objectId: string;
  metadata: Record<string, unknown>;
  ipHash: string;
  timestamp: string;
}
