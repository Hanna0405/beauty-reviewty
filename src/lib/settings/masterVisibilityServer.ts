/**
 * Server-only helper for checking master visibility and booking permissions.
 * This file uses firebase-admin and should NEVER be imported by client components.
 * Use src/lib/settings/masterVisibility.ts for client-side checks instead.
 */

import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * Server-side check: Does a master allow booking requests?
 * Returns true if booking is allowed or settings are missing (backward compatible).
 */
export async function doesMasterAllowBookingRequestsServer(
  masterUid: string
): Promise<boolean> {
  try {
    const db = getAdminDb();
    if (!db) return true; // Default to allowed if DB not available

    const profileSnap = await db.collection("profiles").doc(masterUid).get();

    if (!profileSnap || !profileSnap.exists) {
      // Settings missing → default to allowed (backward compatible)
      return true;
    }

    const profile = profileSnap.data() as any;

    // Check allowBookingRequests setting
    // If explicitly false → not allowed
    // If missing/undefined → allowed (backward compatible)
    const allowBookingRequests =
      profile?.allowBookingRequests ?? profile?.allowBookings ?? true;

    return allowBookingRequests !== false;
  } catch (error) {
    console.error(
      "[masterVisibilityServer] Error checking booking permission for master:",
      error
    );
    // On error, default to allowed to avoid breaking booking
    return true;
  }
}

