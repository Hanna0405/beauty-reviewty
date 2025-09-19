'use client';

import React, { useEffect, useState } from 'react';
import ListingDetail from '@/components/listings/ListingDetail';

// Используй ту же инициализацию Firestore, что у тебя уже есть.
// В твоём проекте судя по импорту — '@/lib/firebase-client' экспортирует db.
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export default function ClientListing({ id }: { id: string }) {
  const [listing, setListing] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (!alive) return;
        setListing({ id, ...(snap.data() || {}) });
      } catch (e) {
        console.error('Failed to load listing', e);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (!listing) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  return <ListingDetail listing={listing} />;
}
