'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// prevent double init
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };

// Firestore / Auth / Storage singletons
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Safe helper for optional storage init
export function getStorageSafe() {
try {
return getStorage(app);
} catch (e) {
console.warn('getStorageSafe failed:', e);
return null;
}
}

// Helper functions that the codebase expects
export function requireDb() {
if (!db) {
throw new Error('Firestore not initialized');
}
return db;
}

export function requireAuth() {
if (!auth) {
throw new Error('Auth not initialized');
}
return auth;
}

export function requireStorage() {
if (!storage) {
throw new Error('Storage not initialized');
}
return storage;
}