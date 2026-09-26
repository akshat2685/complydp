import { NextResponse } from "next/server";
import { initialVendors } from "@/lib/mock-data-extended";

export async function GET() {
  return NextResponse.json({
    success: true,
    total: initialVendors.length,
    data: initialVendors,
  });
}
