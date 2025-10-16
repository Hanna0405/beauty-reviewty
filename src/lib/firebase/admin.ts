import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

type AdminBundle = {
  app: App;
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  bucketName: string; // resolved working bucket
};

let cached: AdminBundle | null = null;
let adminAppInstance: App | null = null;
let adminBucketInstance: ReturnType<ReturnType<typeof getStorage>['bucket']> | null = null;

function getEnv(name: string, fallback?: string): string | undefined {
  const val = process.env[name];
  return val ? val.trim() : fallback;
}

export function getFirebaseAdmin(): AdminBundle {
  if (cached) return cached;

  const isDev = process.env.NODE_ENV !== 'production';

  const projectId = getEnv(isDev ? 'FIREBASE_PROJECT_ID_DEV' : 'FIREBASE_PROJECT_ID');
  const clientEmail = getEnv(isDev ? 'FIREBASE_CLIENT_EMAIL_DEV' : 'FIREBASE_CLIENT_EMAIL');
  const rawKey = getEnv(isDev ? 'FIREBASE_PRIVATE_KEY_DEV' : 'FIREBASE_PRIVATE_KEY');

  // Resolve storage bucket: try NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV/PROD, then FIREBASE_STORAGE_BUCKET_DEV/PROD
  const storageBucketName = getEnv(
    isDev ? 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV' : 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'
  ) || getEnv(
    isDev ? 'FIREBASE_STORAGE_BUCKET_DEV' : 'FIREBASE_STORAGE_BUCKET'
  );

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(`Missing Firebase Admin env for ${isDev ? 'DEV' : 'PROD'} (projectId/clientEmail/privateKey)`);
  }

  if (!storageBucketName) {
    throw new Error(`Missing Firebase Admin storage bucket env for ${isDev ? 'DEV' : 'PROD'} (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_STORAGE_BUCKET)`);
  }

  const privateKey = rawKey.replace(/\\n/g, '\n');

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
        storageBucket: storageBucketName,
      });

  adminAppInstance = app;

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Initialize bucket once
  if (!adminBucketInstance) {
    adminBucketInstance = getStorage(app).bucket();
  }

  // Log once on init
  console.info(`[admin] project: ${projectId} | bucket: ${storageBucketName}`);

  cached = { app, auth, db, bucketName: storageBucketName };
  return cached;
}

export const adminAuth = getFirebaseAdmin().auth;
export const adminDb = getFirebaseAdmin().db;
export const adminApp = (() => {
  getFirebaseAdmin(); // ensure initialized
  return adminAppInstance!;
})();
export const adminBucket = (() => {
  getFirebaseAdmin(); // ensure initialized
  return adminBucketInstance!;
})();
