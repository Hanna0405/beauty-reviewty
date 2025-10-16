"use client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";

/**
* Upload up to `max` image files to Firebase Storage and return https download URLs.
* Names are prefixed with the given `prefix` (e.g. "reviews/<uid>/").
*/
export async function uploadImagesAndGetUrls(files: File[], prefix: string, max = 3): Promise<string[]> {
  const out: string[] = [];
  if (!Array.isArray(files) || !files.length) return out;
  let i = 0;
  for (const file of files.slice(0, max)) {
    const safeName = file.name?.replace(/[^\w.-]+/g, "_") || `photo_${i}`;
    const path = `${prefix}${Date.now()}_${i++}_${safeName}`;
    const r = ref(storage, path);
    // Не навязываем contentType — чтобы не блокировать HEIC/Octet-stream правилами
    await uploadBytes(r, file);
    out.push(await getDownloadURL(r)); // <= PUBLIC https
  }
  return out;
}
