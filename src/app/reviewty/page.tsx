'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import Link from 'next/link';
import ReviewtyCreateModal from './ReviewtyCreateModal';

type ReviewDoc = {
  id: string;
  text: string;
  rating: number;
  photos?: { url: string; path: string }[];
  city?: string;
  services?: string[];
  createdAt?: any;
  masterRef?: { type: 'listing'|'community', id: string, slug?: string, listingId?: string };
};

const PAGE_SIZE = 12;

export default function ReviewtyPage() {
  const [city, setCity] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [only4, setOnly4] = useState<boolean>(false);

  const [items, setItems] = useState<ReviewDoc[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function fetchPage(reset = false) {
    if (loading || (done && !reset)) return;
    setLoading(true);
    try {
      // base query
      let q: any = query(collection(db, 'reviews'), where('isPublic','==', true), orderBy('createdAt','desc'), limit(PAGE_SIZE));
      // filters; (Firestore will suggest composite indexes; create them once)
      if (city) q = query(q, where('city','==', city));
      if (service) q = query(q, where('services','array-contains', service));

      const snap = await getDocs(reset ? query(q, limit(PAGE_SIZE)) : (cursor ? query(q, startAfter(cursor)) : q));
      const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ReviewDoc[];
      const last = snap.docs[snap.docs.length - 1] ?? null;

      // client-side rating 4+ filter (keeps index simple)
      const filtered = only4 ? docs.filter(d => (d.rating ?? 0) >= 4) : docs;

      setItems(reset ? filtered : [...items, ...filtered]);
      setCursor(last);
      setDone(snap.size < PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // refetch when filters change
    setCursor(null);
    setDone(false);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, service, only4]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">People's Reviews</h1>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('reviewty:openCreate'))}
          className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
        >Add review</button>
      </header>

      {/* Filters */}
      <div className="rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" className="rounded border p-2" />
        <input value={service} onChange={(e)=>setService(e.target.value)} placeholder="Service (e.g., hair-braids)" className="rounded border p-2" />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={only4} onChange={(e)=>setOnly4(e.target.checked)} />
          Rating 4+
        </label>
        <button onClick={()=>{ setCity(''); setService(''); setOnly4(false); }} className="ml-auto text-sm underline">Reset</button>
      </div>

      {/* Feed */}
      <ul className="grid md:grid-cols-2 gap-4">
        {items.map(r => (
          <li key={r.id} className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{'★'.repeat(Math.round(r.rating || 0))}</div>
              <div className="text-sm text-gray-500">{r.city || '—'}</div>
            </div>
            <p className="text-gray-800 line-clamp-4">{r.text}</p>
            {!!r.photos?.length && (
              <div className="flex gap-2">
                {r.photos.slice(0,3).map((p,i)=>(
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.path ?? i} src={p.url} alt={`photo ${i+1}`} className="h-24 w-24 object-cover rounded" />
                ))}
              </div>
            )}
            {/* Link to master */}
            {r.masterRef?.type === 'listing' && r.masterRef.id && (
              <Link href={`/masters/${r.masterRef.id}`} className="text-pink-600 underline">Go to master</Link>
            )}
            {r.masterRef?.type === 'community' && r.masterRef.slug && (
              <Link href={`/reviewty/m/${r.masterRef.slug}`} className="text-pink-600 underline">Master card</Link>
            )}
          </li>
        ))}
      </ul>

      <div className="pt-4 flex justify-center">
        {!done ? (
          <button onClick={()=>fetchPage()} disabled={loading} className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60">
            {loading ? 'Loading...' : 'Show more'}
          </button>
        ) : <div className="text-gray-500">That's all</div>}
      </div>

      {/* Creation modal is handled below */}
      <ReviewtyCreateModal />
    </div>
  );
}
