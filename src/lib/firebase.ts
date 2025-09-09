/* eslint-disable import/no-extraneous-dependencies */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    // optional:
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
} else {
  app = getApps()[0]!;
}

// Canonical getters
export const getClientApp = (): FirebaseApp => app;
export const getClientAuth = (): Auth => getAuth(app); // <-- shim for legacy imports
export const getDb = (): Firestore => getFirestore(app);
export const getStorageSafe = (): FirebaseStorage => getStorage(app); // <-- shim for legacy imports

// Also export common singletons if some code imports them directly
export const auth = getClientAuth();
export const db = getDb();
export const storage = getStorageSafe();

// Export Google provider for auth
export const googleProvider = new GoogleAuthProvider();

// Export utility functions for compatibility
export const isFirebaseReady = () => true; // Firebase is always ready after initialization
export const makeRecaptcha = () => null; // Placeholder for compatibility
export const signInWithPhoneNumber = async (auth: any, phone: string, verifier: any) => {
  // Placeholder for compatibility - returns a mock confirmation result
  return {
    confirm: async (code: string) => ({ user: null })
  };
};