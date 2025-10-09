import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function init() {
  if (getApps().length) return getApps()[0];
  
  // Prefer service account JSON via env if provided; otherwise use applicationDefault().
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  // Fallback to individual env vars (existing setup)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  
  try {
    if (svc) {
      // Try service account JSON first (for Vercel)
      return initializeApp({ credential: cert(JSON.parse(svc)) });
    } else if (projectId && clientEmail && privateKey) {
      // Use individual env vars
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      // Fallback to applicationDefault
      return initializeApp({ credential: applicationDefault() });
    }
  } catch (e) {
    console.warn('Firebase Admin init fallback to applicationDefault:', e);
    return initializeApp({ credential: applicationDefault() });
  }
}

const app = init();
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);