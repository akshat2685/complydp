import type {
  Tenant,
  WebProperty,
  Finding,
  ConsentEvent,
  PrivacyRequest,
  PrivacyIncident,
  PersonalDataField,
  ProcessingActivity,
  Vendor,
  ComplyDPState,
} from "../types";
import { initialTenant, initialWebProperty, initialFindings } from "./mock-data";
import {
  initialConsentEvents,
  initialRequests,
  initialIncidents,
  initialPersonalDataFields,
  initialProcessingActivities,
  initialVendors,
} from "./mock-data-extended";

export type { ComplyDPState };

export function getInitialState(): ComplyDPState {
  return {
    tenant: { ...initialTenant },
    webProperty: { ...initialWebProperty },
    findings: [...initialFindings],
    consentEvents: [...initialConsentEvents],
    requests: [...initialRequests],
    incidents: [...initialIncidents],
    personalDataFields: [...initialPersonalDataFields],
    processingActivities: [...initialProcessingActivities],
    vendors: [...initialVendors],
    scanInProgress: false,
    scanProgress: 0,
    gitHubScanInProgress: false,
    selectedFindingId: null,
    selectedRequestId: null,
    selectedIncidentId: null,
  };
}

// Utility to generate deterministic hex proof hashes
export function generateEvidenceHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `${hex}a9b8c7d6e5f41234567890abcdef1234567890abcdef1234567890abcdef`;
}
