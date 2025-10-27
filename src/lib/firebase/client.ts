// src/lib/firebase/client.ts
// Purpose: safe client-side Firebase singleton for Next.js (browser only usage).
// This must NOT break other imports that expect db/auth/storage/firebaseApp.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// IMPORTANT: this config must already exist in the project.
// We assume it reads from the correct DEV env vars on localhost
// and proper prod/preview env vars in deployed environments.
// Do NOT modify config.client.ts in this patch.
import { getFirebaseConfig } from "./config";

// lazy-init firebase app
function initFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    // This client module is not meant for SSR environments.
    // In SSR we should be using server/admin SDK elsewhere.
    // But still return/getApp if it exists just in case.
    if (getApps().length === 0) {
      return initializeApp(getFirebaseConfig());
    }
    return getApp();
  }

  // browser path:
  if (getApps().length === 0) {
    const firebaseConfig = getFirebaseConfig();
    console.info(
      "[client/firebase] init app with bucket:",
      firebaseConfig.storageBucket
    );
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = initFirebaseApp();

// Create singletons so components can import { db, auth, storage }.
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

// Named exports (do not change names, other code may rely on them):
export const firebaseApp = app;
export { db, auth, storage, app };
