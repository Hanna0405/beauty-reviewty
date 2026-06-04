"use client";

import {
 signInWithEmailAndPassword,
 createUserWithEmailAndPassword,
 browserLocalPersistence,
 setPersistence,
 onAuthStateChanged,
 updateProfile,
 signOut,
 getIdToken,
 User,
} from "firebase/auth";
import { auth, googleProvider, requireAuth } from "./firebase.client";
import {
  signInWithGoogleCompatible,
  type GoogleSignInResult,
} from "./auth/googleSignIn";

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
 return signInWithGoogleCompatible(auth, googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
 await setPersistence(requireAuth(), browserLocalPersistence);
 const cred = await signInWithEmailAndPassword(requireAuth(), email, password);
 return cred.user;
}

export async function signUpWithEmail(
 email: string,
 password: string,
 displayName?: string
) {
 await setPersistence(requireAuth(), browserLocalPersistence);
 const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
 if (displayName) {
 try { await updateProfile(cred.user, { displayName }); } catch {}
 }
 return cred.user;
}

export async function signOutUser() {
 await signOut(requireAuth());
}

export function onAuthChange(cb: (user: User | null) => void) {
 return onAuthStateChanged(requireAuth(), cb);
}

export async function getIdTokenSafe(): Promise<string | null> {
 const user = requireAuth().currentUser;
 if (!user) return null;
 try { return await getIdToken(user, false); } catch { return null; }
}