import { getFirebaseDb } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
} from "firebase/firestore";
import {
  pickFirstImage,
  ratingValue,
  reviewsCountValue,
  type ListingLike,
} from "@/lib/listings/presenters";

export type ListingData = {
  listingId: string;
  name: string;
  city: string;
  mainPhoto: string | null;
  services: string[];
  href: string;
  /** From same listing doc fields already loaded (ratingAvg, reviewsCount, etc.) */
  reviewCount: number;
  ratingAvg: number | null;
  /** Millis from existing doc timestamps (hero ordering only) */
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

function isFirestoreDb(value: unknown): value is Firestore {
  return !!value && typeof value === "object" && "_databaseId" in (value as Record<string, unknown>);
}

function readTimestampMs(data: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = data[key];
    if (v == null) continue;
    if (
      typeof v === "object" &&
      v !== null &&
      "toMillis" in v &&
      typeof (v as { toMillis: () => number }).toMillis === "function"
    ) {
      return (v as { toMillis: () => number }).toMillis();
    }
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export async function getFeaturedListings(
  limitCount: number
): Promise<ListingData[]> {
  const db = getFirebaseDb();

  // safety guard for build / SSR
  if (!isFirestoreDb(db)) {
    console.warn("[getFeaturedListings] Firestore DB unavailable. Returning empty list.");
    return [];
  }

  try {
    const base = collection(db, "listings");
    const constraintsNewest = [
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ] as const;

    let snap;
    try {
      snap = await getDocs(query(base, ...constraintsNewest));
    } catch (primaryErr) {
      console.warn(
        "[getFeaturedListings] createdAt query unavailable; falling back to displayName:",
        primaryErr
      );
      snap = await getDocs(
        query(base, where("status", "==", "active"), orderBy("displayName"), limit(limitCount))
      );
    }

    const rows = snap.docs.map((doc) => {
      const data = doc.data();

      // Extract name from various possible fields (reuse existing pattern from Masters directory)
      const name =
        data.displayName ||
        data.businessName ||
        data.masterName ||
        data.title ||
        "Beauty master";

      // Extract city using our CityAutocomplete pattern with mirrors
      const city =
        data.cityName ||
        data.city?.formatted ||
        data.city?.cityName ||
        data.city ||
        "";

      const raw = data as ListingLike;

      // Image URLs — align with FeaturedMastersRow / listing cards (same doc fields, http(s) only)
      let mainPhoto: string | null = pickFirstImage(raw);
      if (!mainPhoto) {
        const candidates = [
          data.coverUrl,
          data.imageUrl,
          data.photoUrl,
          data.coverPhoto,
          data.previewPhoto,
          data.photo,
        ];
        for (const c of candidates) {
          if (typeof c === "string" && c.startsWith("http")) {
            mainPhoto = c;
            break;
          }
        }
      }
      if (!mainPhoto && Array.isArray(data.photos) && data.photos.length > 0) {
        const firstPhoto = data.photos[0];
        const u =
          typeof firstPhoto === "string"
            ? firstPhoto
            : firstPhoto?.url || firstPhoto?.downloadURL || firstPhoto?.src || null;
        if (typeof u === "string" && u.startsWith("http")) mainPhoto = u;
      }

      // Extract services using our unified Services pattern - get first 2 human-readable names
      let services: string[] = [];
      if (Array.isArray(data.serviceNames) && data.serviceNames.length > 0) {
        services = data.serviceNames.slice(0, 2);
      } else if (Array.isArray(data.services)) {
        services = data.services
          .map((s) => (typeof s === "string" ? s : s?.name || s?.key || ""))
          .slice(0, 2);
      } else if (Array.isArray(data.serviceKeys)) {
        services = data.serviceKeys.slice(0, 2);
      }

      const reviewCount = reviewsCountValue(raw);
      const ratingAvg = ratingValue(raw);

      const createdAtMs = readTimestampMs(data as Record<string, unknown>, [
        "createdAt",
        "created_at",
      ]);
      const updatedAtMs = readTimestampMs(data as Record<string, unknown>, [
        "updatedAt",
        "updated_at",
      ]);

      return {
        listingId: doc.id,
        name,
        city,
        mainPhoto,
        services: services.filter(Boolean),
        href: `/masters/${doc.id}`,
        reviewCount,
        ratingAvg,
        createdAtMs,
        updatedAtMs,
      };
    });

    rows.sort((a, b) => {
      const ca = a.createdAtMs;
      const cb = b.createdAtMs;
      if (ca != null && cb != null && ca !== cb) return cb - ca;
      if (ca != null && cb == null) return -1;
      if (ca == null && cb != null) return 1;
      const ua = a.updatedAtMs;
      const ub = b.updatedAtMs;
      if (ua != null && ub != null && ua !== ub) return ub - ua;
      if (ua != null && ub == null) return -1;
      if (ua == null && ub != null) return 1;
      return 0;
    });

    return rows;
  } catch (error) {
    console.warn("Failed to fetch featured listings:", error);
    return [];
  }
}
