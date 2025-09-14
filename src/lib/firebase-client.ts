'use client';

import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
 authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
 storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
 messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
 appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Singleton app (never null)
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Singleton, non-null Auth for CLIENT components
const _auth: Auth = getAuth(app);
setPersistence(_auth, browserLocalPersistence).catch(() => { /* ignore during prerender */ });

export const auth: Auth = _auth;
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// IMPORTANT: Do NOT export anything as Auth | null. This file is client-only via 'use client'.