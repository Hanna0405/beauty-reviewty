import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
 admin.initializeApp({
 credential: privateKey
 ? admin.credential.cert({
 projectId: process.env.FIREBASE_PROJECT_ID,
 clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
 privateKey,
 })
 : admin.credential.applicationDefault(),
 storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
 });
}

// Firestore (Admin)
export const adminDb = admin.firestore();

// Storage Bucket (Admin)
export const adminBucket = () => admin.storage().bucket();

export default admin;