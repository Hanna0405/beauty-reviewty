import { getAuth, signInAnonymously } from "firebase/auth";
import { app } from "@/lib/firebase";

/**
 * Ensures that Firebase Auth has an active user session.
 * If no user is signed in, performs anonymous authentication.
 * Safe for both SSR and CSR.
 */
export async function ensureAuth() {
  const auth = getAuth(app);
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}
