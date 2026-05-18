import { cache } from "react";
import { getAdminDb } from "@/lib/firebaseAdmins";
import { serializeFirestoreDoc } from "@/lib/firestore/serializeForClient";

export type ListingReview = Record<string, unknown> & { id: string };

export type ListingReviewsData = {
  reviews: ListingReview[];
  avgRating: number;
  totalReviews: number;
};

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

export const loadListingReviews = cache(
  async (listingId: string): Promise<ListingReviewsData> => {
    const merged: ListingReview[] = [];

    try {
      const db = getAdminDb();
      try {
        const subSnap = await db
          .collection("masters")
          .doc(listingId)
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
        console.warn(
          "[masters/[id]] Failed to load master subcollection reviews:",
          error
        );
      }

      try {
        const rootSnap = await db
          .collection("reviews")
          .where("type", "==", "listing")
          .where("listingId", "==", listingId)
          .get();
        for (const docSnap of rootSnap.docs) {
          merged.push(
            serializeFirestoreDoc({
              id: docSnap.id,
              ...docSnap.data(),
            }) as ListingReview
          );
        }
      } catch (error) {
        console.warn("[masters/[id]] Failed to load root reviews:", error);
      }
    } catch (error) {
      console.warn("[masters/[id]] Failed to load reviews:", error);
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
