import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

declare global { var __adminApp: App | undefined; }

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET!; // e.g. beauty-reviewty.firebasestorage.app

const app =
  global.__adminApp ??
  (getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: BUCKET_NAME,
  }));

if (!global.__adminApp) global.__adminApp = app;

export const adminDb = getFirestore(app);
export const adminBucket = () => getStorage(app).bucket(BUCKET_NAME);
export const ADMIN_BUCKET = BUCKET_NAME;