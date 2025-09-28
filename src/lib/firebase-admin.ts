// src/lib/firebase-admin.ts
import { getApps, initializeApp, cert, App as AdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb } from 'firebase-admin/firestore';

let adminApp: AdminApp;

export function getAdminApp(): AdminApp {
 if (!adminApp) {
 const projectId = process.env.FIREBASE_PROJECT_ID;
 const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
 // PRIVATE_KEY храним в кавычках в .env и тут приводим \n
 const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

 if (!projectId || !clientEmail || !privateKey) {
 throw new Error('Missing Admin SDK envs (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)');
 }

 adminApp = getApps().length
 ? getApps()[0]!
 : initializeApp({
 credential: cert({ projectId, clientEmail, privateKey }),
 });
 }
 return adminApp;
}

export const adminAuth = () => getAdminAuth(getAdminApp());
export const adminDb = () => getAdminDb(getAdminApp());