/// src/lib/authClient.ts
"use client";

import { requireAuth, requireDb } from "@/lib/firebase/client";
import {
 signInWithEmailAndPassword,
 createUserWithEmailAndPassword,
 GoogleAuthProvider,
 signInWithPopup,
 updateProfile,
 type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function mapAuthError(e: any): string {
 const c = e?.code ?? "";
 switch (c) {
 case "auth/invalid-credential":
 case "auth/wrong-password":
 case "auth/user-not-found":
 return "Invalid email or password.";
 case "auth/email-already-in-use":
 return "This email is already registered.";
 case "auth/weak-password":
 return "Password is too weak. Use 6+ characters.";
 case "auth/popup-closed-by-user":
 case "auth/cancelled-popup-request":
 case "auth/popup-blocked":
 return "Google sign-in was closed or blocked. Please try again.";
 case "auth/operation-not-allowed":
 return "Provider is disabled in Firebase Console.";
 default:
 return e?.message || "Authentication failed. Please try again.";
 }
}
export const friendlyAuthError = (e: unknown) => new Error(mapAuthError(e));

async function ensureUserDoc(u: User, role: "client"|"master" = "client") {
 const ref = doc(requireDb(), "users", u.uid);
 await setDoc(ref, {
 uid: u.uid,
 email: u.email ?? null,
 displayName: u.displayName ?? null,
 photoURL: u.photoURL ?? null,
 role,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 }, { merge: true });
}

export async function signInEmail(email: string, password: string) {
 const { user } = await signInWithEmailAndPassword(requireAuth(), email, password);
 return user;
}

export async function signUpEmail(name: string, email: string, password: string, role: "client"|"master") {
 const { user } = await createUserWithEmailAndPassword(requireAuth(), email, password);
 if (name) await updateProfile(user, { displayName: name });
 await ensureUserDoc(user, role);
 return user;
}

export async function signInGoogle(role: "client"|"master" = "client") {
 const provider = new GoogleAuthProvider();
 try {
 const { user } = await signInWithPopup(requireAuth(), provider);
 await ensureUserDoc(user, role);
 return user;
 } catch (e: any) {
 // If popup blocked, surface mapped error
 throw friendlyAuthError(e);
 }
}