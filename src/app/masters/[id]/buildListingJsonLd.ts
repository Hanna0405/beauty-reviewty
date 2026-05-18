import {
  pickFirstImage,
  cityLabel,
  serviceLabel,
  titleLabel,
  type ListingLike,
} from "@/lib/listings/presenters";
import {
  buildReviewsSchema,
  type ReviewsStats,
} from "@/lib/seo/jsonLdReviews";

const BASE_URL = "https://beautyreviewty.com";

type JsonLdObject = Record<string, unknown>;

function masterDisplayName(
  listing: ListingLike,
  profile?: Record<string, unknown> | null
): string {
  const fromListing =
    listing.displayName ||
    listing.businessName ||
    listing.masterName ||
    listing.profile?.displayName ||
    listing.profileName;

  if (fromListing && String(fromListing).trim()) {
    return String(fromListing).trim();
  }

  if (profile) {
    const fromProfile =
      profile.displayName || profile.name || profile.businessName;
    if (fromProfile && String(fromProfile).trim()) {
      return String(fromProfile).trim();
    }
  }

  const listingTitle = listing.title || listing.name;
  if (listingTitle && String(listingTitle).trim()) {
    return String(listingTitle).trim();
  }

  return "Beauty Master";
}

function readServices(listing: ListingLike): string[] {
  if (Array.isArray(listing.serviceNames) && listing.serviceNames.length > 0) {
    return listing.serviceNames
      .map((service) => String(service).trim())
      .filter(Boolean);
  }

  if (Array.isArray(listing.services) && listing.services.length > 0) {
    return listing.services
      .map((service) => {
        if (typeof service === "string") return service.trim();
        return String(service?.name || service?.key || "").trim();
      })
      .filter(Boolean);
  }

  if (Array.isArray(listing.serviceKeys) && listing.serviceKeys.length > 0) {
    return listing.serviceKeys
      .map((service) => String(service).trim())
      .filter(Boolean);
  }

  const single = serviceLabel(listing);
  return single ? [single] : [];
}

function readDescription(
  listing: ListingLike,
  name: string,
  city: string,
  services: string[]
): string | undefined {
  if (typeof listing.description === "string" && listing.description.trim()) {
    return listing.description.trim();
  }

  const service = services[0] || "";
  if (service && city) {
    return `Find ${service} services by ${name} in ${city} on BeautyReviewty.`;
  }
  if (city) {
    return `${name} offers beauty services in ${city} on BeautyReviewty.`;
  }
  if (service) {
    return `${name} offers ${service} services on BeautyReviewty.`;
  }

  return undefined;
}

function normalizeCountry(value: string): string {
  const normalized = value.trim();
  if (normalized === "CA") return "Canada";
  if (normalized === "US" || normalized === "USA") return "United States";
  return normalized;
}

function splitLocationLabel(label: string): Record<string, string> {
  const parts = label
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const result: Record<string, string> = {};

  if (parts.length >= 3) {
    result.addressLocality = parts[0];
    result.addressRegion = parts[1];
    result.addressCountry = normalizeCountry(parts[2]);
    return result;
  }
  if (parts.length === 2) {
    result.addressLocality = parts[0];
    result.addressRegion = parts[1];
    return result;
  }
  if (parts.length === 1) {
    result.addressLocality = parts[0];
  }

  return result;
}

