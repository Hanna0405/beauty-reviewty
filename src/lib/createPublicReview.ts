import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildMasterDisplay } from "@/lib/masterDisplay";

type CreatePublicReviewInput = {
  publicId: string; // use the reviewId
  masterId: string;
  rating: number;
  text: string;
  photos: Array<{url: string; path: string; w?: number; h?: number}>;
  authorUid: string;
  authorName?: string | null;
};

export async function createPublicReview(input: CreatePublicReviewInput) {
  const { publicId, masterId, rating, text, photos, authorUid, authorName } = input;

  // 1) Load the master to denormalize fields used on /reviewty
  const mSnap = await getDoc(doc(db, "masters", masterId));
  const m = mSnap.exists() ? (mSnap.data() as any) : {};

  const { display, keywords } = buildMasterDisplay({
    displayName: m.displayName,
    firstName: m.firstName,
    lastName: m.lastName,
    nickname: m.nickname,
    phone: m.phone,
    city: m.city,
    services: m.services,
    languages: m.languages,
  });

  // 2) Create/merge the public doc. IMPORTANT: must have createdAt to pass the query.
  await setDoc(
    doc(db, "publicReviews", publicId),
    {
      masterId,
      rating,
      text,
      photos,
      authorUid,
      authorName: authorName ?? null,

      // denormalized fields for filters
      masterCity: m.city || null,
      masterServices: Array.isArray(m.services) ? m.services : [],
      masterLanguages: Array.isArray(m.languages) ? m.languages : [],
      masterDisplay: display,
      masterKeywords: keywords,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
