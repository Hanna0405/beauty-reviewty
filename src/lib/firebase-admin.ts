import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function getPrivateKey() {
  // Vercel stores multiline secrets with '\n' escaped
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  return raw.replace(/\\n/g, '\n');
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ? cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: getPrivateKey(),
          })
        : applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // optional
    });

export const adminApp = app;
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);