import type { ListingLike } from "@/lib/listings/presenters";
import type { ListingReview } from "./loadListingReviews";

export type ClientListingInitialData = {
  listing: ListingLike;
  profile: Record<string, unknown> | null;
  reviews: ListingReview[];
  avgRating: number;
  totalReviews: number;
};
