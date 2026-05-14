import { getFirebaseDb } from "@/lib/firebase/client";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";

export type ReviewData = {
  reviewId: string;
  text?: string;
  rating?: number;
  photos?: string[];
  listingId?: string;
  masterId?: string;
  createdAt?: any;
};

export async function getLatestReviews(
  limitCount: number
): Promise<ReviewData[]> {
  const db = getFirebaseDb();

  if (!db) {
    console.warn("[Firestore] getFirebaseDb() returned null (likely server-side build). Returning empty result.");
    return [];
  }

  try {
    const q = query(
      collection(db, "reviews"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snap = await getDocs(q);

    return snap.docs.map(
      (doc) =>
        ({
          reviewId: doc.id,
          ...doc.data(),
        } as ReviewData)
    );
  } catch (error) {
    console.error("Failed to fetch latest reviews:", error);
    return [];
  }
}
