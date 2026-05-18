import {
  buildReviewsSchema,
  type ReviewsStats,
} from "@/lib/seo/jsonLdReviews";
import {
  cityLabel,
  pickFirstImage,
  type ListingLike,
} from "@/lib/listings/presenters";

const BASE_URL = "https://beautyreviewty.com";

type JsonLdObject = Record<string, unknown>;

function profileName(profile: Record<string, unknown>): string {
  const candidates = [profile.displayName, profile.name, profile.businessName, profile.nickname];
  for (const candidate of candidates) {
    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  return "Beauty Master";
}

function readServices(profile: Record<string, unknown>): string[] {
  const names: string[] = [];

  if (Array.isArray(profile.serviceNames)) {
    for (const item of profile.serviceNames) {
      const label = String(item || "").trim();
      if (label) names.push(label);
    }
  }

  if (Array.isArray(profile.services)) {
    for (const item of profile.services) {
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

  return [...new Set(names)];
}

function normalizeCountry(value: string): string {
  const normalized = value.trim();
  if (normalized === "CA") return "Canada";
  if (normalized === "US" || normalized === "USA") return "United States";
  return normalized;
}

function readAddress(profile: Record<string, unknown>): Record<string, string> | null {
  const address: Record<string, string> = {};
  const cityValue = profile.city;

  if (cityValue && typeof cityValue === "object") {
    const cityObj = cityValue as Record<string, unknown>;
    const locality = String(cityObj.name || cityObj.city || cityObj.cityName || "").trim();
    const region = String(cityObj.state || cityObj.stateCode || cityObj.province || "").trim();
    const country = String(cityObj.country || cityObj.countryCode || "").trim();
    if (locality) address.addressLocality = locality;
    if (region) address.addressRegion = region;
    if (country) address.addressCountry = normalizeCountry(country);
  } else if (typeof cityValue === "string" && cityValue.trim()) {
    const parts = cityValue.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts[0]) address.addressLocality = parts[0];
    if (parts[1]) address.addressRegion = parts[1];
    if (parts[2]) address.addressCountry = normalizeCountry(parts[2]);
  }

  if (!address.addressLocality && profile.cityName) {
    address.addressLocality = String(profile.cityName).trim();
  }

  return Object.keys(address).length > 0 ? address : null;
}

function readProfileImage(
  profile: Record<string, unknown>,
  listings: ListingLike[]
): string | null {
  const avatar = profile.avatarUrl || profile.photoURL || profile.imageUrl;
  if (typeof avatar === "string" && avatar.startsWith("http")) {
    return avatar;
  }

  for (const listing of listings) {
    const image = pickFirstImage(listing);
    if (image) return image;
  }

  return null;
}

export function buildMasterJsonLd(
  id: string,
  profile: Record<string, unknown>,
  reviewsData: ReviewsStats,
  listings: ListingLike[] = []
): JsonLdObject {
  const name = profileName(profile);
  const services = readServices(profile);
  const address = readAddress(profile);
  const areaServed = address?.addressLocality || cityLabel(profile as ListingLike);
  const image = readProfileImage(profile, listings);
  const { aggregateRating, review: reviewItems } = buildReviewsSchema(reviewsData);

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name,
    url: `${BASE_URL}/master/${encodeURIComponent(id)}`,
  };

  if (image) jsonLd.image = image;
  if (areaServed) jsonLd.areaServed = areaServed;
  if (services.length > 0) jsonLd.serviceType = services;
  if (address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      ...address,
    };
  }
  if (aggregateRating) jsonLd.aggregateRating = aggregateRating;
  if (reviewItems.length > 0) jsonLd.review = reviewItems;

  return jsonLd;
}
