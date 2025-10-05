"use client";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { GoogleAuthProvider } from "firebase/auth";
const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
 const cred = await createUserWithEmailAndPassword(auth, email, password);
 if (displayName) await updateProfile(cred.user, { displayName });
 await setDoc(doc(db, "users", cred.user.uid), {
 uid: cred.user.uid,
 email: cred.user.email ?? email,
 displayName: cred.user.displayName ?? displayName ?? "",
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 }, { merge: true });
 return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
 const auth = requireAuth();
 const cred = await signInWithEmailAndPassword(auth, email, password);
 await ensureUserDoc(cred.user.uid, cred.user.email ?? email, cred.user.displayName ?? "");
 return cred.user;
}

export async function signInWithGoogle() {
 if (!googleProvider) throw new Error("Google provider not available");
 const cred = await signInWithPopup(auth, googleProvider);
 await ensureUserDoc(cred.user.uid, cred.user.email ?? "", cred.user.displayName ?? "");
 return cred.user;
}

async function ensureUserDoc(uid: string, email: string, displayName: string) {
 // db is already imported from firebase.client
 const ref = doc(db, "users", uid);
 const snap = await getDoc(ref);
 if (!snap.exists()) {
 await setDoc(ref, { uid, email, displayName, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
 } else {
 await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
 }
}
