'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';

export default function ListingPublicPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (alive) setData(snap.exists() ? snap.data() : null);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="mx-auto max-w-3xl p-6">Loading…</div>;
  if (!data) return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-xl font-semibold">Listing not found</h1>
      <Link href="/listings" className="mt-4 inline-block rounded-md border px-3 py-2 text-sm">← Back to Listings</Link>
    </div>
  );

  const cover = data?.photos?.[0]?.url ?? null;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link href="/listings" className="mb-4 inline-block text-sm underline">← Back to Listings</Link>
      <div className="rounded-lg border p-4">
        <h1 className="text-xl font-semibold">{data.title ?? 'Listing'}</h1>
        <div className="text-sm text-gray-600">{data?.city?.name ?? data?.city ?? ''}</div>
        {cover && (
          <div className="relative mt-3 h-56 w-full overflow-hidden rounded-md border">
            <Image src={cover} alt={data.title ?? 'Listing'} fill className="object-cover" />
          </div>
        )}
        <div className="mt-2 text-sm">{(data.services ?? []).join(' • ')}</div>
        <div className="text-xs text-gray-500">{(data.languages ?? []).join(', ')}</div>
        {typeof data.rating === 'number' && <div className="mt-1 text-sm">Rating: {data.rating}★</div>}
      </div>
    </div>
  );
}
