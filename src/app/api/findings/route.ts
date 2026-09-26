import { NextResponse } from "next/server";
import { initialFindings } from "@/lib/mock-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let result = [...initialFindings];

  if (status) {
    result = result.filter((f) => f.status === status);
  }
  if (category) {
    result = result.filter((f) => f.category === category);
  }

  return NextResponse.json({
    success: true,
    total: result.length,
    data: result,
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, reviewerNote, reviewer } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing id or status" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Finding ${id} updated to ${status}`,
      updatedAt: new Date().toISOString(),
      reviewer: reviewer || "Priya Sharma (DPO)",
      reviewerNote: reviewerNote || "Approved and applied to operations",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
