import { db } from '@/lib/firebase/client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { ListingReviewPayload } from '@/features/reviews/types';

const isServer = typeof window === "undefined";

export type CreateListingReviewInput = Omit<ListingReviewPayload, 'target' | 'createdAt'>;

export async function createListingReview(input: CreateListingReviewInput) {
  if (isServer) {
    console.warn("[createListingReview] called on server. Skipping.");
    return null;
  }
  const payload: ListingReviewPayload = {
    target: 'listing',
    listingId: input.listingId,
    masterId: input.masterId,
    rating: input.rating,
    text: input.text,
    photos: input.photos ?? [],
    cityKey: input.cityKey ?? null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'reviews'), payload as any);
  return ref.id;
}
