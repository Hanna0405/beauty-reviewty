// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA0CchaNagg0pG6jjdNnrxfYqUIFOq96Xw",         
  authDomain: "beauty-reviewty.firebaseapp.com",             
  projectId: "beauty-reviewty",                              
  storageBucket: "beauty-reviewty.appspot.com",      
  messagingSenderId: "506141876880",                         
  appId: "1:506141876880:web:22c2abffc42fa133eaee15",        
  measurementId: "G-MT2FM6ZXRF",                             
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

