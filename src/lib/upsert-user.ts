"use client";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function upsertUser(uid: string, data: { email?: string | null; displayName?: string | null; phoneNumber?: string | null; }) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const payload = {
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    phoneNumber: data.phoneNumber ?? "",
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, { uid, createdAt: serverTimestamp(), ...payload });
  } else {
    await setDoc(ref, payload, { merge: true });
  }
}
