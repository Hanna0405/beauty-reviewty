import { doc, getDoc } from "firebase/firestore";
import { requireDb } from "@/lib/firebase";

/**
 * Checks if a master should be visible in public search based on their settings.
 * Uses Firestore client SDK only (for client-side usage).
 * Returns true if visibility is enabled or settings are missing (backward compatible).
 */
export async function shouldMasterBeVisibleInPublicSearch(
  masterUid: string
): Promise<boolean> {
  try {
    const firestoreDb = requireDb();
    if (!firestoreDb) return true; // Default to visible if DB not available

    const profileSnap = await getDoc(doc(firestoreDb, "profiles", masterUid));

    if (!profileSnap || !profileSnap.exists) {
      // Settings missing → default to visible (backward compatible)
      return true;
    }

    const profile = profileSnap.data() as any;

    // Check isPublicProfile setting
    // If explicitly false → not visible
    // If missing/undefined → visible (backward compatible)
    const isPublicProfile =
      profile?.isPublicProfile ??
      profile?.isVisibleAsMaster ??
      true;

    return isPublicProfile !== false;
  } catch (error) {
    console.error(
      "[masterVisibility] Error checking visibility for master:",
      error
    );
    // On error, default to visible to avoid breaking search
    return true;
  }
}

/**
 * Checks if a master allows booking requests based on their settings.
 * Uses Firestore client SDK only (for client-side usage).
 * Returns true if booking is allowed or settings are missing (backward compatible).
 */
export async function doesMasterAllowBookingRequests(
  masterUid: string
): Promise<boolean> {
  try {
    const firestoreDb = requireDb();
    if (!firestoreDb) return true; // Default to allowed if DB not available

    const profileSnap = await getDoc(doc(firestoreDb, "profiles", masterUid));

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
      "[masterVisibility] Error checking booking permission for master:",
      error
    );
    // On error, default to allowed to avoid breaking booking
    return true;
  }
}

