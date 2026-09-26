import { NextResponse } from "next/server";
import { initialProcessingActivities } from "@/lib/mock-data-extended";

export async function GET() {
  return NextResponse.json({
    success: true,
    total: initialProcessingActivities.length,
    data: initialProcessingActivities,
  });
}
