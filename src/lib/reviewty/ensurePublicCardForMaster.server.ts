import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmins";
import {
  buildMasterPublicCardId,
  slugifyCityKey,
  slugifyMasterName,
} from "@/lib/reviewty/publicCardIds";

export type EnsurePublicCardServerInput = {
  masterId: string;
  masterName: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  profileId?: string;
  reviewId: string;
  rating: number;
  text: string;
  photos?: Array<{ url: string; path?: string }>;
  authorUid: string;
  authorName: string;
};

export type SyncMasterPublicCardInput = {
  masterId: string;
  masterName?: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  profileId?: string;
};

function buildCityObject(cityLabel: string, cityKey: string) {
  const label = cityLabel.trim() || "Unknown";
  return {
    city: label,
    cityKey,
    cityName: label,
    formatted: label,
    slug: cityKey,
  };
}

function buildCardPayload(
  input: SyncMasterPublicCardInput & {
    cardId: string;
    authorUid?: string;
    rating?: number;
    isNew: boolean;
  }
) {
  const masterName = String(input.masterName || "Master").trim();
  const cityLabel = String(input.masterCity || "").trim();
  const cityKey = slugifyCityKey(cityLabel || "unknown");
  const now = Timestamp.now();

  return {
    payload: {
      type: "master-profile",
      masterId: input.masterId,
      masterUid: input.masterId,
      profileId: input.profileId || input.masterId,
      masterName,
      masterSlug: input.cardId,
      slug: input.cardId,
      threadKey: input.cardId,
      cityKey,
      cityName: cityLabel || "Unknown",
      city: buildCityObject(cityLabel, cityKey),
      serviceNames: input.masterServices || [],
      languageNames: input.masterLanguages || [],
      rating: input.rating ?? 5,
      updatedAt: now,
      ...(input.isNew
        ? {
            createdAt: now,
            createdByUid: input.authorUid || input.masterId,
          }
        : {}),
    },
    now,
  };
}

/** Ensure publicCards/master_{masterId} exists and sync unlinked master reviews. */
export async function syncMasterPublicCard(
  input: SyncMasterPublicCardInput
): Promise<string> {
  const db = getAdminDb();
  const masterId = String(input.masterId).trim();
  const cardId = buildMasterPublicCardId(masterId);
  const cardRef = db.collection("publicCards").doc(cardId);
  const cardSnap = await cardRef.get();

  const reviewsSnap = await db
    .collection("reviews")
    .where("masterId", "==", masterId)
    .limit(100)
    .get();

  const subjectSnap = await db
    .collection("reviews")
    .where("subjectId", "==", masterId)
    .limit(100)
    .get();

  const reviewDocs = new Map<string, QueryDocumentSnapshot>();
  reviewsSnap.docs.forEach((d) => reviewDocs.set(d.id, d));
  subjectSnap.docs.forEach((d) => reviewDocs.set(d.id, d));

  let seedReview = reviewDocs.values().next().value?.data();

  const { payload, now } = buildCardPayload({
    ...input,
    cardId,
    masterName:
      input.masterName ||
      String(seedReview?.masterName || seedReview?.masterDisplay || "Master"),
    masterCity:
      input.masterCity ||
      String(seedReview?.masterCity || seedReview?.cityName || ""),
    masterServices:
      input.masterServices ||
      (Array.isArray(seedReview?.masterServices)
        ? (seedReview?.masterServices as string[])
        : []),
    masterLanguages:
      input.masterLanguages ||
      (Array.isArray(seedReview?.masterLanguages)
        ? (seedReview?.masterLanguages as string[])
        : []),
    rating: Number(seedReview?.rating) || 5,
    authorUid: String(seedReview?.authorUid || masterId),
    isNew: !cardSnap.exists,
  });

  await cardRef.set(payload, { merge: true });

  for (const reviewDoc of reviewDocs.values()) {
    const data = reviewDoc.data();
    const publicCardId = data.publicCardId
      ? String(data.publicCardId).trim()
      : "";

    await reviewDoc.ref.set(
      {
        publicCardId: cardId,
        publicCardSlug: cardId,
        threadKey: cardId,
      },
      { merge: true }
    );

    if (publicCardId === cardId) continue;

    const photoUrls = Array.isArray(data.photos)
      ? data.photos
          .map((p: { url?: string } | string) =>
            typeof p === "string" ? p : p?.url
          )
          .filter(Boolean)
      : [];

    await db.collection("publicReviews").add({
      publicCardSlug: cardId,
      rating: Number(data.rating) || 5,
      text: String(data.text || data.body || ""),
      photos: photoUrls,
      authorUid: data.authorUid || null,
      authorName: data.authorName || "Verified client",
      createdAt: data.createdAt || now,
    });
  }

  return cardId;
}

/** Server-side: create/link publicCards + mirror one review to publicReviews. */
export async function ensurePublicCardForMasterServer(
  input: EnsurePublicCardServerInput,
  options: { mirrorReview?: boolean } = {}
): Promise<string> {
  const { mirrorReview = true } = options;
  const cardId = await syncMasterPublicCard({
    masterId: input.masterId,
    masterName: input.masterName,
    masterCity: input.masterCity,
    masterServices: input.masterServices,
    masterLanguages: input.masterLanguages,
    profileId: input.profileId,
  });

  if (!mirrorReview) {
    return cardId;
  }

  const db = getAdminDb();
  const reviewSnap = await db.collection("reviews").doc(input.reviewId).get();
  const existingPublicCardId = reviewSnap.exists
    ? String(reviewSnap.data()?.publicCardId || "").trim()
    : "";

  if (existingPublicCardId === cardId) {
    return cardId;
  }

  const photoUrls = (input.photos || [])
    .map((p) => p.url)
    .filter(Boolean);

  await db.collection("publicReviews").add({
    publicCardSlug: cardId,
    rating: input.rating,
    text: input.text,
    photos: photoUrls,
    authorUid: input.authorUid,
    authorName: input.authorName,
    createdAt: Timestamp.now(),
  });

  return cardId;
}
