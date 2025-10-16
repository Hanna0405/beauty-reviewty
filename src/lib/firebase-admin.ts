// src/lib/firebase-admin.ts
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export function getAdminApp() {
  return getFirebaseAdmin().app;
}

export const adminAuth = () => getFirebaseAdmin().auth;
export const adminDb = () => getFirebaseAdmin().db;
