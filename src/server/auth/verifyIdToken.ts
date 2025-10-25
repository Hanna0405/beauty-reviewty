import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const { getFirebaseAdmin } = require("@/lib/firebase/admin");
    getFirebaseAdmin();
  } catch {
    admin.initializeApp();
  }
}

export async function verifyAuthHeader(authorization?: string) {
  if (!authorization) return null;
  const [type, token] = authorization.split(" ");
  if (type !== "Bearer" || !token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded; // { uid, email, ... }
  } catch {
    return null;
  }
}
