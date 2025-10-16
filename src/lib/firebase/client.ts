'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './config';

// prevent double init
const firebaseConfig = getFirebaseConfig();
const app = !getApps().length ? (() => {
  const initApp = initializeApp(firebaseConfig);
  console.info(`[client] storageBucket: ${firebaseConfig.storageBucket}`);
  return initApp;
})() : getApp();

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