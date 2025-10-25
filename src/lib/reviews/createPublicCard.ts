import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { buildPublicThreadKey } from './threadKey';
import { db } from '@/lib/firebase.client';

export async function createPublicCardAndReview(...args: any[]) {
  throw new Error('[BR-DEPRECATED] Do not use src/lib/reviews/createPublicCard.ts. Use createPublicCardAndReview_BR from src/lib/createPublicReview.ts');
}
