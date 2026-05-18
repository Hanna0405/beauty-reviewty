import { cache } from "react";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { serializeFirestoreDoc } from "@/lib/firestore/serializeForClient";
import {
  isApprovedMasterReviewForProfile,
  isApprovedReviewStatus,
} from "@/lib/reviews/masterReviewFilters";
import type {
  ListingReview,
  ListingReviewsData,
} from "@/app/masters/[id]/loadListingReviews";

function dedupeReviews(reviews: ListingReview[]): ListingReview[] {
  const unique: ListingReview[] = [];
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();

  for (const review of reviews) {
    const reviewId = review.id;
    const signature = [
      String(review.authorUid || ""),
      String(review.rating || ""),
      String(review.text || "").trim(),
    ].join("|");

    if (reviewId) {
      if (seenIds.has(reviewId)) continue;
      seenIds.add(reviewId);
    } else if (signature && seenSignatures.has(signature)) {
      continue;
    }

    if (signature) seenSignatures.add(signature);
    unique.push(review);
  }

  return unique;
}

function reviewTimestampMs(review: ListingReview): number {
  const createdAt = review.createdAt as
    | { _seconds?: number; toMillis?: () => number }
    | undefined;
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === "function") return createdAt.toMillis();
  if (typeof createdAt._seconds === "number") return createdAt._seconds * 1000;
  return 0;
}

export const loadMasterReviews = cache(
  async (
    masterId: string,
    listingIds: string[] = [],
    profileDocId?: string
  ): Promise<ListingReviewsData> => {
    const merged: ListingReview[] = [];

    try {
      const db = getAdminDb();

      const idVariants = [
        masterId,
        profileDocId && profileDocId !== masterId ? profileDocId : null,
      ].filter(Boolean) as string[];

      const queryPromises = idVariants.flatMap((id) => [
        db
          .collection("reviews")
          .where("subjectType", "==", "master")
          .where("subjectId", "==", id)
          .get(),
        db.collection("reviews").where("masterId", "==", id).get(),
        db.collection("reviews").where("profileId", "==", id).get(),
        db
          .collection("reviews")
          .where("type", "==", "master")
          .where("masterId", "==", id)
          .get(),
      ]);

      for (const queryPromise of queryPromises) {
        try {
          const snap = await queryPromise;
          for (const docSnap of snap.docs) {
            const data = docSnap.data() as Record<string, unknown>;
            if (!isApprovedMasterReviewForProfile(data, idVariants)) continue;
            merged.push(
              serializeFirestoreDoc({
                id: docSnap.id,
                ...data,
              }) as ListingReview
            );
          }
        } catch (error) {
          console.warn("[master/[id]] Failed to load reviews query:", error);
        }
      }

      // Legacy listing-owned reviews (backward compatibility)
      const uniqueListingIds = [...new Set(listingIds.filter(Boolean))];
      for (const listingId of uniqueListingIds) {
        try {
          const legacySnap = await db
            .collection("reviews")
            .where("listingId", "==", listingId)
            .get();
          for (const docSnap of legacySnap.docs) {
            const data = docSnap.data() as Record<string, unknown>;
            if (!isApprovedReviewStatus(data)) continue;
            merged.push(
              serializeFirestoreDoc({
                id: docSnap.id,
                ...data,
                masterId,
                subjectType: "master",
                subjectId: masterId,
              }) as ListingReview
            );
          }
        } catch (error) {
          console.warn(
            "[master/[id]] Failed to load legacy listing reviews:",
            listingId,
            error
          );
        }
      }

      try {
        const subSnap = await db
          .collection("masters")
          .doc(masterId)
          .collection("reviews")
          .orderBy("createdAt", "desc")
          .get();
        for (const docSnap of subSnap.docs) {
          const data = docSnap.data() as Record<string, unknown>;
          if (!isApprovedReviewStatus(data)) continue;
          merged.push(
            serializeFirestoreDoc({
              id: docSnap.id,
              ...data,
              masterId,
            }) as ListingReview
          );
        }
      } catch (error) {
        console.warn("[master/[id]] Failed to load master subcollection reviews:", error);
      }
    } catch (error) {
      console.warn("[master/[id]] Failed to load reviews:", error);
      return { reviews: [], avgRating: 0, totalReviews: 0 };
    }

    const uniqueReviews = dedupeReviews(merged);
    const totalReviews = uniqueReviews.length;
    const avgRating =
      totalReviews > 0
        ? uniqueReviews.reduce(
            (sum, review) => sum + (Number(review.rating) || 0),
            0
          ) / totalReviews
        : 0;

    const reviews = [...uniqueReviews].sort(
      (a, b) => reviewTimestampMs(b) - reviewTimestampMs(a)
    );

    return { reviews, avgRating, totalReviews };
  }
);
