import { NextResponse } from "next/server";
import { deleteListingById } from "@/lib/listings/deleteListing";

// Next.js 15: params is now a Promise and must be awaited
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteListingById(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("POST /api/listings/[id]/delete failed:", err);
    const msg = err?.message || "Internal error";
    const status = msg.includes("auth") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
