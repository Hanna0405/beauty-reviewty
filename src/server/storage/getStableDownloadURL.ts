import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Reuse our existing admin init if present
if (!admin.apps.length) {
  try {
    const { initAdmin } = require("@/server/firebaseAdmin");
    initAdmin?.();
  } catch {
    admin.initializeApp();
  }
}

export async function getStableDownloadURLByFullPath(
  fullPath: string
): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(fullPath);

  const [meta] = await file.getMetadata();
  let token = meta?.metadata?.firebaseStorageDownloadTokens;
  if (!token) {
    token = uuidv4();
    await file.setMetadata({
      metadata: { firebaseStorageDownloadTokens: token },
    });
  }

  return `https://firebasestorage.googleapis.com/v0/b/${
    bucket.name
  }/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
}

/** Accepts either {downloadURL?, url?, fullPath?} and returns a normalized photo */
export async function ensureStablePhoto<
  T extends { downloadURL?: string; url?: string; fullPath?: string }
>(p: T): Promise<T & { downloadURL?: string }> {
  // If we already have a token-based downloadURL – keep it
  if (
    p?.downloadURL &&
    !/X-Goog-Expires=|X-Goog-Signature=/.test(p.downloadURL)
  )
    return p;

  // If legacy 'url' is expiring or missing – try to rebuild from fullPath
  const need =
    !p?.downloadURL ||
    /X-Goog-Expires=|X-Goog-Signature=/.test(p.downloadURL) ||
    /X-Goog-Expires=|X-Goog-Signature=/.test(p?.url ?? "");

  if (need && p?.fullPath) {
    const stable = await getStableDownloadURLByFullPath(p.fullPath);
    return { ...p, downloadURL: stable };
  }
  return p;
}
