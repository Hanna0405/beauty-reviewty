import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const isServer = typeof window === "undefined";

// read config from all possible env vars you use
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY_DEV,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_DEV,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_DEV,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_DEV,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID_DEV,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_DEV,
};

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;

/**
 * Internal safe getter: may return null on the server.
 */
function getFirebaseAppSafe(): FirebaseApp | null {
  if (isServer) {
    return null;
  }
  if (_app) return _app;
  const apps = getApps();
  _app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return _app;
}

/**
 * Public getters below: ALWAYS return typed value for TypeScript,
 * but on the server they return a dummy cast so that TS does not complain.
 * This keeps build/prerender from crashing on types.
 */

export function getFirebaseApp(): FirebaseApp {
  const app = getFirebaseAppSafe();
  if (!app) {
    // return dummy cast on server
    return {} as FirebaseApp;
  }
  return app;
}

export function getFirebaseDb(): Firestore {
  if (_db) return _db;
  const app = getFirebaseAppSafe();
  if (!app) {
    // server-side / build: return dummy cast to satisfy TS
    return {} as Firestore;
  }
  _db = getFirestore(app);
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  const app = getFirebaseAppSafe();
  if (!app) {
    return {} as FirebaseStorage;
  }
  _storage = getStorage(app);
  return _storage;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  const app = getFirebaseAppSafe();
  if (!app) {
    return {} as Auth;
  }
  _auth = getAuth(app);
  return _auth;
}

// Keep existing exports for backward compatibility
export const app = getFirebaseApp();
export const db = getFirebaseDb();
export const auth = getFirebaseAuth();
export const storage = getFirebaseStorage();
export const firebaseApp = app;

// Helper functions for compatibility
export function requireAuth() {
  return getFirebaseAuth();
}

export function requireDb() {
  return getFirebaseDb();
}

export function requireStorage() {
  return getFirebaseStorage();
}
