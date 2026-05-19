import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import type { ReviewPhoto } from "@/lib/reviews/types";
import type { MasterSearchOption } from "@/lib/reviewty/masterSearchOptions";

const REVIEWS_COLLECTION = "reviews";

export type SaveExistingMasterReviewInput = {
  selectedMaster: MasterSearchOption;
  rating: number;
  text: string;
  photos: ReviewPhoto[];
  authorUid: string;
  authorName: string;
};

/**
 * Save an existing-master review to the root `reviews` collection (client SDK).
 * Same collection used by /reviewty feed, master profile, and /masters aggregation.
 */
export async function saveExistingMasterReview(
  input: SaveExistingMasterReviewInput
): Promise<string> {
  const { selectedMaster, rating, text, photos, authorUid, authorName } = input;

  const masterId = String(selectedMaster.id).trim();
  const masterName = String(selectedMaster.title || "Master").trim();
  const reviewText = String(text || "").trim();
  const numericRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));

  const payload = {
    masterId,
    masterName,
    masterDisplay: masterName,
    subject: { type: "master" as const, id: masterId },
    subjectType: "master",
    subjectId: masterId,
    profileId: selectedMaster.profileId || masterId,
    rating: numericRating,
    text: reviewText,
    body: reviewText,
    photos: Array.isArray(photos) ? photos : [],
    authorUid,
    authorName: authorName || "Verified client",
    masterRef: { type: "master", id: masterId },
    masterCity: selectedMaster.city || "",
    masterServices: selectedMaster.services || [],
    source: "existing-master",
    status: "approved",
    createdAt: serverTimestamp(),
  };

  console.log("[Reviewty] saveExistingMasterReview — before write", {
    selectedMasterId: selectedMaster.id,
    selectedMasterUid: selectedMaster.uid,
    selectedMasterProfileId: selectedMaster.profileId,
    selectedMasterName: masterName,
    collection: REVIEWS_COLLECTION,
    payload,
  });

  const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), payload);

  console.log("[Reviewty] saveExistingMasterReview — saved", {
    reviewId: docRef.id,
    masterId,
    collection: REVIEWS_COLLECTION,
  });

  void triggerReviewNotificationEmail({
    masterUid: String(selectedMaster.uid || masterId).trim(),
    profilePathId: String(selectedMaster.profileId || masterId).trim(),
    masterName,
    rating: numericRating,
    text: reviewText,
  });

  return docRef.id;
}

async function triggerReviewNotificationEmail(input: {
  masterUid: string;
  profilePathId: string;
  masterName: string;
  rating: number;
  text: string;
}): Promise<void> {
  try {
    const user = getAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    await fetch("/api/reviews/notify-master", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
  } catch {
    // Best-effort; review is already saved
  }
}
