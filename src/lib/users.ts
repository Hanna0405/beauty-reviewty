import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function ensureUserDoc(
 user: { uid: string; displayName?: string | null; email?: string | null },
 role?: "client" | "master"
) {
 await setDoc(
 doc(db, "users", user.uid),
 {
 uid: user.uid,
 displayName: user.displayName ?? "",
 email: user.email ?? "",
 role: role ?? "client",
 updatedAt: serverTimestamp(),
 createdAt: serverTimestamp(),
 },
 { merge: true }
 );
}
