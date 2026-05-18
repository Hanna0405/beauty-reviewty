import { isApprovedMasterReviewForAggregation } from "@/lib/reviews/masterReviewFilters";

export type MasterRatingSummary = {
  rating: number | null;
  count: number;
};

export function resolveListingMasterId(listing: Record<string, unknown>): string | null {
  const id =
    listing.masterId ||
    listing.ownerId ||
    listing.ownerUid ||
    listing.userId ||
    listing.userUID ||
    listing.uid ||
    listing.userUid ||
    listing.authorUid ||
    listing.profileUid ||
    listing.profileId ||
    null;
  return id ? String(id).trim() : null;
}

export function buildListingOwnerMap(
  listings: Array<Record<string, unknown>>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const listing of listings) {
    const listingId = String(listing.id || listing._id || "").trim();
    const masterId = resolveListingMasterId(listing);
    if (listingId && masterId) map.set(listingId, masterId);
  }
  return map;
}

export function aggregateRatingsByMaster(
  reviews: Array<Record<string, unknown>>,
  listingOwnerMap: Map<string, string>
): Map<string, MasterRatingSummary> {
  const byMaster = new Map<string, Array<Record<string, unknown>>>();

  for (const review of reviews) {
    const masterId = isApprovedMasterReviewForAggregation(
      review,
      listingOwnerMap
    );
    if (!masterId) continue;
    if (!byMaster.has(masterId)) byMaster.set(masterId, []);
    byMaster.get(masterId)!.push(review);
  }

  const ratings = new Map<string, MasterRatingSummary>();
  byMaster.forEach((items, masterId) => {
    const valid = items.filter(
      (r) => typeof r.rating === "number" && !Number.isNaN(r.rating) && r.rating > 0
    );
    if (!valid.length) {
      ratings.set(masterId, { rating: null, count: 0 });
      return;
    }
    const sum = valid.reduce((acc, r) => acc + Number(r.rating), 0);
    ratings.set(masterId, {
      rating: sum / valid.length,
      count: valid.length,
    });
  });

  return ratings;
}

/** Register rating under every known alias (uid, profile id, etc.). */
export function aliasMasterRatings(
  ratings: Map<string, MasterRatingSummary>,
  masters: Array<Record<string, unknown>>
): Map<string, MasterRatingSummary> {
  const aliased = new Map(ratings);

  for (const master of masters) {
    const aliases = [
      master.uid,
      master.userId,
      master.ownerId,
      master.userUID,
      master.id,
    ]
      .filter(Boolean)
      .map((v) => String(v).trim());

    let found: MasterRatingSummary | undefined;
    for (const key of aliases) {
      if (aliased.has(key)) {
        found = aliased.get(key);
        break;
      }
    }
    if (!found) continue;
    for (const key of aliases) {
      aliased.set(key, found);
    }
  }

  return aliased;
}

export function lookupMasterRating(
  ratings: Map<string, MasterRatingSummary>,
  entity: Record<string, unknown>
): MasterRatingSummary | null {
  const keys = [
    entity.uid,
    entity.userId,
    entity.ownerId,
    entity.userUID,
    entity.id,
    entity._id,
    entity.masterId,
  ]
    .filter(Boolean)
    .map((v) => String(v).trim());

  for (const key of keys) {
    const hit = ratings.get(key);
    if (hit) return hit;
  }
  return null;
}
