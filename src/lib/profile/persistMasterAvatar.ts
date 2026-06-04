"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireDb } from "@/lib/firebase";

export const MASTERS_DATA_STALE_KEY = "masters-data-stale";
export const MASTER_AVATAR_UPDATED_EVENT = "master-avatar-updated";

/**
 * Write avatar URL to profiles + masters so /masters and public pages see it immediately.
 */
export async function persistMasterAvatarAfterUpload(
  uid: string,
  avatarUrl: string
): Promise<void> {
  if (!uid?.trim() || !avatarUrl?.trim()) return;

  const db = requireDb();
  const patch = {
    avatarUrl,
    photoURL: avatarUrl,
    avatarUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    setDoc(doc(db, "profiles", uid), patch, { merge: true }),
    setDoc(doc(db, "masters", uid), patch, { merge: true }),
  ]);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(MASTERS_DATA_STALE_KEY, uid);
    } catch {
      // private mode / quota
    }
    window.dispatchEvent(
      new CustomEvent(MASTER_AVATAR_UPDATED_EVENT, { detail: { uid } })
    );
  }
}
