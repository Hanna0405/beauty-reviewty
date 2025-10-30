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
      if (
        review.photos &&
        Array.isArray(review.photos) &&
        review.photos.length > 0
      ) {
        const firstPhoto = review.photos[0];
        imageUrl =
          typeof firstPhoto === "string" ? firstPhoto : firstPhoto?.url || null;
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
