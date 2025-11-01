// Re-export from firebase-admin for backwards compatibility
export { adminApp, adminAuth, adminDb, adminBucket } from '@/lib/firebase-admin';

// Legacy export for code that expects getAdminDb
import { getFirebaseAdmin } from '@/lib/firebase/admin';
export function getAdminDb() {
  return getFirebaseAdmin().db;
}
