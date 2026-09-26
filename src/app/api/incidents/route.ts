import { NextResponse } from "next/server";
import { initialIncidents } from "@/lib/mock-data-extended";

export async function GET() {
  return NextResponse.json({
    success: true,
    total: initialIncidents.length,
    data: initialIncidents,
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { incidentId, obligationId, status, actor } = body;

    return NextResponse.json({
      success: true,
      message: `Obligation ${obligationId} on incident ${incidentId} updated to ${status}`,
      updatedAt: new Date().toISOString(),
      actor: actor || "Priya Sharma (DPO)",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
