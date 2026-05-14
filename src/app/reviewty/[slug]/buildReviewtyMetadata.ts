import type { Metadata } from "next";
import { normalizePhotos } from "@/components/reviewty/getPhotoUrl";
import { loadPublicCard, type PublicCardRecord } from "./loadPublicCard";

const SITE = "BeautyReviewty";
const BASE_URL = "https://beautyreviewty.com";
const MAX_DESCRIPTION_LENGTH = 160;

function trimToMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max - 1).trimEnd();
  return `${trimmed}…`;
}

function formatServiceKey(key: string): string {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function readServices(data: PublicCardRecord): string[] {
  if (Array.isArray(data.serviceNames) && data.serviceNames.length > 0) {
    return data.serviceNames
      .map((service) => String(service).trim())
      .filter(Boolean);
  }

  if (Array.isArray(data.serviceKeys) && data.serviceKeys.length > 0) {
    return data.serviceKeys
      .map((service) => formatServiceKey(String(service)))
      .filter(Boolean);
  }

  return [];
}

function readCity(data: PublicCardRecord): string {
  const city = data.city as
    | { formatted?: string; cityName?: string }
    | string
    | undefined;

  if (city && typeof city === "object") {
    return String(city.formatted || city.cityName || "").trim();
  }

  return String(data.cityKey || data.cityName || city || "").trim();
}

function readMasterName(data: PublicCardRecord): string {
  return String(
    data.masterName || data.businessName || data.masterSlug || "Beauty Professional"
  ).trim();
}

function readRating(data: PublicCardRecord): number | null {
  return typeof data.rating === "number" ? data.rating : null;
}

function readReviewCount(data: PublicCardRecord): number | null {
  const candidates = [data.reviewCount, data.reviewsCount, data.totalReviews];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readImage(data: PublicCardRecord): string | null {
  const photos = normalizePhotos(
    (Array.isArray(data.photos)
      ? data.photos
      : Array.isArray(data.images)
        ? data.images
        : []) as Parameters<typeof normalizePhotos>[0]
  );

  return photos.find((url) => url.startsWith("http")) ?? null;
}

function buildTitle(masterName: string, city: string): string {
  if (city) {
    return `${masterName} Reviews in ${city} | ${SITE}`;
  }
  return `${masterName} | ${SITE}`;
}

function buildDescription(
  masterName: string,
  city: string,
  services: string[],
  rating: number | null,
  reviewCount: number | null
): string {
  const base = `Read real client reviews, services, photos, and details for ${masterName} on ${SITE}.`;

  if (
    city &&
    rating != null &&
    reviewCount != null &&
    reviewCount > 0
  ) {
    return trimToMaxLength(
      `Read real client reviews for ${masterName} in ${city}. Rated ${rating.toFixed(1)} from ${reviewCount} review${reviewCount === 1 ? "" : "s"} on ${SITE}.`,
      MAX_DESCRIPTION_LENGTH
    );
  }

  if (city) {
    return trimToMaxLength(
      `Read real client reviews, services, photos, and details for ${masterName} in ${city} on ${SITE}.`,
      MAX_DESCRIPTION_LENGTH
    );
  }

  if (rating != null && reviewCount != null && reviewCount > 0) {
    return trimToMaxLength(
      `Read real client reviews for ${masterName}. Rated ${rating.toFixed(1)} from ${reviewCount} review${reviewCount === 1 ? "" : "s"} on ${SITE}.`,
      MAX_DESCRIPTION_LENGTH
    );
  }

  if (services.length > 0) {
    const serviceText = services.slice(0, 2).join(", ");
    return trimToMaxLength(
      `Read real client reviews for ${masterName}. Services include ${serviceText}. View photos and details on ${SITE}.`,
      MAX_DESCRIPTION_LENGTH
    );
  }

  return trimToMaxLength(base, MAX_DESCRIPTION_LENGTH);
}

export async function buildReviewtyPageMetadata(
  slug: string
): Promise<Metadata> {
  const canonical = `${BASE_URL}/reviewty/${slug}`;

  try {
    const cardData = await loadPublicCard(slug);

    if (!cardData) {
      const fallbackTitle = `Reviewty | ${SITE}`;
      const fallbackDescription = `Read real client reviews, services, photos, and beauty professional details on ${SITE}.`;

      return {
        title: { absolute: fallbackTitle },
        description: fallbackDescription,
        alternates: { canonical },
        openGraph: {
          type: "profile",
          title: fallbackTitle,
          description: fallbackDescription,
          url: canonical,
        },
      };
    }

    const masterName = readMasterName(cardData);
    const city = readCity(cardData);
    const services = readServices(cardData);
    const rating = readRating(cardData);
    const reviewCount = readReviewCount(cardData);
    const image = readImage(cardData);
    const title = buildTitle(masterName, city);
    const description = buildDescription(
      masterName,
      city,
      services,
      rating,
      reviewCount
    );

    const openGraph: NonNullable<Metadata["openGraph"]> = {
      type: "profile",
      title,
      description,
      url: canonical,
    };

    if (image) {
      openGraph.images = [{ url: image }];
    }

    return {
      title: { absolute: title },
      description,
      alternates: { canonical },
      openGraph,
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch (error) {
    console.warn("[reviewty/[slug]] Failed to build metadata:", error);

    const fallbackTitle = `Reviewty | ${SITE}`;
    const fallbackDescription = `Read real client reviews, services, photos, and beauty professional details on ${SITE}.`;

    return {
      title: { absolute: fallbackTitle },
      description: fallbackDescription,
      alternates: { canonical },
      openGraph: {
        type: "profile",
        title: fallbackTitle,
        description: fallbackDescription,
        url: canonical,
      },
    };
  }
}
