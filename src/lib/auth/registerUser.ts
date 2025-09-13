"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { requireAuth, requireDb } from "@/lib/firebase";

export type Role = "client" | "master";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function mapFirebaseToHttp(e: any): HttpError {
  const code = e?.code || "";
  if (code === "auth/email-already-in-use") return new HttpError(409, "Email already in use");
  if (code === "auth/invalid-email") return new HttpError(400, "Invalid email");
  if (code === "auth/weak-password") return new HttpError(400, "Password should be at least 6 characters");
  if (code === "permission-denied") return new HttpError(403, "Missing or insufficient permissions");
  return new HttpError(500, e?.message || "Internal error");
}

export async function registerUser(opts: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}) {
  try {
    const { fullName, email, password, role } = opts;

    // 1) Create auth user
    const auth = requireAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;

    // 2) Set displayName
    await updateProfile(fbUser, { displayName: fullName });

    // 3) Create/merge Firestore profile with chosen role
    const db = requireDb();
    await setDoc(
      doc(db, "users", fbUser.uid),
      {
        uid: fbUser.uid,
        displayName: fullName,
        email,
        photoURL: fbUser.photoURL ?? null,
        role, // IMPORTANT
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return fbUser;
  } catch (e: any) {
    throw mapFirebaseToHttp(e);
  }
}
