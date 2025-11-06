// src/lib/firebase-admin.ts
import { getFirebaseAdmin, adminAuth as _adminAuth, adminDb as _adminDb, adminApp as _adminApp } from '@/lib/firebase/admin';

export function getAdminApp() {
  return _adminApp();
}

export const adminAuth = _adminAuth;
export const adminDb = _adminDb;
