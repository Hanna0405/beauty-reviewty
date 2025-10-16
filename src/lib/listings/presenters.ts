export type ListingLike = Record<string, any>;

export function pickFirstImage(x: ListingLike): string | null {
  const paths = [
    "cover", "image", "photo", "thumbnail",
    "photos.0.url", "images.0.url", "media.0.url",
    "photos.0", "images.0", "media.0"
  ];
  for (const p of paths) {
    const v = p.split(".").reduce((a, k) => (a == null ? a : a[k]), x) as unknown;
    if (typeof v === 'string' && v.length > 0) {
      // Only return HTTP/HTTPS URLs, not gs:// paths
      return v.startsWith('http') ? v : null;
    }
  }
  return null;
}

export function cityLabel(x: ListingLike): string {
  const c =
    x?.city?.formatted ||
    x?.cityName ||
    x?.city?.name ||
    x?.profile?.cityName ||
    x?.data?.cityName ||
    "";
  return String(c || "").trim();
}

export function serviceLabel(x: ListingLike): string {
  const s =
    x?.serviceName ||
    x?.services?.[0]?.name ||
    x?.serviceNames?.[0] ||
    x?.serviceKeys?.[0] ||
    "";
  return String(s || "").trim();
}

const LANG_MAP: Record<string, string> = {
  en: "English", uk: "Ukrainian", ru: "Russian",
  fr: "French", es: "Spanish", pl: "Polish", de: "German"
};

export function languagesLabel(x: ListingLike): string {
  const names = (x?.languageNames as string[])?.filter(Boolean) || [];
  const keys = (x?.languageKeys as string[])?.filter(Boolean) || (x?.languageCodes as string[])?.filter(Boolean) || [];
  const fromKeys = keys.map(k => LANG_MAP[k] || k.toUpperCase());
  const all = [...names, ...fromKeys];
  return [...new Set(all)].join(", ");
}

export function titleLabel(x: ListingLike): string {
  return (
    x?.title ||
    x?.name ||
    x?.displayName ||
    x?.profile?.displayName ||
    "Listing"
  );
}

export function ratingValue(x: ListingLike): number | null {
  const v = x?.rating ?? x?.avgRating ?? x?.stars;
  return typeof v === "number" ? v : null;
}

export function listingId(x: ListingLike): string | null {
  return x?.id || x?._id || x?.uid || null;
}

export function masterId(x: ListingLike): string | null {
  return x?.masterId || x?.ownerId || x?.profileUid || null;
}

export function reviewsCountValue(x: ListingLike): number {
  const v = x?.reviewsCount ?? x?.reviews?.length ?? x?.ratingCount ?? 0;
  return typeof v === "number" ? v : 0;
}

