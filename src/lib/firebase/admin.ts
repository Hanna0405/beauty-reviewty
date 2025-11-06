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

export function getFirebaseAdmin(): AdminBundle | null {
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

  // During build time (Next.js static analysis), gracefully handle missing env vars
  // This allows Next.js to statically analyze routes without failing
  const isBuildTime = typeof window === 'undefined' && 
    (process.env.NEXT_PHASE?.includes('build') || 
     process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.RUNTIME);
  
  if (!projectId || !clientEmail || !rawKey) {
    if (isBuildTime) {
      console.warn(`[Firebase Admin] Missing env vars during build (${isDev ? 'DEV' : 'PROD'}). Routes will need env vars at runtime.`);
      return null as any; // Return null during build, but type as AdminBundle to avoid breaking types
    }
    throw new Error(`Missing Firebase Admin env for ${isDev ? 'DEV' : 'PROD'} (projectId/clientEmail/privateKey)`);
  }

  if (!storageBucketName) {
    if (isBuildTime) {
      console.warn(`[Firebase Admin] Missing storage bucket env during build (${isDev ? 'DEV' : 'PROD'}). Routes will need env vars at runtime.`);
      return null as any;
    }
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

// Lazy initialization to avoid throwing during build time
export const adminAuth = () => {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error('Firebase Admin not initialized. Check environment variables.');
  return admin.auth;
};
export const adminDb = () => {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error('Firebase Admin not initialized. Check environment variables.');
  return admin.db;
};
export const adminApp = () => {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error('Firebase Admin not initialized. Check environment variables.');
  return admin.app;
};
export const adminBucket = () => {
  const admin = getFirebaseAdmin();
  if (!admin) throw new Error('Firebase Admin not initialized. Check environment variables.');
  if (!adminBucketInstance) {
    adminBucketInstance = getStorage(admin.app).bucket();
  }
  return adminBucketInstance;
};
