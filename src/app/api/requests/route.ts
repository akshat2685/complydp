import { NextResponse } from "next/server";
import { initialRequests } from "@/lib/mock-data-extended";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let requests = [...initialRequests];
  if (status) {
    requests = requests.filter((r) => r.status === status);
  }

  return NextResponse.json({
    success: true,
    total: requests.length,
    data: requests,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, requesterRef } = body;

    if (!type || !requesterRef) {
      return NextResponse.json(
        { success: false, error: "type and requesterRef are required" },
        { status: 400 }
      );
    }

    const newRequest = {
      id: `PR-2026-${Math.floor(100 + Math.random() * 900)}`,
      type,
      requesterRef,
      status: "Submitted",
      owner: "Priya Sharma (DPO)",
      submittedAt: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      daysRemaining: 10,
      verificationStatus: "Verified",
      tasks: [
        {
          id: `tsk_${Date.now()}`,
          title: "Verify identity via mobile OTP",
          assignedTo: "Identity Gateway",
          completed: true,
        },
      ],
      notes: "Newly received Data Principal rights request.",
    };

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
