import { cache } from "react";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { serializeFirestoreDoc } from "@/lib/firestore/serializeForClient";
import type {
  ListingReview,
  ListingReviewsData,
} from "@/app/masters/[id]/loadListingReviews";

function dedupeReviews(reviews: ListingReview[]): ListingReview[] {
  const unique: ListingReview[] = [];
  const seen = new Set<string>();

  for (const review of reviews) {
    const reviewId = review.id;
    if (!reviewId) {
      unique.push(review);
      continue;
    }
    if (seen.has(reviewId)) continue;
    seen.add(reviewId);
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
  async (masterId: string): Promise<ListingReviewsData> => {
    const merged: ListingReview[] = [];

    try {
      const db = getAdminDb();

      const queries = [
        db
          .collection("reviews")
          .where("subjectType", "==", "master")
          .where("subjectId", "==", masterId)
          .get(),
        db.collection("reviews").where("masterId", "==", masterId).get(),
        db.collection("reviews").where("profileId", "==", masterId).get(),
      ];

      for (const queryPromise of queries) {
        try {
          const snap = await queryPromise;
          for (const docSnap of snap.docs) {
            merged.push(
              serializeFirestoreDoc({
                id: docSnap.id,
                ...docSnap.data(),
              }) as ListingReview
            );
          }
        } catch (error) {
          console.warn("[master/[id]] Failed to load reviews query:", error);
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
          merged.push(
            serializeFirestoreDoc({
              id: docSnap.id,
              ...docSnap.data(),
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
