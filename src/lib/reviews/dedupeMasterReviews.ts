/** Shared dedupe for master-profile and Reviewty master-linked cards. */

export type ReviewLike = {
  id?: string;
  originalReviewId?: string;
  sourceReviewId?: string;
  reviewId?: string;
  rootReviewId?: string;
  authorUid?: string;
  authorName?: string;
  reviewerName?: string;
  rating?: number;
  text?: string;
  body?: string;
  reviewText?: string;
  createdAt?: unknown;
};

const STABLE_ID_FIELDS = [
  "originalReviewId",
  "sourceReviewId",
  "reviewId",
  "rootReviewId",
  "id",
] as const;

function createdAtKey(createdAt: unknown): string {
  if (!createdAt) return "";
  if (typeof createdAt === "object" && createdAt !== null) {
    const ts = createdAt as {
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof ts.toMillis === "function") return String(ts.toMillis());
    if (typeof ts.seconds === "number") return String(ts.seconds);
    if (typeof ts._seconds === "number") return String(ts._seconds);
  }
  return String(createdAt);
}

function reviewText(review: ReviewLike): string {
  return String(review.text || review.body || review.reviewText || "").trim();
}

function reviewerName(review: ReviewLike): string {
  return String(
    review.reviewerName || review.authorName || review.authorUid || ""
  ).trim();
}

/** Fallback when no stable id fields are present on the review doc. */
export function reviewFallbackSignature(review: ReviewLike): string {
  const name = reviewerName(review);
  const text = reviewText(review);
  const rating = String(review.rating ?? "");
  const createdAt = createdAtKey(review.createdAt);
  return `sig:${name}|${rating}|${text}|${createdAt}`;
}

/** Collect all dedupe keys for a review (stable ids + fallback signature). */
export function reviewDedupeKeys(review: ReviewLike): string[] {
  const keys: string[] = [];
  for (const field of STABLE_ID_FIELDS) {
    const val = String(review[field] || "").trim();
    if (val) keys.push(`id:${val}`);
  }
  keys.push(reviewFallbackSignature(review));
  return keys;
}

/**
 * Dedupe reviews before count, rating average, and rendering.
 * Does not count root review and mirrored publicReview as separate reviews.
 */
export function dedupeMasterReviews<T extends ReviewLike>(reviews: T[]): T[] {
  const unique: T[] = [];
  const seenKeys = new Set<string>();

  for (const review of reviews) {
    const keys = reviewDedupeKeys(review);
    if (keys.some((key) => seenKeys.has(key))) continue;
    for (const key of keys) seenKeys.add(key);
    unique.push(review);
  }

  return unique;
}
