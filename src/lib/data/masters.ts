'use client';
import { db } from '@/lib/firebase.client';
import { collection, getDocs } from 'firebase/firestore';
import { normalizeMasters } from '@/lib/normalizeMaster';
import { Master } from '@/types/master';

export async function fetchPublicMasters(): Promise<Master[]> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firestore is not initialized. Returning empty masters list.");
    }
    return [];
  }
  
  const colRef = collection(db, 'listings'); // Using listings collection as per existing code
  const snap = await getDocs(colRef);

  const raw: any[] = [];
  snap.forEach(doc => raw.push({ id: doc.id, ...doc.data() }));

  const normalized = normalizeMasters(raw)
    .filter(m => m.isPublished !== false);

  return normalized;
}
