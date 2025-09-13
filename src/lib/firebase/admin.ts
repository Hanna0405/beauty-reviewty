import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function must(name: string, val?: string) {
 if (!val) throw new Error(`[ENV] ${name} is not set`);
 return val;
}

function resolveBucket(): string {
 const name = must('FIREBASE_STORAGE_BUCKET', process.env.FIREBASE_STORAGE_BUCKET);
 return name; // expected: beauty-reviewty.firebasestorage.app
}

let app: App | undefined;

export function getAdminApp(): App {
 if (getApps().length) return getApps()[0]!;
 app = initializeApp({
 credential: cert({
 projectId: must('FIREBASE_PROJECT_ID', process.env.FIREBASE_PROJECT_ID),
 clientEmail: must('FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL),
 privateKey: must('FIREBASE_PRIVATE_KEY', process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
 }),
 storageBucket: resolveBucket(),
 });
 console.log('[BR][Storage] Using bucket:', resolveBucket());
 return app;
}

export const adminDb = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());
export const adminBucket = () => getStorage(getAdminApp()).bucket(resolveBucket());