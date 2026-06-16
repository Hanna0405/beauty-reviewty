import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  buildMasterPublicCardId,
  slugifyCityKey,
  slugifyMasterName,
} from "@/lib/reviewty/publicCardIds";

export type EnsurePublicCardClientInput = {
  masterId: string;
  masterName: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  profileId?: string;
  reviewId: string;
  rating: number;
  text: string;
  photos?: Array<{ url: string; path?: string } | string>;
  authorUid: string;
  authorName: string;
};

/** Create/link a publicCards doc for a registered master + mirror review to publicReviews. */
export async function ensurePublicCardForMasterClient(
  input: EnsurePublicCardClientInput
): Promise<string> {
  const cardId = buildMasterPublicCardId(input.masterId);
  const cardRef = doc(db, "publicCards", cardId);
  const cardSnap = await getDoc(cardRef);

  const masterSlug = slugifyMasterName(input.masterName);
  const cityKey = slugifyCityKey(input.masterCity || "unknown");
  const cityLabel = String(input.masterCity || "").trim();

  const cardPayload: Record<string, unknown> = {
    type: "master-profile",
    masterId: input.masterId,
    masterUid: input.masterId,
    profileId: input.profileId || input.masterId,
    masterName: input.masterName.trim(),
    masterSlug,
    threadKey: cardId,
    cityKey,
    cityName: cityLabel,
    ...(cityLabel
      ? { city: { formatted: cityLabel, cityKey, cityName: cityLabel } }
      : {}),
    serviceNames: input.masterServices || [],
    languageNames: input.masterLanguages || [],
    updatedAt: serverTimestamp(),
  };

  if (!cardSnap.exists()) {
    cardPayload.createdAt = serverTimestamp();
    cardPayload.createdByUid = input.authorUid;
  }

  await setDoc(cardRef, cardPayload, { merge: true });

  await updateDoc(doc(db, "reviews", input.reviewId), {
    publicCardId: cardId,
    publicCardSlug: cardId,
    threadKey: cardId,
  });

  const photoUrls = (input.photos || [])
    .map((p) => (typeof p === "string" ? p : p.url))
    .filter(Boolean);

  await addDoc(collection(db, "publicReviews"), {
    publicCardSlug: cardId,
    rating: input.rating,
    text: input.text,
    photos: photoUrls,
    authorUid: input.authorUid,
    authorName: input.authorName,
    createdAt: serverTimestamp(),
  });

  return cardId;
}
