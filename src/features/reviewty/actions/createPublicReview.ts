import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { makeThreadKeyFromCard } from "@/lib/threading";
import type { PublicReviewPayload } from "@/features/reviews/types";

// local slugify helper (mirrors our usage in AddPublicCardForm)
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function buildPublicThreadKey(cityKey: string, masterName: string) {
  const ck = (cityKey || "").trim().toLowerCase();
  const ms = (masterName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
  if (!ck || !ms)
    throw new Error(
      "[public-card] Missing cityKey or masterName for threadKey"
    );
  return `pc_${ck}_${ms}`;
}

export type CreatePublicReviewInput = Omit<
  PublicReviewPayload,
  "createdAt" | "isPublic" | "target"
> & {
  publicCardId?: string | null;
  threadKey?: string;
};

type PublicReviewInput = {
  masterName?: string;
  city?: any;
  cityKey?: string;
  threadKey?: string;
  serviceKeys?: string[];
  serviceNames?: string[];
  languageKeys?: string[];
  languageNames?: string[];
  rating?: number;
  text?: string;
  photos?: string[];
};

function compactObject<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as T;
}

export async function createPublicReview(input: CreatePublicReviewInput) {
  const {
    mode,
    masterName,
    cityKey,
    rating,
    text,
    serviceKeys = [],
    languageKeys = [],
    photos = [],
  } = input;

  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error("[public-card] Not authenticated");

  if (mode === "public-card") {
    const threadKey = buildPublicThreadKey(cityKey, masterName);
    const cardId = threadKey; // keep id == threadKey for consistency
    const cardRef = doc(collection(db, "publicCards"), cardId);
    console.log("[CreatePublicCard] about to write", {
      cardPath: cardRef.path,
      threadKey,
      cityKey,
      masterName,
    });

    // Best-effort: try to create the card, but DO NOT block review creation
    try {
      await setDoc(
        cardRef,
        {
          createdByUid: uid,
          type: "public-card",
          cityKey,
          masterName,
          masterSlug: masterName, // keep simple; can refine later
          threadKey,
          serviceKeys,
          languageKeys,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("[CreatePublicCard] card saved");
    } catch (e) {
      console.warn(
        "[CreatePublicCard] card save failed but continue with review",
        e
      );
    }

    // Always create the public review
    const reviewPayload = {
      isPublic: true,
      threadKey,
      rating,
      text,
      authorUid: uid,
      serviceKeys,
      languageKeys,
      photosCount: photos.length || 0,
      createdAt: serverTimestamp(),
    };
    console.log("[CreatePublicCard] add /reviews", reviewPayload);
    const reviewRef = await addDoc(collection(db, "reviews"), {
      ...reviewPayload,
    });
    return { reviewId: reviewRef.id, threadKey, cardId };
  }

  // ...existing-master branch unchanged...
  // Derive safe cityKey and masterSlug
  const cityObj = input.city ?? null;
  const cityKeyResolved =
    input.cityKey ||
    (cityObj?.slug as string) ||
    (cityObj?.city?.slug as string) ||
    (cityObj?.placeId as string) ||
    (cityObj?.formatted ? slugify(cityObj.formatted) : "");

  const masterNameInput = (input.masterName ?? "").toString().trim();
  const masterSlug = slugify(masterNameInput || "");

  // Robust threadKey: never undefined
  const safeThreadKey =
    input.threadKey && input.threadKey.length > 0
      ? input.threadKey
      : makeThreadKeyFromCard({ cityKey: cityKeyResolved, masterSlug });

  // Build raw payload (timestamps always set on the server)
  const rawPayload = {
    type: "public",
    threadKey: safeThreadKey,
    masterName: masterNameInput,
    city: cityObj,
    cityKey: cityKeyResolved,
    cityName: cityObj?.formatted ?? cityObj?.city?.formatted,
    serviceKeys: input.serviceKeys ?? [],
    serviceNames: input.serviceNames ?? [],
    languageKeys: input.languageKeys ?? [],
    languageNames: input.languageNames ?? [],
    rating: input.rating,
    text: input.text,
    photos: Array.isArray(input.photos) ? input.photos : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const payload = compactObject(rawPayload);

  // Debug (optional)
  console.log(
    "[createPublicReview] cityKey:",
    cityKeyResolved,
    "masterSlug:",
    masterSlug,
    "threadKey:",
    payload.threadKey
  );

  const docRef = await addDoc(collection(db, "reviews"), payload);
  return { id: docRef.id, threadKey: payload.threadKey };
}
