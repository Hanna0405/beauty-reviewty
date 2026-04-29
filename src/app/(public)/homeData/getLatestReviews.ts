import { getFirebaseDb } from "@/lib/firebase/client";
import { collection, getDocs, orderBy, limit, query, type Firestore } from "firebase/firestore";

export type ReviewData = {
  reviewId: string;
  text?: string;
  rating?: number;
  photos?: string[];
  listingId?: string;
  masterId?: string;
  createdAt?: any;
};

function isFirestoreDb(value: unknown): value is Firestore {
  return !!value && typeof value === "object" && "_databaseId" in (value as Record<string, unknown>);
}

export async function getLatestReviews(
  limitCount: number
): Promise<ReviewData[]> {
  const db = getFirebaseDb();

  if (!isFirestoreDb(db)) {
    console.warn("[Firestore] getLatestReviews: Firestore DB unavailable. Returning empty result.");
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
    console.warn("Failed to fetch latest reviews:", error);
    return [];
  }
}
