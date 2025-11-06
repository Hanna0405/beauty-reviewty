'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase/client';
import {
  collection, query, where, onSnapshot, orderBy, Timestamp, getFirestore,
} from 'firebase/firestore';

const isServer = typeof window === "undefined";

export type Review = {
  id: string;
  masterId?: string | null;
  masterName?: string;
  cityKey?: string | null;
  rating: number;
  text: string;
  photos?: string[];
  isPublic?: boolean;
  createdAt?: Timestamp;
};

type Filters = {
  cityKey?: string | null;
  serviceKeys?: string[]; // keep for future if needed
  languageKeys?: string[]; // keep for future
};

export function useReviews(filters: Filters = {}) {
  const [attached, setAttached] = useState<Review[]>([]);
  const [publicOnes, setPublicOnes] = useState<Review[]>([]);
  const { cityKey } = filters;

  useEffect(() => {
    if (isServer) return; // do not run firestore on server
    if (!db) return;

    const col = collection(db, 'reviews');

    // 1) Reviews attached to a real master (masterId present)
    const q1 = cityKey
      ? query(col, where('masterId', '!=', null), where('cityKey', '==', cityKey), orderBy('masterId'), orderBy('createdAt','desc'))
      : query(col, where('masterId', '!=', null), orderBy('masterId'), orderBy('createdAt','desc'));

    const unsub1 = onSnapshot(q1, (snap) => {
      const rows: Review[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setAttached(rows);
    });

    // 2) Public cards (no masterId, isPublic == true)
    const q2 = cityKey
      ? query(col, where('isPublic', '==', true), where('cityKey', '==', cityKey), orderBy('createdAt','desc'))
      : query(col, where('isPublic', '==', true), orderBy('createdAt','desc'));

    const unsub2 = onSnapshot(q2, (snap) => {
      const rows: Review[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setPublicOnes(rows);
    });

    return () => { unsub1(); unsub2(); };
  }, [cityKey, db]);

  const all = useMemo(() => {
    // Merge and sort by createdAt desc
    const merged = [...attached, ...publicOnes];
    return merged.sort((a, b) => {
      const ta = (a.createdAt as any)?.toMillis?.() ?? 0;
      const tb = (b.createdAt as any)?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }, [attached, publicOnes]);

  return { reviews: all, counts: { total: all.length, attached: attached.length, public: publicOnes.length } };
}
