// Safe optional Firebase Admin bootstrap
import { getApps as getAdminApps, getApp as getAdminApp, initializeApp as initAdminApp, cert, App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';

let cachedAdminDb: AdminFirestore | null | undefined;

function initSafeAdmin(): AdminFirestore | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[admin] Missing envs — Admin SDK disabled');
    }
    return null;
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const app: AdminApp =
    getAdminApps().length ? getAdminApp() :
    initAdminApp({ credential: cert({ projectId, clientEmail, privateKey }) });

  return getAdminFirestore(app);
}

export function getAdminDb(): AdminFirestore | null {
  if (cachedAdminDb === undefined) cachedAdminDb = initSafeAdmin();
  return cachedAdminDb ?? null;
}