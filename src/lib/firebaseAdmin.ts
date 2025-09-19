import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function initAdmin() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env vars');
  }

  // Replace escaped newlines from env
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (admin.apps.length) {
    app = admin.app();
    return app;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return app;
}

export function getAdminFirestore() {
  return admin.firestore(initAdmin());
}

export function getAdminAuth() {
  return admin.auth(initAdmin());
}
