import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// read from normal or *_DEV envs
const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID_DEV;
const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL_DEV;
const rawPrivateKey =
  process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_DEV;

const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

// bucket from env or derive from projectId
const bucketFromEnv =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET_DEV ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

let derivedBucket: string | undefined;
if (projectId?.includes('dev')) {
  derivedBucket = 'beautyreviewty-dev.firebasestorage.app';
} else if (projectId) {
  derivedBucket = 'beauty-reviewty.firebasestorage.app';
}

const storageBucket = bucketFromEnv || derivedBucket;

const hasServiceAccount = Boolean(projectId && clientEmail && privateKey);

if (!getApps().length) {
  if (hasServiceAccount) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  } else {
    // allow local build without admin creds
    initializeApp({});
    // eslint-disable-next-line no-console
    console.warn(
      '[firebaseAdmin] Initialized without service account envs. Add FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY or their *_DEV variants.',
    );
  }
}

// base admin instances
export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminStorage = getStorage();

// BACKWARD-COMPAT exports (many API routes import these names)
export const getAdminAuth = () => adminAuth;
export const getAdminDb = () => adminDb;
export const getAdminStorage = () => adminStorage;
export const getAdminBucket = () => adminStorage.bucket();