import { NextResponse } from "next/server";
import { adminBucket } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { path } = await req.json();
    if (!path) {
      return NextResponse.json({ ok: false, error: "No path provided" }, { status: 400 });
    }

    const bucket = adminBucket();
    await bucket.file(path).delete({ ignoreNotFound: true });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
