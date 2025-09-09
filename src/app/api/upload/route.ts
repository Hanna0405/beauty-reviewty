import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const path = String(form.get("path") || "");
    if (!file || !path) return NextResponse.json({ error: "file and path required" }, { status: 400 });
    if ((file as any).size > 8 * 1024 * 1024) return NextResponse.json({ error: "File too large (>8MB)" }, { status: 413 });

    const buf = Buffer.from(await file.arrayBuffer());
    const bucket = getStorage().bucket();
    const token = randomUUID();
    const name = path.replace(/^\/+/, "");
    await bucket.file(name).save(buf, {
      contentType: file.type || "application/octet-stream",
      metadata: { contentType: file.type || "application/octet-stream", metadata: { firebaseStorageDownloadTokens: token } },
      resumable: false, public: false, validation: false,
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
    return NextResponse.json({ url, path: name });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "upload failed" }, { status: 500 });
  }
}