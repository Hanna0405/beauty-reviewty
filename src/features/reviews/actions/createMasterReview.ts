import { db } from '@/lib/firebase/client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { MasterReviewPayload } from '@/features/reviews/types';

export type CreateMasterReviewInput = Omit<MasterReviewPayload, 'target' | 'createdAt'>;

export async function createMasterReview(input: CreateMasterReviewInput) {
  const payload: MasterReviewPayload = {
    target: 'master',
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
