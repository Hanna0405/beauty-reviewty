import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const apps = getApps();

if (!apps.length) {
  // FIREBASE_ADMIN_KEY should be a JSON string with service account
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY as string)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = getApps()[0];
const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);

// expose everything that other files try to import
export const getAdminApp = () => adminApp;
export const getAdminDb = () => adminDb;
export const getAdminStorage = () => adminStorage;
export const adminBucket = () => adminStorage.bucket();

export { adminDb, adminStorage };
