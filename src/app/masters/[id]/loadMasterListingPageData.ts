import { cache } from "react";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { serializeFirestoreDoc } from "@/lib/firestore/serializeForClient";
import { getMasterProfileId } from "@/lib/listings/getMasterProfileId";
import type { ListingLike } from "@/lib/listings/presenters";
import { loadListingReviews, type ListingReviewsData } from "./loadListingReviews";

export type MasterListingPageData = {
  listing: ListingLike | null;
  profile: Record<string, unknown> | null;
  reviews: ListingReviewsData;
};

const loadListing = cache(async (id: string): Promise<ListingLike | null> => {
  try {
    const db = getAdminDb();
    const snap = await db.collection("listings").doc(id).get();
    if (!snap.exists) return null;
    return serializeFirestoreDoc({
      id: snap.id,
      ...snap.data(),
    }) as ListingLike;
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
          return serializeFirestoreDoc({
            id: snap.id,
            ...snap.data(),
          }) as Record<string, unknown>;
        }
      }
      for (const collectionName of ["profiles", "masters"]) {
        const qs = await db
          .collection(collectionName)
          .where("uid", "==", uid)
          .limit(1)
          .get();
        if (!qs.empty) {
          const docSnap = qs.docs[0];
          return serializeFirestoreDoc({
            id: docSnap.id,
            ...docSnap.data(),
          }) as Record<string, unknown>;
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
  const profileUid = listing ? getMasterProfileId(listing) : null;
  const [profile, reviews] = await Promise.all([
    profileUid ? loadProfile(profileUid) : Promise.resolve(null),
    loadListingReviews(id),
  ]);
  return { listing, profile, reviews };
}
