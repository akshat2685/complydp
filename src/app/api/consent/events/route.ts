import { NextResponse } from "next/server";
import { initialConsentEvents } from "@/lib/mock-data-extended";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventType = searchParams.get("eventType");

  let events = [...initialConsentEvents];
  if (eventType) {
    events = events.filter((e) => e.eventType === eventType);
  }

  return NextResponse.json({
    success: true,
    total: events.length,
    data: events,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType, visitorRef, categories, property, bannerVersion } = body;

    if (!eventType || !visitorRef) {
      return NextResponse.json(
        { success: false, error: "eventType and visitorRef are required" },
        { status: 400 }
      );
    }

    const newEvent = {
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType,
      visitorRef,
      categories: categories || ["Necessary"],
      bannerVersion: bannerVersion || "v2.1 (DPDP-Notice-2026.04)",
      policyVersion: "v3.4.1",
      property: property || "asterpay.in",
      ipHash: `hash_ip_${Date.now()}`,
      evidenceHash: `hash_ev_${Date.now()}_sha256`,
    };

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
