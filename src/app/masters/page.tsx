'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import MasterFilters from '@/components/Filters/MasterFilters';
import MasterCard from '@/components/MasterCard';
import { fetchMastersOnce, MasterFilters as FM } from '@/lib/firestoreQueries';

const MastersMap = NextDynamic(() => import('@/components/Map/MastersMap'), { ssr: false });

export default function MastersPage() {
  const [filters, setFilters] = useState<FM>({ services: [], languages: [], minRating: undefined, name: '' });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true); // for mobile toggle

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { items } = await fetchMastersOnce({
          city: filters.city,
          cityPlaceId: (filters as any).cityPlaceId,
          services: filters.services,
          languages: filters.languages,
          minRating: filters.minRating,
          name: filters.name,
        }, 60);
        if (alive) setItems(items);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [filters.city, (filters as any).cityPlaceId, filters.services, filters.languages, filters.minRating, filters.name]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Toggle Masters | Listings */}
      <div className="mb-4 flex gap-2">
        <Link href="/masters" className="rounded-md border px-3 py-2 text-sm font-medium bg-pink-500 text-white border-pink-500">Masters</Link>
        <Link href="/listings" className="rounded-md border px-3 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-pink-50">Listings</Link>
      </div>

      {/* Layout: sidebar + content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar filters (vertical) */}
        <aside className="rounded-lg border p-4">
          <MasterFilters
            value={{
              city: filters.city,
              services: filters.services ?? [],
              languages: filters.languages ?? [],
              minRating: filters.minRating,
              name: filters.name ?? '',
            }}
            onChange={setFilters as any}
            showName
          />
          {/* Mobile map toggle */}
          <button
            type="button"
            onClick={() => setShowMap(s => !s)}
            className="mt-4 w-full rounded-md border px-3 py-2 text-sm">
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </aside>

        {/* Content: map + list */}
        <section>
          {/* Map */}
          <div className={`mb-4 ${showMap ? 'block' : 'hidden md:block'}`}>
            <div className="relative z-0">
              <MastersMap items={items.map(i => ({ id: i.id, displayName: i.displayName, geo: i.geo }))} />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="py-8 text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No masters match your filters yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(m => <MasterCard key={m.id} master={m} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}