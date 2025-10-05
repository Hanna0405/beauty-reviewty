"use client";
import { auth } from "@/lib/firebase/client";

export async function getIdTokenOrThrow(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_SIGNED_IN");
  try {
    // First try w/o refresh
    return await user.getIdToken(false);
  } catch {
    // Retry once with force refresh (helps when token is expired)
    return await user.getIdToken(true);
  }
}
