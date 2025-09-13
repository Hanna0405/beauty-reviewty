import { doc, getDoc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types/user";

export async function getOrInitUser(uid: string, fallbackAuthData?: {displayName: string|null, email: string|null, photoURL: string|null}): Promise<AppUser> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Create a brand-new user with default role "client"
    const newUser: AppUser = {
      uid,
      displayName: fallbackAuthData?.displayName ?? null,
      email: fallbackAuthData?.email ?? null,
      photoURL: fallbackAuthData?.photoURL ?? null,
      role: "client",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, newUser, { merge: true });
    return newUser;
  }

  const data = snap.data() as Partial<AppUser>;
  let role = (data.role as AppUser["role"]) ?? "client";

  // Persist default if role was missing
  if (!data.role) {
    await updateDoc(ref, { role, updatedAt: serverTimestamp() });
  }

  return {
    uid,
    displayName: (data.displayName as string) ?? fallbackAuthData?.displayName ?? null,
    email: (data.email as string) ?? fallbackAuthData?.email ?? null,
    photoURL: (data.photoURL as string) ?? fallbackAuthData?.photoURL ?? null,
    role,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
