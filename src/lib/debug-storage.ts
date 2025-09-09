import { getStorage } from "firebase/storage";

export function logStorageDebug() {
  try {
    const s = getStorage();
    // @ts-ignore private for debug
    const bucket = (s as any)?._bucket?.bucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (typeof window !== "undefined" && !(window as any).__BR_STORAGE_DEBUG__) {
      (window as any).__BR_STORAGE_DEBUG__ = true;
      console.info("[BR][Storage] Using bucket:", bucket);
    }
  } catch {}
}
