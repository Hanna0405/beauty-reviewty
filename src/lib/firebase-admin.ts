import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getStorage as adminGetStorage } from "firebase-admin/storage";

// Single source of truth for Firebase Admin initialization.
// Reads server-only env vars from .env.local (no NEXT_PUBLIC_ here).
let app: App | undefined;

function initAdminOnce() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY!;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET!;

    if (!projectId || !clientEmail || !privateKeyRaw || !storageBucket) {
      throw new Error("[AdminInit] Missing Firebase Admin env vars");
    }

    // Convert \n to real newlines if key is stored as a single line
    const privateKey = privateKeyRaw.includes("\\n")
      ? privateKeyRaw.replace(/\\n/g, "\n")
      : privateKeyRaw;

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  }
  return app!;
}

export function getStorage() {
  initAdminOnce();
  return adminGetStorage();
}