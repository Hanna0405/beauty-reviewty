export type ListingLike = {
  profileId?: string | null;
  masterId?: string | null; // legacy field name
  ownerUid?: string | null; // fallback to owner's uid if profiles keyed by uid
  userUid?: string | null; // sometimes used instead of ownerUid
};

export function getMasterProfileId(listing: ListingLike): string | null {
  const id =
    listing?.profileId ||
    listing?.masterId ||
    listing?.ownerUid ||
    listing?.userUid ||
    null;
  if (!id) return null;
  return String(id);
}

