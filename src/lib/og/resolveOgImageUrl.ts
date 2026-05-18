import { getAdminBucket } from "@/lib/firebaseAdmins";

function readUrlCandidate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "object") {
    const obj = value as {
      url?: string;
      downloadURL?: string;
      src?: string;
      imageUrl?: string;
    };
    return readUrlCandidate(
      obj.url || obj.downloadURL || obj.src || obj.imageUrl || null
    );
  }
  return null;
}

function toStorageObjectPath(candidate: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("gs://")) {
    return trimmed.replace(/^gs:\/\/[^/]+\//, "");
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return null;
  }
  return trimmed.replace(/^\//, "");
}

export async function resolveOgImageUrl(
  value: unknown
): Promise<string | null> {
  const candidate = readUrlCandidate(value);
  if (!candidate) return null;

  if (
    candidate.startsWith("http://") ||
    candidate.startsWith("https://")
  ) {
    return candidate;
  }

  const objectPath = toStorageObjectPath(candidate);
  if (!objectPath) return null;

  try {
    const bucket = getAdminBucket();
    const file = bucket.file(objectPath);
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });
    return signedUrl || null;
  } catch (error) {
    console.warn("[og] Failed to resolve storage image:", objectPath, error);
    return null;
  }
}

export async function resolveOgImageUrlFromFields(
  ...values: unknown[]
): Promise<string | null> {
  for (const value of values) {
    const resolved = await resolveOgImageUrl(value);
    if (resolved) return resolved;
  }
  return null;
}
