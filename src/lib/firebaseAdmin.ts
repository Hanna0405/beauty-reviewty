import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// normalize private key formatting (Windows, quotes, \n)
function normalizePk(raw?: string) {
  if (!raw) return "";
  const noQuotes = raw.replace(/^"([^]*)"$/, "$1");
  return noQuotes.replace(/\\n/g, "\n");
}

// We'll lazily init and cache
let _db: Firestore | null | undefined = undefined; // undefined = not tried yet

export function getAdminDb(): Firestore | null {
  if (_db !== undefined) {
    // already initialized (either Firestore or null)
    return _db || null;
  }

  // try to pull creds from env
  const PROJECT_ID =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "";
  const CLIENT_EMAIL =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL ||
    "";
  const PRIVATE_KEY = normalizePk(
    process.env.FIREBASE_PRIVATE_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY
  );

  // if creds are not there, mark as null and return null
  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    _db = null;
    return null;
  }

  let app: App;
  if (!getApps().length) {
    app = initializeApp({
      credential: cert({
        projectId: PROJECT_ID,
        clientEmail: CLIENT_EMAIL,
        privateKey: PRIVATE_KEY,
      }),
    });
  } else {
    app = getApps()[0]!;
  }

  _db = getFirestore(app);
  return _db;
}
