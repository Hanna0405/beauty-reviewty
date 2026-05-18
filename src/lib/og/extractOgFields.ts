import { getListingCoverUrl } from "@/lib/listingCover";
import {
  cityLabel,
  pickFirstImage,
  titleLabel,
  type ListingLike,
} from "@/lib/listings/presenters";
import {
  resolveOgImageUrl,
  resolveOgImageUrlFromFields,
} from "./resolveOgImageUrl";

export function pickHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }
  return trimmed;
}

export function readTopServices(
  record: Record<string, unknown> | null | undefined,
  max = 3
): string[] {
  if (!record) return [];

  const names: string[] = [];

  if (Array.isArray(record.serviceNames)) {
    for (const item of record.serviceNames) {
      const label = String(item || "").trim();
      if (label) names.push(label);
    }
  }

  if (Array.isArray(record.services)) {
    for (const item of record.services) {
      if (typeof item === "string") {
        const label = item.trim();
        if (label) names.push(label);
      } else if (item && typeof item === "object") {
        const obj = item as { name?: string; key?: string };
        const label = String(obj.name || obj.key || "").trim();
        if (label) names.push(label);
      }
    }
  }

  if (Array.isArray(record.serviceKeys)) {
    for (const item of record.serviceKeys) {
      const label = String(item || "").trim();
      if (label) names.push(label);
    }
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
    if (unique.length >= max) break;
  }

  return unique;
}

export function profileDisplayName(
  profile: Record<string, unknown> | null,
  listing: ListingLike | null
): string {
  const fromProfile =
    profile?.displayName || profile?.name || profile?.businessName;
  if (fromProfile && String(fromProfile).trim()) {
    return String(fromProfile).trim();
  }

  if (listing) {
    const fromListing =
      listing.displayName ||
      listing.businessName ||
      listing.masterName ||
      listing.profile?.displayName;
    if (fromListing && String(fromListing).trim()) {
      return String(fromListing).trim();
    }

    const listingTitle = listing.title || listing.name;
    if (listingTitle && String(listingTitle).trim()) {
      return String(listingTitle).trim();
    }
  }

  return "Beauty Master";
}

export async function resolveProfileAvatarUrl(
  profile: Record<string, unknown> | null,
  listing?: ListingLike | null
): Promise<string | null> {
  const fromProfile = await resolveOgImageUrlFromFields(
    profile?.avatarUrl,
    profile?.photoURL,
    profile?.imageUrl,
    profile?.imageURL,
    profile?.image,
    profile?.photoUrl
  );
  if (fromProfile) return fromProfile;

  if (listing) {
    return resolveOgImageUrlFromFields(
      listing.masterAvatarUrl,
      listing.avatarUrl,
      listing.profilePhoto,
      pickFirstImage(listing)
    );
  }

  return null;
}

export function profileCityLabel(
  profile: Record<string, unknown> | null,
  listing: ListingLike | null
): string {
  if (profile) {
    const city = profile.city as
      | { formatted?: string; name?: string }
      | string
      | undefined;
    if (city && typeof city === "object") {
      const formatted = city.formatted || city.name;
      if (formatted && String(formatted).trim()) {
        return String(formatted).trim();
      }
    }
    if (typeof city === "string" && city.trim()) return city.trim();
    if (profile.cityName && String(profile.cityName).trim()) {
      return String(profile.cityName).trim();
    }
  }

  return listing ? cityLabel(listing) : "";
}

export async function resolveListingPhotoUrl(
  listing: ListingLike | null
): Promise<string | null> {
  if (!listing) return null;
  const cover = getListingCoverUrl(listing);
  const resolvedCover = await resolveOgImageUrl(cover);
  if (resolvedCover) return resolvedCover;
  return resolveOgImageUrl(pickFirstImage(listing));
}

export function listingTitle(listing: ListingLike | null): string {
  if (!listing) return "Beauty Listing";
  const title = titleLabel(listing);
  return title && String(title).trim() ? String(title).trim() : "Beauty Listing";
}

export function listingCity(listing: ListingLike | null): string {
  return listing ? cityLabel(listing) : "";
}

export function listingServices(listing: ListingLike | null, max = 3): string[] {
  return readTopServices(listing, max);
}

export function masterServices(
  profile: Record<string, unknown> | null,
  listing: ListingLike | null,
  max = 3
): string[] {
  const fromProfile = readTopServices(profile, max);
  if (fromProfile.length > 0) return fromProfile;
  return readTopServices(listing, max);
}
