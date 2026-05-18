export type ReviewtyFeedCard = {
  id: string;
  masterName?: string;
  masterDisplay?: string;
  cityName?: string;
  serviceName?: string;
  rating?: number;
  totalReviews?: number;
  text?: string;
  photos?: (string | { url: string; path?: string })[];
  createdAt?: unknown;
  authorName?: string;
  authorUid?: string;
  masterRef?: {
    type: "listing" | "community" | "master";
    id: string;
    slug?: string;
  };
  masterId?: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  masterKeywords?: string[];
  masterSlug?: string;
  source?: string;
  computedRating?: number | null;
  computedReviewsCount?: number;
  _sortMs?: number;
};

function toMillis(createdAt: unknown): number {
  if (!createdAt) return 0;
  if (typeof createdAt === "object" && createdAt !== null) {
    const ts = createdAt as {
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.seconds === "number") return ts.seconds * 1000;
    if (typeof ts._seconds === "number") return ts._seconds * 1000;
  }
  return 0;
}

function normalizePhotos(
  photos: unknown
): (string | { url: string; path?: string })[] {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object" && "url" in p) {
        const item = p as { url?: string; path?: string };
        return item.url
          ? { url: item.url, path: item.path }
          : null;
      }
      return null;
    })
    .filter(Boolean) as (string | { url: string; path?: string })[];
}

/** Map a root `reviews` document to a Reviewty feed card. */
export function mapReviewDocToFeedCard(
  id: string,
  data: Record<string, unknown>
): ReviewtyFeedCard {
  const masterId = String(
    data.masterId || data.subjectId || data.profileId || ""
  ).trim();
  const masterName = String(
    data.masterName || data.masterDisplay || ""
  ).trim();
  const cityLabel = String(
    data.masterCity || data.city || data.cityName || ""
  ).trim();

  return {
    id,
    masterName,
    masterDisplay: masterName,
    cityName: cityLabel,
    masterCity: cityLabel,
    serviceName: Array.isArray(data.masterServices)
      ? String((data.masterServices as unknown[])[0] || "")
      : "",
    rating: Number(data.rating) || 0,
    totalReviews: 1,
    text: String(data.text || data.body || data.reviewText || ""),
    photos: normalizePhotos(data.photos),
    createdAt: data.createdAt ?? null,
    authorName: String(data.authorName || "Verified client"),
    authorUid: data.authorUid ? String(data.authorUid) : undefined,
    masterRef: data.masterRef as ReviewtyFeedCard["masterRef"],
    masterId: masterId || undefined,
    masterServices: Array.isArray(data.masterServices)
      ? (data.masterServices as string[])
      : [],
    masterLanguages: Array.isArray(data.masterLanguages)
      ? (data.masterLanguages as string[])
      : [],
    masterKeywords: Array.isArray(data.masterKeywords)
      ? (data.masterKeywords as string[])
      : [],
    masterSlug: data.masterSlug ? String(data.masterSlug) : undefined,
    source: String(data.source || "master-review"),
    computedRating: Number(data.rating) || null,
    computedReviewsCount: 1,
    _sortMs: toMillis(data.createdAt),
  };
}

export function sortFeedCards<T extends { createdAt?: unknown }>(
  items: T[],
  getMs: (item: T) => number = (item) => toMillis(item.createdAt)
): T[] {
  return [...items].sort((a, b) => getMs(b) - getMs(a));
}
