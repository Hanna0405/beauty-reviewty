import type { Metadata } from "next";
import {
  cityLabel,
  serviceLabel,
  languagesLabel,
  type ListingLike,
} from "@/lib/listings/presenters";
import { loadMasterListingPageData } from "./loadMasterListingPageData";

const SITE = "BeautyReviewty";
const BASE_URL = "https://beautyreviewty.com";
const MAX_DESCRIPTION_LENGTH = 160;

export type PublicListingMetadataPaths = {
  canonicalPath?: string;
  ogImagePath?: string;
};

function buildOgImages(ogImagePath: string, alt: string) {
  return [
    {
      url: ogImagePath,
      width: 1200,
      height: 630,
      alt,
    },
  ];
}

function trimToMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max - 1).trimEnd();
  return `${trimmed}…`;
}

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

function primaryService(listing: ListingLike): string {
  const fromPresenter = serviceLabel(listing);
  if (fromPresenter) return fromPresenter;

  if (Array.isArray(listing.serviceNames) && listing.serviceNames[0]) {
    return String(listing.serviceNames[0]).trim();
  }

  if (Array.isArray(listing.services) && listing.services.length > 0) {
    const service = listing.services[0];
    if (typeof service === "string") return service.trim();
    if (service?.name) return String(service.name).trim();
    if (service?.key) return String(service.key).trim();
  }

  if (Array.isArray(listing.serviceKeys) && listing.serviceKeys[0]) {
    return String(listing.serviceKeys[0]).trim();
  }

  return "";
}

function listingTitleLabel(listing: ListingLike): string {
  const title = listing.title || listing.name;
  return title && String(title).trim() ? String(title).trim() : "";
}

function buildTitle(masterName: string, service: string, city: string): string {
  if (service && city) {
    return `${masterName} — ${service} in ${city} | ${SITE}`;
  }
  if (service) {
    return `${masterName} — ${service} | ${SITE}`;
  }
  if (city) {
    return `${masterName} in ${city} | ${SITE}`;
  }
  return `${masterName} | ${SITE}`;
}

function normalizeLanguagesForSeo(languages: string): string {
  if (!languages) return "";

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const part of languages.split(",")) {
    const trimmed = part.trim().replace(/^[^A-Za-zÀ-ÿ]+/, "").trim() || part.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique.join(", ");
}

function buildDescription(
  masterName: string,
  service: string,
  city: string,
  languages: string,
  listingTitle: string
): string {
  const serviceText = service || listingTitle || "beauty";
  const cityPart = city ? ` in ${city}` : "";

  const base = `Find ${serviceText} services by ${masterName}${cityPart}. View photos, reviews, languages, and contact details on ${SITE}.`;

  if (!languages) {
    return trimToMaxLength(base, MAX_DESCRIPTION_LENGTH);
  }

  const withLanguages = `Find ${serviceText} services by ${masterName}${cityPart}. Speaks ${languages}. View photos, reviews, and contact details on ${SITE}.`;

  return trimToMaxLength(
    withLanguages.length <= MAX_DESCRIPTION_LENGTH ? withLanguages : base,
    MAX_DESCRIPTION_LENGTH
  );
}

export async function buildMasterListingMetadata(
  id: string,
  paths?: PublicListingMetadataPaths
): Promise<Metadata> {
  const canonicalPath = paths?.canonicalPath ?? `/masters/${id}`;
  const ogImagePath = paths?.ogImagePath ?? `/masters/${id}/opengraph-image`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const { listing, profile } = await loadMasterListingPageData(id);

  if (!listing) {
    const fallbackTitle = `Beauty Master | ${SITE}`;
    const fallbackDescription = `View beauty professional profiles, photos, reviews, and contact details on ${SITE}.`;
    const ogImages = buildOgImages(ogImagePath, fallbackTitle);

    return {
      title: { absolute: fallbackTitle },
      description: fallbackDescription,
      alternates: { canonical: canonicalPath },
      openGraph: {
        type: "profile",
        title: fallbackTitle,
        description: fallbackDescription,
        url: canonicalUrl,
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
        images: ogImages.map((image) => image.url),
      },
    };
  }

  const name = masterDisplayName(listing, profile);
  const service = primaryService(listing);
  const city = cityLabel(listing);
  const languages = normalizeLanguagesForSeo(languagesLabel(listing));
  const listingTitle = listingTitleLabel(listing);
  const title = buildTitle(name, service || listingTitle, city);
  const description = buildDescription(
    name,
    service,
    city,
    languages,
    listingTitle
  );
  const ogImages = buildOgImages(ogImagePath, title);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonicalUrl,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((image) => image.url),
    },
  };
}
