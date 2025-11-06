import { getFirebaseDb } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export async function getListingPreviewPhoto(
  listingId: string
): Promise<string | null> {
  const db = getFirebaseDb();

  if (!db) {
    console.warn("[Firestore] getFirebaseDb() returned null (likely server-side build). Returning empty result.");
    return null;
  }

  try {
    const listingDoc = await getDoc(doc(db, "listings", listingId));

    if (!listingDoc.exists()) {
      return null;
    }

    const data = listingDoc.data();

    // Try different possible photo fields
    if (data.coverPhoto) return data.coverPhoto;
    if (data.previewPhoto) return data.previewPhoto;
    if (data.photo) return data.photo;
    if (Array.isArray(data.photos) && data.photos.length > 0) {
      // Handle both string arrays and object arrays
      const firstPhoto = data.photos[0];
      return typeof firstPhoto === "string"
        ? firstPhoto
        : firstPhoto?.url || null;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch listing preview photo:", error);
    return null;
  }
}
