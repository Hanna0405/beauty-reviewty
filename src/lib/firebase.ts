// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'ВСТАВЬ_СВОЙ',
  authDomain: 'ВСТАВЬ_СВОЙ',
  projectId: 'ВСТАВЬ_СВОЙ',
  storageBucket: 'ВСТАВЬ_СВОЙ',
  messagingSenderId: 'ВСТАВЬ_СВОЙ',
  appId: 'ВСТАВЬ_СВОЙ',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);