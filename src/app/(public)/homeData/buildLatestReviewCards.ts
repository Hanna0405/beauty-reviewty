import { getLatestReviews } from "./getLatestReviews";
import { getListingPreviewPhoto } from "./getListingPreviewPhoto";

export type ReviewCard = {
  reviewId: string;
  rating: number;
  text: string;
  imageUrl: string | null;
};

export async function buildLatestReviewCards(): Promise<ReviewCard[]> {
  try {
    const reviews = await getLatestReviews(10);

    const reviewCards: ReviewCard[] = [];

    for (const review of reviews) {
      let imageUrl: string | null = null;

      // First try to get photo from review itself
      // photos can be undefined, empty, array of strings, or array of {url: string}
      const photos = Array.isArray(review.photos) ? review.photos : [];

      if (photos.length > 0) {
        const first = photos[0];
        if (typeof first === "string") {
          imageUrl = first;
        } else if (first && typeof first === "object" && "url" in first) {
          imageUrl = (first as { url?: string }).url ?? null;
        }
      }

      // If no review photo, try to get listing photo as fallback
      if (!imageUrl && review.listingId) {
        imageUrl = await getListingPreviewPhoto(review.listingId);
      }

      // If still no photo, try masterId as fallback
      if (!imageUrl && review.masterId) {
        imageUrl = await getListingPreviewPhoto(review.masterId);
      }

      reviewCards.push({
        reviewId: review.reviewId,
        rating: review.rating || 5,
        text: review.text || "",
        imageUrl,
      });
    }

    return reviewCards;
  } catch (error) {
    console.error("Failed to build latest review cards:", error);
    return [];
  }
}
