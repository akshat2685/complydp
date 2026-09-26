export type Severity = "Critical" | "High" | "Medium" | "Low";

export type FindingType =
  | "NEW_VENDOR"
  | "NEW_TRACKER"
  | "UNKNOWN_COOKIE"
  | "UNMAPPED_DATA"
  | "CONSENT_GAP"
  | "PURPOSE_MISMATCH"
  | "PROCESSOR_DRIFT"
  | "NEW_DATA_CATEGORY"
  | "REQUEST_SLA_RISK"
  | "INCIDENT_OBLIGATION";

export type FindingStatus =
  | "Needs Review"
  | "Investigating"
  | "Approved"
  | "Resolved"
  | "Dismissed";

export interface EvidenceRecord {
  id: string;
  source: string;
  location: string;
  observedAt: string;
  confidence: number; // 0 to 100
  evidenceHash: string;
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
  rawPayload?: Record<string, unknown>;
}

export interface Finding {
  id: string;
  type: FindingType;
  title: string;
  severity: Severity;
  status: FindingStatus;
  source: string;
  whyItMatters: string;
  suggestedAction: string;
  detectedAt: string;
  reviewedBy?: string;
  evidence: EvidenceRecord;
  targetEntityId?: string;
  category: "Discovery" | "Consent" | "Request" | "Vendor" | "Evidence" | "Incident";
}

export type CookieCategory =
  | "Necessary"
  | "Analytics"
  | "Functional"
  | "Advertising"
  | "Unknown";

export type ApprovalState = "AI Suggested" | "Needs Review" | "Approved" | "Overridden";

export interface DiscoveredCookie {
  id: string;
  name: string;
  domain: string;
  category: CookieCategory;
  vendor: string;
  consentRequired: boolean;
  purpose: string;
  scriptSource: string;
  observedBeforeConsent: boolean;
  approvalState: ApprovalState;
  firstSeen: string;
  lastSeen: string;
  evidence: EvidenceRecord;
}

export interface WebProperty {
  id: string;
  domain: string;
  status: "Active" | "Scanning" | "Error";
  lastScanTime: string;
  activeTrackersCount: number;
  cookiesCount: number;
  consentBannerVersion: string;
  policyVersion: string;
  cookies: DiscoveredCookie[];
}

export type ConsentEventType =
  | "consent_granted"
  | "consent_denied"
  | "consent_withdrawn"
  | "preference_changed";

export interface ConsentEvent {
  id: string;
  timestamp: string;
  eventType: ConsentEventType;
  visitorRef: string; // Pseudonymous hash
  categories: CookieCategory[];
  bannerVersion: string;
  policyVersion: string;
  property: string;
  ipHash: string; // Pseudonymous hash
  evidenceHash: string;
}

export type RequestType =
  | "Delete my data"
  | "Request a copy of my data"
  | "Correct my data"
  | "Third-party/processor disclosure";

export type RequestStatus =
  | "Submitted"
  | "Verification"
  | "Assigned"
  | "In Progress"
  | "Waiting"
  | "Completed"
  | "Rejected";

export interface RequestTask {
  id: string;
  title: string;
  assignedTo: string;
  completed: boolean;
  completedAt?: string;
}

export interface PrivacyRequest {
  id: string;
  type: RequestType;
  requesterRef: string; // Masked identifier
  status: RequestStatus;
  owner: string;
  submittedAt: string;
  slaDeadline: string;
  daysRemaining: number;
  verificationStatus: "Verified" | "Pending Document" | "Failed";
  tasks: RequestTask[];
  notes: string;
  resolutionEvidenceHash?: string;
}

export type IncidentSeverity = "Critical" | "High" | "Medium" | "Low";
export type IncidentStatus =
  | "Detected"
  | "Triage"
  | "Assessing"
  | "Obligations Determined"
  | "Notifying"
  | "Remediated"
  | "Closed";

export interface IncidentObligation {
  id: string;
  authority: "Data Protection Board of India (DPBI)" | "Affected Data Principals" | "CERT-In";
  requirement: string;
  deadlineText: string;
  deadlineIso: string;
  status: "Pending" | "In Preparation" | "Submitted" | "Waived";
  statutoryClockHours?: number;
  hoursRemaining?: number;
  actionRequired: string;
}

export interface PrivacyIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: string;
  leadInvestigator: string;
  affectedSystems: string[];
  affectedDataCategories: string[];
  affectedPopulation: number;
  vendorInvolved?: string;
  obligations: IncidentObligation[];
  evidenceHash: string;
  summary: string;
  timeline: { time: string; event: string; actor: string }[];
}

export interface PersonalDataField {
  id: string;
  fieldName: string;
  category: string;
  sensitivity: "High" | "Medium" | "Normal";
  sourceRepo?: string;
  sourceFile?: string;
  sourceLine?: number;
  confidence: number;
  detectedAt: string;
  mappedActivityId?: string;
  status: "Mapped" | "Unmapped (AI Suggested)";
}

export interface ProcessingActivity {
  id: string;
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

export interface Vendor {
  id: string;
  name: string;
  category: "Analytics" | "Payment Processor" | "CRM / Support" | "Cloud Infrastructure";
  country: string;
  dpaStatus: "Signed & Current" | "Missing DPA" | "Under Review";
  crossBorderTransfer: "Compliant (Permitted Territory)" | "Restricted";
  observedScripts: string[];
  dataCategoriesProcessed: string[];
  lastAuditDate: string;
  riskRating: "Low" | "Medium" | "High";
}

export interface Tenant {
  id: string;
  name: string;
  jurisdiction: string;
  domain: string;
  dpoName: string;
  dpoEmail: string;
  regulatoryFramework: string;
}

export interface ComplyDPState {
  tenant: Tenant;
  webProperty: WebProperty;
  findings: Finding[];
  consentEvents: ConsentEvent[];
  requests: PrivacyRequest[];
  incidents: PrivacyIncident[];
  personalDataFields: PersonalDataField[];
  processingActivities: ProcessingActivity[];
  vendors: Vendor[];
  scanInProgress: boolean;
  scanProgress: number;
  gitHubScanInProgress: boolean;
  selectedFindingId: string | null;
  selectedRequestId: string | null;
  selectedIncidentId: string | null;
}

