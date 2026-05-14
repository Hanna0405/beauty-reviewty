import { cache } from "react";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { masterId, type ListingLike } from "@/lib/listings/presenters";

export type MasterListingPageData = {
  listing: ListingLike | null;
  profile: Record<string, unknown> | null;
};

const loadListing = cache(async (id: string): Promise<ListingLike | null> => {
  try {
    const db = getAdminDb();
    const snap = await db.collection("listings").doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as ListingLike;
  } catch (error) {
    console.warn("[masters/[id]] Failed to load listing:", error);
    return null;
  }
});

const loadProfile = cache(
  async (uid: string): Promise<Record<string, unknown> | null> => {
    try {
      const db = getAdminDb();
      for (const collectionName of ["profiles", "masters"]) {
        const snap = await db.collection(collectionName).doc(uid).get();
        if (snap.exists) {
          return { id: snap.id, ...snap.data() };
        }
      }
      return null;
    } catch (error) {
      console.warn("[masters/[id]] Failed to load profile:", error);
      return null;
    }
  }
);

export async function loadMasterListingPageData(
  id: string
): Promise<MasterListingPageData> {
  const listing = await loadListing(id);
  const profileUid = listing ? masterId(listing) : null;
  const profile = profileUid ? await loadProfile(profileUid) : null;
  return { listing, profile };
}
