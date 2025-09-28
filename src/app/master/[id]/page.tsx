'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import Image from 'next/image';
import Link from 'next/link';
import { SafeText } from '@/lib/safeText';

type Master = {
  displayName?: string;
  city?: any;
  services?: string[];
  languages?: string[];
  avatarUrl?: string;
  rating?: number;
  geo?: {lat:number; lng:number};
};

export default function MasterPublicPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'masters', id));
        if (alive) setData(snap.exists() ? (snap.data() as Master) : null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="mx-auto max-w-3xl p-6">Loading…</div>;
  if (!data) return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-xl font-semibold">Master not found</h1>
      <p className="text-gray-600">This profile doesn't exist or is private.</p>
      <Link href="/masters" className="mt-4 inline-block rounded-md border px-3 py-2 text-sm">← Back to Masters</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link href="/masters" className="mb-4 inline-block text-sm underline">← Back to Masters</Link>
      <div className="flex gap-4 rounded-lg border p-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border">
          {data.avatarUrl ? (
            <Image src={data.avatarUrl} alt={data.displayName ?? 'Master'} fill className="object-cover" />
          ) : <div className="flex h-full w-full items-center justify-center text-xs">No photo</div>}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{data.displayName ?? 'Master'}</h1>
          <div className="text-sm text-gray-600"><SafeText value={data.cityName ?? data?.city?.name ?? data?.city} /></div>
          <div className="mt-1 text-sm"><SafeText value={data.serviceNames ?? data.services} /></div>
          <div className="text-xs text-gray-500"><SafeText value={data.languageNames ?? data.languages} /></div>
          {typeof data.rating === 'number' && <div className="mt-1 text-sm">Rating: {data.rating}★</div>}
        </div>
      </div>
    </div>
  );
}
