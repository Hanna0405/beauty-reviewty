export type ListingLike = {
  profileId?: string | null;
  masterId?: string | null;
  ownerId?: string | null;
  ownerUid?: string | null;
  userId?: string | null;
  userUid?: string | null;
  uid?: string | null;
  profileUid?: string | null;
};

export function getMasterProfileId(listing: ListingLike): string | null {
  const id =
    listing?.profileId ||
    listing?.masterId ||
    listing?.ownerId ||
    listing?.ownerUid ||
    listing?.userId ||
    listing?.userUid ||
    listing?.uid ||
    listing?.profileUid ||
    null;
  if (!id) return null;
  return String(id);
}

