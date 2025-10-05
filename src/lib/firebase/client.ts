/* src/lib/firebase/client.ts */
'use client';

import { app } from '@/lib/firebase'; // your singleton firebase app init
import { getAuth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/** Return client-side Firebase Auth instance */
export function requireAuth() {
 return getAuth(app);
}

/** Return client-side Firestore DB instance */
export function requireDb(): Firestore {
 return getFirestore(app);
}

/** Return client-side Firebase Storage instance */
export function requireStorage() {
 return getStorage(app);
}

// Direct exports for compatibility
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export type { Firestore };