// src/app/reviewty/_utils/reviewtyQueries.ts
// Firestore helpers specific to Reviewty functionality

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmins";

export type ReviewDoc = {
  id: string;
  masterName?: string;
  masterDisplay?: string;
  cityName?: string;
  serviceName?: string;
  rating?: number;
  text?: string;
  photos?: { url: string; path?: string }[];
  createdAt?: any;
  masterRef?: {
    type: "listing" | "community";
    id: string;
    slug?: string;
  };
  masterId?: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  masterKeywords?: string[];
  masterSlug?: string;
  masterPublic?: {
    displayName: string;
    city: {
      city: string;
      state?: string;
      stateCode?: string;
      country: string;
      countryCode: string;
      formatted: string;
      lat: number;
      lng: number;
      placeId: string;
      slug: string;
    };
    services: { key: string; name: string; emoji: string }[];
    languages: { key: string; name: string; emoji: string }[];
  };
};

export type ReviewFilters = {
  city?: string;
  services?: string[];
  languages?: string[];
  ratingGte?: number;
  personQuery?: string;
};

/**
 * Get reviews with optional filtering
 */
export async function getReviews(
  filters: ReviewFilters = {},
  limitCount = 20
): Promise<ReviewDoc[]> {
  try {
    const db = getAdminDb();
    let q: any = db.collection("reviews");

    // Add filters (must come before orderBy in admin Firestore)
    if (filters.city) {
      q = q.where("masterCity", "==", filters.city);
    }
    if (filters.ratingGte) {
      q = q.where("rating", ">=", filters.ratingGte);
    }
    if (filters.services && filters.services.length > 0) {
      q = q.where("masterServices", "array-contains", filters.services[0]);
    }

    // orderBy and limit come after where clauses
    q = q.orderBy("createdAt", "desc").limit(limitCount);

    const snap = await q.get();

    const items: ReviewDoc[] = snap.docs.map((d: any) => {
      const data = d.data() as any;
      return {
        id: d.id,
        masterName: data.masterName || data.master?.name || "",
        masterDisplay: data.masterDisplay || data.master?.displayName || "",
        cityName: data.cityName || data.city?.formatted || "",
        serviceName: data.serviceName || data.service?.name || "",
        rating: data.rating ?? null,
        text: data.text || data.comment || "",
        photos: Array.isArray(data.photos)
          ? data.photos
          : Array.isArray(data.images)
          ? data.images
          : [],
        createdAt: data.createdAt || null,
        masterRef: data.masterRef,
        masterId: data.masterId,
        masterCity: data.masterCity,
        masterServices: data.masterServices,
        masterLanguages: data.masterLanguages,
        masterKeywords: data.masterKeywords,
        masterSlug: data.masterSlug,
        masterPublic: data.masterPublic,
      };
    });

    // Apply client-side filters
    let filtered = items;

    // Filter by languages (if not already applied in query)
    if (filters.languages && filters.languages.length > 0) {
      filtered = filtered.filter((review) => {
        if (!Array.isArray(review.masterLanguages)) return false;
        return filters.languages!.some((lang) =>
          review.masterLanguages?.includes(lang)
        );
      });
    }

    // Filter by person query
    if (filters.personQuery) {
      const query = filters.personQuery.toLowerCase();
      filtered = filtered.filter((review) => {
        const searchText = [
          review.masterName,
          review.masterDisplay,
          review.cityName,
          ...(review.masterKeywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchText.includes(query);
      });
    }

    return filtered;
  } catch (err) {
    console.error("[reviewtyQueries] failed to get reviews", err);
    return [];
  }
}

/**
 * Create a review for an existing master
 */
export async function createReviewForExistingMaster({
  masterId,
  masterData,
  rating,
  text,
  photos,
}: {
  masterId: string;
  masterData: any;
  rating: number;
  text: string;
  photos: { url: string; path: string }[];
}): Promise<string | null> {
  try {
    const docData = {
      // Master info (for filtering)
      masterId,
      masterDisplay:
        masterData.title || masterData.displayName || "Unknown master",
      masterCity: masterData.city?.formatted || "",
      masterServices: Array.isArray(masterData.services)
        ? masterData.services
        : [],
      masterLanguages: Array.isArray(masterData.languages)
        ? masterData.languages
        : [],
      masterKeywords: [
        masterData.title?.toLowerCase(),
        masterData.city?.formatted?.toLowerCase(),
        ...(Array.isArray(masterData.services)
          ? masterData.services.map((s: string) => s.toLowerCase())
          : []),
        ...(Array.isArray(masterData.languages)
          ? masterData.languages.map((l: string) => l.toLowerCase())
          : []),
      ].filter(Boolean),

      // Review content
      rating: Number(rating) || 0,
      text: text || "",
      photos,

      // Master reference
      masterRef: { type: "listing", id: masterId },

      // Housekeeping
      createdAt: FieldValue.serverTimestamp(),
      source: "existing-master",
    };

    const db = getAdminDb();
    const docRef = await db.collection("reviews").add(docData);
    return docRef.id;
  } catch (err) {
    console.error(
      "[reviewtyQueries] failed to create review for existing master",
      err
    );
    return null;
  }
}

/**
 * Create a review for a public master (new master not in system)
 */
export async function createReviewForPublicMaster({
  masterPublic,
  rating,
  text,
  photos,
}: {
  masterPublic: ReviewDoc["masterPublic"];
  rating: number;
  text: string;
  photos: { url: string; path: string }[];
}): Promise<string | null> {
  try {
    if (!masterPublic) {
      throw new Error("masterPublic is required");
    }

    const servicesArr = masterPublic.services.map((s) => s.key);
    const languagesArr = masterPublic.languages.map((l) => l.key);

    const docData = {
      // Master info (for filtering)
      masterDisplay: masterPublic.displayName,
      masterCity: masterPublic.city.formatted,
      masterServices: servicesArr,
      masterLanguages: languagesArr,
      masterKeywords: [
        masterPublic.displayName.toLowerCase(),
        masterPublic.city.formatted.toLowerCase(),
        ...servicesArr.map((s) => s.toLowerCase()),
        ...languagesArr.map((l) => l.toLowerCase()),
      ].filter(Boolean),

      // Review content
      rating: Number(rating) || 0,
      text: text || "",
      photos,

      // Public master data (nested object as specified)
      masterPublic,

      // Housekeeping
      createdAt: FieldValue.serverTimestamp(),
      source: "public-card",
    };

    const db = getAdminDb();
    const docRef = await db.collection("reviews").add(docData);
    return docRef.id;
  } catch (err) {
    console.error(
      "[reviewtyQueries] failed to create review for public master",
      err
    );
    return null;
  }
}
