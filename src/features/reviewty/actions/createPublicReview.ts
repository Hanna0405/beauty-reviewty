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
  serviceKeys?: string[];
  languageKeys?: string[];
  photos?: string[];
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

  // Create public card and review
  const threadKey = buildPublicThreadKey(cityKey || "", masterName || "");
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
