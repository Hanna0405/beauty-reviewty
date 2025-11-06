import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { getFirebaseAdmin, adminBucket } from "@/lib/firebase/admin";

function err(message: string, status = 400) {
  if (process.env.DEBUG_FIREBASE_ADMIN === "1")
    console.error("[upload-public] error:", message);
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  let objectPath = "";
  let bucket: any = null;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const scope =
      (form.get("scope") as string | null)?.toLowerCase() || "listing";
    const id = (form.get("id") as string | null) || "";
    const dir = (form.get("dir") as string | null) || "";

    if (!file) return err("No file");

    // Check for bucket configuration before proceeding
    bucket = adminBucket();
    if (!bucket?.name) {
      return NextResponse.json(
        {
          error: "STORAGE_NOT_CONFIGURED",
          message:
            "Firebase Storage bucket is not configured. Enable Storage in Firebase Console for this project and set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.",
        },
        { status: 500 }
      );
    }

    console.log(`[upload-public] using bucket: ${bucket.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";

    // sanitize name and build allowed path
    const cleanName = (file.name || `file-${Date.now()}`).replace(
      /[^\w.\-]+/g,
      "_"
    );
    let base: string;
    if (scope === "profile") {
      base = `profiles/anonymous`;
    } else if (dir === "reviews") {
      // For review photos, use a dedicated path structure for anonymous users
      base = `reviews/anonymous/${Date.now()}`;
    } else {
      base = id ? `listings/anonymous/${id}` : `listings/anonymous`;
    }
    objectPath = `${base}/${cleanName}`;

    const fileRef = bucket.file(objectPath);
    await fileRef.save(buffer, { contentType, resumable: false });

    // For review photos, make them publicly accessible and return permanent URLs
    if (dir === "reviews") {
      // Make the file publicly accessible
      await fileRef.makePublic();

      // Get the public download URL
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;

      return NextResponse.json({
        ok: true,
        bucket: bucket.name,
        path: objectPath,
        url: downloadURL,
        contentType,
        files: [{ url: downloadURL, path: objectPath }],
      });
    }

    // For other files, use signed URLs
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      ok: true,
      bucket: bucket.name,
      path: objectPath,
      url: signedUrl,
      contentType,
      files: [{ url: signedUrl, path: objectPath }],
    });
  } catch (err: any) {
    console.error("[upload-public error]", err);
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || String(err),
        stack: err?.stack,
        bucket: bucket?.name,
        path: objectPath || undefined,
      },
      { status: 500 }
    );
  }
}
