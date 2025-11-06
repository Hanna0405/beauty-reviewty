"use client";

import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const isServer = typeof window === "undefined";

// generic client-side upload
export async function uploadFile(
  file: File,
  path: string
): Promise<{ url: string }> {
  // 1) try firebase storage first (old behavior)
  const storage = !isServer ? getFirebaseStorage() : null;

  if (storage) {
    try {
      const storageRef = ref(storage, path);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      return { url };
    } catch (err: any) {
      // if unauthorized or any storage-specific error -> fall back
      if (
        err?.code === "storage/unauthorized" ||
        err?.code === "storage/invalid-argument" ||
        err?.code === "storage/quota-exceeded"
      ) {
        console.warn(
          "[uploadFile] Firebase Storage blocked upload, falling back to /api/upload",
          err?.code
        );
      } else {
        console.warn("[uploadFile] Firebase Storage failed, falling back", err);
      }
      // go to fallback below
    }
  }

  // 2) fallback: send to our API route which uses admin SDK
  const form = new FormData();
  form.append("file", file);
  // optional: send path so API can put it into /reviews/... folder
  form.append("path", path);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error("Fallback /api/upload failed");
  }

  const data = await res.json();
  // expect { url: "https://..." }
  return { url: data.url };
}

function safeFileName(file: File) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base = (file.name.replace(/\.[^/.]+$/, '') || 'photo')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 40);
  return `${base}_${Date.now()}.${ext}`;
}

/**
 * Upload selected files to reviews/{uid}/... and return public URLs.
 * uid must be provided by caller (do not use getAuth() here to avoid hydration/race issues in dev).
 */
export async function uploadFilesGetUrls(files: FileList, uid: string): Promise<string[]> {
  if (isServer) {
    // just return empty array, so SSR does not call storage.ref(...)
    return [];
  }

  if (!uid) throw new Error('No uid provided');
  
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    const path = `reviews/${uid}/${safeFileName(file)}`;
    const result = await uploadFile(file, path);
    urls.push(result.url);
  }
  return urls;
}
