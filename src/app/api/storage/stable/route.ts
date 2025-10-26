import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Re-use existing admin init
if (!admin.apps.length) {
  // import your existing init if you have one; otherwise minimal init via env vars
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initAdmin } = require("../../../../server/firebaseAdmin");
    initAdmin?.();
  } catch {
    admin.initializeApp();
  }
}

function decodeFromUrlOrPath(bucketName: string, input: string) {
  // Accept either:
  // - full signed URL like https://storage.googleapis.com/<bucket>/<path>?X-Goog-...
  // - GCS v0 URL like https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?...
  // - raw storage fullPath like listings/abc/1.jpg
  try {
    if (!input.includes("http")) return input; // already a fullPath
    const u = new URL(input);

    // storage.googleapis.com/<bucket>/<path...>
    if (u.hostname === "storage.googleapis.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      // [bucket, ...path]
      if (parts[0] === bucketName) {
        return decodeURIComponent(parts.slice(1).join("/"));
      }
    }

    // firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>
    if (u.hostname === "firebasestorage.googleapis.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      // [v0, b, <bucket>, o, <encodedPath>]
      const idx = parts.findIndex((p) => p === "b");
      const b = parts[idx + 1];
      const oIdx = parts.findIndex((p) => p === "o");
      const enc = parts[oIdx + 1];
      if (b === bucketName && enc) return decodeURIComponent(enc);
    }
  } catch {
    // fallthrough
  }
  return input;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  const fullPathRaw = searchParams.get("path") || "";
  const bucket = admin.storage().bucket(); // default bucket from env
  const bucketName = bucket.name;

  const fullPath = decodeFromUrlOrPath(bucketName, url || fullPathRaw);
  if (!fullPath) {
    return NextResponse.json({ error: "Missing url or path" }, { status: 400 });
  }

  const file = bucket.file(fullPath);

  // Ensure token exists
  const [meta] = await file.getMetadata().catch(() => [null]);
  if (!meta)
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  let token = meta.metadata?.firebaseStorageDownloadTokens;
  if (!token) {
    token = uuidv4();
    await file.setMetadata({
      metadata: { firebaseStorageDownloadTokens: token },
    });
  }

  const downloadURL =
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/` +
    `${encodeURIComponent(file.name)}?alt=media&token=${token}`;

  // Allow caching on the edge and by the browser
  const res = NextResponse.json({ url: downloadURL });
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return res;
}
