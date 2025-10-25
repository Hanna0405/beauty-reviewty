export function getListingCoverUrl(listing: any): string | null {
  if (!listing) return null;

  // explicit cover if present
  if (
    typeof listing.coverPhoto === "string" &&
    listing.coverPhoto.startsWith("http")
  ) {
    return listing.coverPhoto.trim();
  }

  if (
    typeof listing._coverPhoto === "string" &&
    listing._coverPhoto.startsWith("http")
  ) {
    return listing._coverPhoto.trim();
  }

  // photos[]
  if (Array.isArray(listing.photos)) {
    for (const v of listing.photos) {
      if (typeof v === "string" && v.startsWith("http")) {
        return v.trim();
      }
    }
  }

  // images[]
  if (Array.isArray(listing.images)) {
    for (const v of listing.images) {
      if (typeof v === "string" && v.startsWith("http")) {
        return v.trim();
      }
    }
  }

  // gallery[]
  if (Array.isArray(listing.gallery)) {
    for (const v of listing.gallery) {
      if (typeof v === "string" && v.startsWith("http")) {
        return v.trim();
      }
    }
  }

  return null;
}
