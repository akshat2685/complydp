import { NextResponse } from "next/server";
import { initialWebProperty } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [initialWebProperty],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.domain) {
      return NextResponse.json(
        { success: false, error: "Domain is required" },
        { status: 400 }
      );
    }

    const newProperty = {
      id: `prop_${Date.now()}`,
      domain: body.domain,
      status: "Active",
      lastScanTime: new Date().toISOString(),
      activeTrackersCount: 0,
      cookiesCount: 0,
      consentBannerVersion: "v2.1 (DPDP-Notice-2026.04)",
      policyVersion: "v1.0.0",
      cookies: [],
    };

    return NextResponse.json({ success: true, data: newProperty }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
