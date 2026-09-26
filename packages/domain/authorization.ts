/**
 * complyDP — Capability-based Role-Based Access Control (RBAC)
 * Centralizes authorization to prevent scattered role checks in UI/API.
 */

export type Role = "OWNER" | "ADMIN" | "PRIVACY_MANAGER" | "ANALYST" | "VIEWER";

export type Capability =
  | "properties.read"
  | "properties.write"
  | "findings.read"
  | "findings.review"
  | "requests.read"
  | "requests.manage"
  | "incidents.read"
  | "incidents.manage"
  | "incidents.notify"
  | "processing.read"
  | "processing.write"
  | "evidence.read"
  | "evidence.export"
  | "settings.manage";

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  OWNER: [
    "properties.read",
    "properties.write",
    "findings.read",
    "findings.review",
    "requests.read",
    "requests.manage",
    "incidents.read",
    "incidents.manage",
    "incidents.notify",
    "processing.read",
    "processing.write",
    "evidence.read",
    "evidence.export",
    "settings.manage",
  ],
  ADMIN: [
    "properties.read",
    "properties.write",
    "findings.read",
    "findings.review",
    "requests.read",
    "requests.manage",
    "incidents.read",
    "incidents.manage",
    "incidents.notify",
    "processing.read",
    "processing.write",
    "evidence.read",
    "evidence.export",
    "settings.manage",
  ],
  PRIVACY_MANAGER: [
    "properties.read",
    "properties.write",
    "findings.read",
    "findings.review",
    "requests.read",
    "requests.manage",
    "incidents.read",
    "incidents.manage",
    "incidents.notify",
    "processing.read",
    "processing.write",
    "evidence.read",
    "evidence.export",
  ],
  ANALYST: [
    "properties.read",
    "findings.read",
    "requests.read",
    "incidents.read",
    "processing.read",
    "evidence.read",
  ],
  VIEWER: [
    "properties.read",
    "findings.read",
    "requests.read",
    "incidents.read",
    "processing.read",
    "evidence.read",
  ],
};

export function hasCapability(role: Role, capability: Capability): boolean {
  const capabilities = ROLE_CAPABILITIES[role] || [];
  return capabilities.includes(capability);
}

export function assertCapability(role: Role, capability: Capability): void {
  if (!hasCapability(role, capability)) {
    throw new Error(`Unauthorized: Role '${role}' lacks capability '${capability}'`);
  }
}
