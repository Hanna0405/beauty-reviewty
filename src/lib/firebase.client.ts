'use client';

import { getApps, initializeApp, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Нормализация ENV: убираем BOM/zero-width/CRLF и лишние символы
const clean = (v?: string) =>
 v?.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\u2060]/g, '').trim();
const keep = (v?: string) => {
 const s = clean(v);
 return s ? s.replace(/[^A-Za-z0-9_:.\\-]/g, '') : s;
};

const envCfg: FirebaseOptions = {
  apiKey: keep(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)!,
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)!,
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)!,
  storageBucket: clean(process.env.FIREBASE_STORAGE_BUCKET)!, // beauty-reviewty.firebasestorage.app
  messagingSenderId: keep(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)!,
  appId: keep(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)!,
  ...(clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
    ? { measurementId: keep(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) }
    : {}),
};

// Подсветим, если .env не полон
const missing = Object.entries(envCfg).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
 console.warn('[Firebase ENV] Missing/dirty:', missing.join(', '));
}

// === Хитрость для dev/HMR: именованный инстанс по apiKey ===
// Если ключ в .env меняется — создаётся новый app с другим именем.
// Это избавляет от «прилипшего» старого инстанса без top-level await/deleteApp.
const PREFIX = typeof envCfg.apiKey === 'string' ? envCfg.apiKey.slice(0, 6) : 'EMPTY';
const APP_NAME = `client-${PREFIX}`;

function getOrInitApp(): FirebaseApp {
 const existing = getApps().find(a => a.name === APP_NAME);
 return existing ?? initializeApp(envCfg, APP_NAME);
}

const app = getOrInitApp();

// Диагностика: видим, чем реально инициализировались
if (typeof window !== 'undefined') {
 const apiKey = (app.options as any)?.apiKey as string | undefined;
 console.log('[FirebaseApp] MODE: ENV (named app)');
 console.log('[FirebaseApp] name:', app.name);
 console.log('[FirebaseApp] apiKey starts with:', apiKey ? apiKey.slice(0, 6) : 'EMPTY');
 console.log('[FirebaseApp] projectId:', app.options.projectId);
 console.log('[FirebaseApp] storageBucket:', (app.options as any).storageBucket);
}

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
const db = getFirestore(app);
const storage = getStorage(app);

/**
* Шим для совместимости старого кода.
* Возвращает auth (Firebase Auth), а при opts.assert=true кидает ошибку если не залогинен.
*/
export function requireAuth(opts?: { assert?: boolean }) {
 if (opts?.assert && !auth.currentUser) {
 throw new Error('Not authenticated');
 }
 return auth;
}

export function requireDb() {
 return db;
}

export function requireStorage() {
 return storage;
}

// Google Auth Provider for compatibility
export const googleProvider = new GoogleAuthProvider();

// Storage helper for compatibility
export const getStorageSafe = () => storage;

export { app, auth, db, storage };