function readAddress(
  listing: ListingLike,
  profile?: Record<string, unknown> | null
): Record<string, string> | null {
  const address: Record<string, string> = {};
  const cityValue = listing.city;

  if (cityValue && typeof cityValue === "object") {
    const cityObj = cityValue as Record<string, unknown>;
    const locality = String(
      cityObj.name || cityObj.city || cityObj.cityName || ""
    ).trim();
    const region = String(
      cityObj.state || cityObj.stateCode || cityObj.province || ""
    ).trim();
    const country = String(cityObj.country || cityObj.countryCode || "").trim();

    if (locality) address.addressLocality = locality;
    if (region) address.addressRegion = region;
    if (country) address.addressCountry = normalizeCountry(country);
  } else if (typeof cityValue === "string" && cityValue.trim()) {
    Object.assign(address, splitLocationLabel(cityValue));
  }

  if (!address.addressLocality) {
    Object.assign(address, splitLocationLabel(cityLabel(listing)));
  } else if (
    address.addressLocality.includes(",") &&
    !address.addressRegion
  ) {
    Object.assign(address, splitLocationLabel(address.addressLocality));
  }

  const location = profile?.location;
  if (location && typeof location === "object") {
    const locationObj = location as Record<string, unknown>;
    if (!address.addressLocality) {
      const locality = String(locationObj.city || "").trim();
      if (locality) address.addressLocality = locality;
    }
    if (!address.addressRegion) {
      const region = String(locationObj.state || "").trim();
      if (region) address.addressRegion = region;
    }
    if (!address.addressCountry) {
      const country = String(locationObj.country || "").trim();
      if (country) address.addressCountry = normalizeCountry(country);
    }
  }

  return Object.keys(address).length > 0 ? address : null;
}

function readAreaServed(
  listing: ListingLike,
  address: Record<string, string> | null
): string | undefined {
  return address?.addressLocality || cityLabel(listing) || undefined;
}

function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

function normalizeInstagramUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const external = normalizeExternalUrl(trimmed);
  if (external && external.includes("instagram.com")) {
    return external;
  }

  const handle = trimmed.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  if (/^[A-Za-z0-9._]+$/.test(handle)) {
    return `https://instagram.com/${handle}`;
  }

  return null;
}

function readSameAs(
  listing: ListingLike,
  profile?: Record<string, unknown> | null
): string[] {
  const urls = new Set<string>();

  for (const value of [
    listing.website,
    listing.siteUrl,
    profile?.website,
    profile?.siteUrl,
  ]) {
    const url = normalizeExternalUrl(value);
    if (url) urls.add(url);
  }

  for (const value of [listing.instagram, profile?.instagram]) {
    const url = normalizeInstagramUrl(value);
    if (url) urls.add(url);
  }

  return [...urls];
}

export function buildListingJsonLd(
  id: string,
  listing: ListingLike,
  profile?: Record<string, unknown> | null,
  reviewsData?: ReviewsStats | null
): JsonLdObject | null {
  const listingName = titleLabel(listing);
  const providerName = masterDisplayName(listing, profile);
  const services = readServices(listing);
  const address = readAddress(listing, profile);
  const areaServed = readAreaServed(listing, address);
  const image = pickFirstImage(listing);
  const description = readDescription(
    listing,
    providerName,
    areaServed || cityLabel(listing),
    services
  );
  const { aggregateRating, review: reviewItems } = buildReviewsSchema(
    reviewsData ?? undefined
  );
  const sameAs = readSameAs(listing, profile);

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: listingName,
    url: `${BASE_URL}/masters/${id}`,
    provider: {
      "@type": "HealthAndBeautyBusiness",
      name: providerName,
    },
  };

  if (description) jsonLd.description = description;
  if (image) jsonLd.image = image;
  if (address) {
    jsonLd.areaServed = areaServed || cityLabel(listing);
    jsonLd.provider = {
      ...(jsonLd.provider as Record<string, unknown>),
      address: {
        "@type": "PostalAddress",
        ...address,
      },
    };
  } else if (areaServed) {
    jsonLd.areaServed = areaServed;
  }
  if (services.length > 0) jsonLd.serviceType = services;
  if (aggregateRating) jsonLd.aggregateRating = aggregateRating;
  if (reviewItems.length > 0) jsonLd.review = reviewItems;
  if (sameAs.length > 0) {
    jsonLd.provider = {
      ...(jsonLd.provider as Record<string, unknown>),
      sameAs,
    };
  }

  return jsonLd;
}
