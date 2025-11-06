import { getFirebaseDb } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

export type ListingData = {
  listingId: string;
  name: string;
  city: string;
  mainPhoto: string | null;
  services: string[];
  href: string;
};

export async function getFeaturedListings(
  limitCount: number
): Promise<ListingData[]> {
  const db = getFirebaseDb();

  // safety guard for build / SSR
  if (!db) {
    console.warn("[getFeaturedListings] Firestore not initialized (server-side build). Returning empty list.");
    return [];
  }

  try {
    const q = query(
      collection(db, "listings"),
      where("status", "==", "active"),
      orderBy("displayName"),
      limit(limitCount)
    );

    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
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

      // Extract main photo - prefer coverPhoto/previewPhoto, fallback to first photos array item
      let mainPhoto: string | null = null;
      if (data.coverPhoto) mainPhoto = data.coverPhoto;
      else if (data.previewPhoto) mainPhoto = data.previewPhoto;
      else if (data.photo) mainPhoto = data.photo;
      else if (Array.isArray(data.photos) && data.photos.length > 0) {
        const firstPhoto = data.photos[0];
        mainPhoto =
          typeof firstPhoto === "string" ? firstPhoto : firstPhoto?.url || null;
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

      return {
        listingId: doc.id,
        name,
        city,
        mainPhoto,
        services: services.filter(Boolean),
        href: `/masters/${doc.id}`,
      };
    });
  } catch (error) {
    console.error("Failed to fetch featured listings:", error);
    return [];
  }
}
