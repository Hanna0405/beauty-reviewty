import type { ReviewDoc } from "@/lib/reviews/types";

function createdAtISO(review: Record<string, unknown>): string | null {
  const createdAt = review.createdAt as
    | { _seconds?: number; seconds?: number; toMillis?: () => number }
    | undefined;
  if (!createdAt) return null;
  if (typeof createdAt.toMillis === "function") {
    return new Date(createdAt.toMillis()).toISOString();
  }
  const seconds = createdAt.seconds ?? createdAt._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString();
  }
  return null;
}

export function mapServerReviewToClient(
  review: Record<string, unknown> & { id: string },
  subjectId: string
): ReviewDoc {
  const masterUid = String(
    review.masterId || review.subjectId || subjectId
  ).trim();

  return {
    id: review.id,
    subject: { type: "master", id: masterUid },
    subjectType: "master",
    subjectId: masterUid,
    authorUid: String(review.authorUid || ""),
    rating: Number(review.rating) || 0,
    text: String(review.text || review.body || review.reviewText || ""),
    photos: Array.isArray(review.photos)
      ? (review.photos as ReviewDoc["photos"])
      : [],
    author: {
      name: String(review.authorName || "Verified client"),
      photoURL: null,
    },
    createdAtISO: createdAtISO(review),
  };
}
