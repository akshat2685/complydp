import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "0.1.0",
    service: "complydp-control-plane",
    framework: "Digital Personal Data Protection Act, 2023 (DPDP Rules 2026)",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sensors: {
      websiteScanner: "active",
      gitHubScanner: "active",
      consentLedger: "healthy",
      evidenceCryptographicEngine: "verified",
    },
  });
}
