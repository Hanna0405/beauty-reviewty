import { NextResponse } from "next/server";
import { adminBucket } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const bucket = adminBucket(); // this is a real bucket instance
    const [exists] = await bucket.exists();

    return NextResponse.json({
      ok: true,
      bucketExists: exists,
      bucketName: bucket.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to check bucket",
      },
      { status: 500 }
    );
  }
}
