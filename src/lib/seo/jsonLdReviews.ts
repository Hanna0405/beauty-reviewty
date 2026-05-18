import type { ListingReview } from "@/app/masters/[id]/loadListingReviews";

export type ReviewsStats = {
  reviews: ListingReview[];
  avgRating: number;
  totalReviews: number;
};

export function buildAggregateRatingJsonLd(
  stats: ReviewsStats | null | undefined
): Record<string, string | number> | null {
  if (!stats) return null;

  const ratedReviews = stats.reviews.filter((review) => {
    const rating = Number(review.rating);
    return Number.isFinite(rating) && rating > 0;
  });

  if (ratedReviews.length === 0) return null;

  const reviewCount = ratedReviews.length;
  const avgRating =
    ratedReviews.reduce((sum, review) => sum + Number(review.rating), 0) /
    reviewCount;

  if (!Number.isFinite(avgRating) || avgRating <= 0) return null;

  return {
    "@type": "AggregateRating",
    ratingValue: Math.round(avgRating * 10) / 10,
    reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}

/** AggregateRating + Review[] derived from the same rated review set. */
export function buildReviewsSchema(stats: ReviewsStats | null | undefined): {
  aggregateRating: Record<string, string | number> | null;
  review: Record<string, unknown>[];
} {
  if (!stats) {
    return { aggregateRating: null, review: [] };
  }

  const review = buildReviewJsonLdItems(stats.reviews);
  const aggregateRating = buildAggregateRatingJsonLd(stats);

  return { aggregateRating, review };
}

function reviewAuthorName(review: ListingReview): string {
  const author = review.author as { name?: string } | undefined;
  const candidates = [
    review.authorName,
    review.userName,
    author?.name,
    review.displayName,
  ];

  for (const candidate of candidates) {
    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return "Anonymous";
}

function reviewDatePublished(review: ListingReview): string | undefined {
  if (typeof review.createdAtISO === "string" && review.createdAtISO.trim()) {
    return review.createdAtISO.trim().split("T")[0];
  }

  const createdAt = review.createdAt as
    | { _seconds?: number; toDate?: () => Date }
    | string
    | undefined;

  if (typeof createdAt === "string" && createdAt.trim()) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  if (createdAt && typeof createdAt === "object") {
    if (typeof createdAt.toDate === "function") {
      return createdAt.toDate().toISOString().split("T")[0];
    }
    if (typeof createdAt._seconds === "number") {
      return new Date(createdAt._seconds * 1000).toISOString().split("T")[0];
    }
  }

  return undefined;
}

function reviewBodyText(review: ListingReview): string | undefined {
  const candidates = [review.text, review.comment, review.reviewBody, review.body];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

export function buildReviewJsonLdItems(
  reviews: ListingReview[]
): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];

  for (const review of reviews) {
    const rating = Number(review.rating);
    if (!Number.isFinite(rating) || rating <= 0) continue;

    const item: Record<string, unknown> = {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: reviewAuthorName(review),
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: Math.round(rating * 10) / 10,
        bestRating: 5,
        worstRating: 1,
      },
    };

    const body = reviewBodyText(review);
    if (body) item.reviewBody = body;

    const datePublished = reviewDatePublished(review);
    if (datePublished) item.datePublished = datePublished;

    items.push(item);
  }

  return items;
}
