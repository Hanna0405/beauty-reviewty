import { isApprovedMasterReviewForFeed } from "@/lib/reviews/masterReviewFilters";
import {
  type ReviewtyFeedCard,
  sortFeedCards,
} from "@/lib/reviewty/mapReviewToFeedCard";
import { buildMasterPublicCardId } from "@/lib/reviewty/publicCardIds";

export type RawMasterReviewDoc = {
  id: string;
  data: Record<string, unknown>;
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
        return item.url ? { url: item.url, path: item.path } : null;
      }
      return null;
    })
    .filter(Boolean) as (string | { url: string; path?: string })[];
}

function masterKeyFromReview(data: Record<string, unknown>): string | null {
  const id = String(
    data.masterId || data.subjectId || data.profileId || ""
  ).trim();
  return id || null;
}

/** Collect master UIDs already represented by publicCards. */
export function collectCoveredMasterIds(
  publicCardDocs: Array<{ id: string; data: Record<string, unknown> }>
): Set<string> {
  const covered = new Set<string>();
  for (const { id, data } of publicCardDocs) {
    for (const key of ["masterId", "masterUid", "profileId"] as const) {
      const val = data[key];
      if (val) covered.add(String(val).trim());
    }
    if (id.startsWith("master_")) {
      covered.add(id.slice("master_".length));
    }
  }
  return covered;
}

/**
 * Group root master reviews into one feed card per master/profile.
 * Skips reviews already linked to an existing publicCard doc.
 */
export function aggregateMasterReviewsToProfileCards(
  reviewDocs: RawMasterReviewDoc[],
  options: {
    excludeMasterIds?: Set<string>;
    existingPublicCardIds?: Set<string>;
  } = {}
): ReviewtyFeedCard[] {
  const byMaster = new Map<string, RawMasterReviewDoc[]>();

  for (const doc of reviewDocs) {
    const { data } = doc;
    if (!isApprovedMasterReviewForFeed(data)) continue;

    const publicCardId = data.publicCardId
      ? String(data.publicCardId).trim()
      : "";
    if (
      publicCardId &&
      options.existingPublicCardIds?.has(publicCardId)
    ) {
      continue;
    }

    const masterKey = masterKeyFromReview(data);
    if (!masterKey) continue;
    if (options.excludeMasterIds?.has(masterKey)) continue;

    const bucket = byMaster.get(masterKey) ?? [];
    bucket.push(doc);
    byMaster.set(masterKey, bucket);
  }

  const cards: ReviewtyFeedCard[] = [];

  for (const [masterId, docs] of byMaster) {
    const sorted = [...docs].sort(
      (a, b) => toMillis(b.data.createdAt) - toMillis(a.data.createdAt)
    );
    const newest = sorted[0];
    const nd = newest.data;

    const ratings = sorted
      .map((d) => Number(d.data.rating))
      .filter((r) => Number.isFinite(r) && r >= 1 && r <= 5);
    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;
    const count = sorted.length;

    const masterName = String(
      nd.masterName || nd.masterDisplay || "Master"
    ).trim();
    const cityLabel = String(
      nd.masterCity || nd.city || nd.cityName || ""
    ).trim();
    const cardId = buildMasterPublicCardId(masterId);

    cards.push({
      id: cardId,
      masterId,
      masterName,
      masterDisplay: masterName,
      cityName: cityLabel,
      masterCity: cityLabel,
      serviceName: Array.isArray(nd.masterServices)
        ? String((nd.masterServices as unknown[])[0] || "")
        : "",
      masterServices: Array.isArray(nd.masterServices)
        ? (nd.masterServices as string[])
        : [],
      masterLanguages: Array.isArray(nd.masterLanguages)
        ? (nd.masterLanguages as string[])
        : [],
      masterKeywords: Array.isArray(nd.masterKeywords)
        ? (nd.masterKeywords as string[])
        : [],
      masterSlug: cardId,
      masterRef: { type: "master", id: masterId },
      text: String(nd.text || nd.body || nd.reviewText || ""),
      photos: normalizePhotos(nd.photos),
      createdAt: nd.createdAt ?? null,
      authorName: String(nd.authorName || "Verified client"),
      authorUid: nd.authorUid ? String(nd.authorUid) : undefined,
      rating: avg ?? undefined,
      totalReviews: count,
      computedRating: avg,
      computedReviewsCount: count,
      source: "master-profile",
      _sortMs: toMillis(nd.createdAt),
    });
  }

  return sortFeedCards(cards, (item) => item._sortMs ?? 0);
}
