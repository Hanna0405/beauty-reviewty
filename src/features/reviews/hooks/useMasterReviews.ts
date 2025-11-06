'use client';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const isServer = typeof window === "undefined";

type R = { id: string; target?: 'listing'|'master'|'public'; masterId?: string|null; createdAt?: any; [k: string]: any };

export function useMasterReviews(masterId: string) {
  const [a, setA] = useState<R[]>([]); // listing-target
  const [b, setB] = useState<R[]>([]); // master-target

  useEffect(() => {
    if (isServer) return; // do not run firestore on server
    if (!db) return;

    const col = collection(db, 'reviews');
    const q1 = query(col,
      where('masterId','==', masterId),
      where('target','==','listing'),
      orderBy('createdAt','desc')
    );
    const q2 = query(col,
      where('masterId','==', masterId),
      where('target','==','master'),
      orderBy('createdAt','desc')
    );
    const u1 = onSnapshot(q1, s => setA(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
    const u2 = onSnapshot(q2, s => setB(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
    return () => { u1(); u2(); };
  }, [masterId, db]);

  const reviews = useMemo(() => {
    const m = [...a, ...b];
    return m.sort((x,y) => (y.createdAt?.toMillis?.() ?? 0) - (x.createdAt?.toMillis?.() ?? 0));
  }, [a,b]);

  return { reviews, counts: { listing: a.length, master: b.length, total: a.length + b.length } };
}
