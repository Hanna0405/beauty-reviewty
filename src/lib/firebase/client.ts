import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isBrowser) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// Safe exports: null on server
export { app as firebaseApp, auth, db, storage };

// Helpers: throw only when someone tries to use them in server environment
export function requireAuth(): Auth {
  if (!auth) throw new Error("Auth is not available on the server. Use only in client components.");
  return auth;
}

export function requireDb(): Firestore {
  if (!db) throw new Error("Firestore is not available on the server. Use only in client components.");
  return db;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) throw new Error("Storage is not available on the server. Use only in client components.");
  return storage;
}

// Legacy compatibility exports for direct imports from client module
export const clientAuth = () => requireAuth();
export const clientDb = () => requireDb();
export const clientStorage = () => requireStorage();
export const getClientApp = () => {
  if (!app) throw new Error("Firebase app is not available on the server. Use only in client components.");
  return app;
};