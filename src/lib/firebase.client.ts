// src/lib/firebase.client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// derive bucket for our two projects (dev and prod) with the new domain
let derivedBucket: string | undefined;
if (projectId?.includes('dev')) {
  derivedBucket = 'beautyreviewty-dev.firebasestorage.app';
} else if (projectId) {
  derivedBucket = 'beauty-reviewty.firebasestorage.app';
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    derivedBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// this must return Auth (what other files expect)
const requireAuth = () => {
  return auth;
};

// optional helper when we really need current user
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

export { app, auth, db, storage, googleProvider, requireAuth, getCurrentUser };

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[FirebaseApp]', {
    projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      derivedBucket,
  });
}