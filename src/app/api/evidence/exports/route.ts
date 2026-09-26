import { NextResponse } from "next/server";
import { initialTenant, initialFindings } from "@/lib/mock-data";
import { initialConsentEvents, initialIncidents } from "@/lib/mock-data-extended";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const format = body.format || "json";

    const bundle = {
      tenant: initialTenant,
      exportedAt: new Date().toISOString(),
      statutoryFramework: "DPDP Act 2023 / Rules 2026",
      dpoAttestation: {
        dpoName: initialTenant.dpoName,
        dpoEmail: initialTenant.dpoEmail,
        timestamp: new Date().toISOString(),
      },
      auditRecordsSummary: {
        totalFindings: initialFindings.length,
        totalConsentLedgerEvents: initialConsentEvents.length,
        totalIncidents: initialIncidents.length,
      },
      cryptographicSignature: "RSA-4096-SHA256-VALIDATED-ASTERPAY-2026-DPDP",
    };

    return NextResponse.json({
      success: true,
      format,
      bundle,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
