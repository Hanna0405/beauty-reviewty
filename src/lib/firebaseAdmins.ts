import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { Bucket } from "@google-cloud/storage";

let _app: App | null = null;
let _db: Firestore | null = null;
let _storage: Storage | null = null;
let _bucket: Bucket | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  // read project id from multiple possible env names
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID_DEV ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // read bucket from multiple possible env names
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET_DEV ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  // read service account creds from multiple possible env names
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FIREBASE_CLIENT_EMAIL_DEV;
  const privateKeyRaw =
    process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_DEV;
  const privateKey = privateKeyRaw
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : undefined;

  // optional fallback for bucket if only project id is present
  const fallbackBucket =
    !storageBucket && projectId ? `${projectId}.appspot.com` : undefined;

  _app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          ...(projectId && clientEmail && privateKey
            ? {
                credential: cert({
                  projectId,
                  clientEmail,
                  privateKey,
                }),
              }
            : {}),
          ...(storageBucket
            ? { storageBucket }
            : fallbackBucket
            ? { storageBucket: fallbackBucket }
            : {}),
        });

  if (!storageBucket) {
    console.warn(
      "[Firebase ENV] Missing/dirty: storageBucket. Resolved to:",
      fallbackBucket || "none"
    );
  }

  return _app;
}

export function getAdminDb(): Firestore {
  if (_db) return _db;
  const app = getAdminApp();
  _db = getFirestore(app);
  return _db;
}

export function getAdminStorage(): Storage {
  if (_storage) return _storage;
  const app = getAdminApp();
  _storage = getStorage(app);
  return _storage;
}

export function getAdminBucket(): Bucket {
  if (_bucket) return _bucket;
  const storage = getAdminStorage();
  const bucket = storage.bucket();

  if (!bucket.name) {
    throw new Error(
      "Firebase Storage bucket is not configured. Please set FIREBASE_STORAGE_BUCKET_DEV or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local"
    );
  }

  _bucket = bucket;
  return _bucket;
}

export { getAdminApp };

// IMPORTANT: eagerly initialize to avoid "No Firebase App '[DEFAULT]'" during Next.js build/prerender
getAdminApp();
