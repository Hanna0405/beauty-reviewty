export const dynamic = "force-dynamic";

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MasterFilters from '@/components/Filters/MasterFilters';
import ListingCard from '@/components/ListingCard';
import { fetchListingsOnce, ListingFilters as LF } from '@/lib/firestoreQueries';

const MastersMap = dynamic(() => import('@/components/Map/MastersMap'), { ssr: false });

export default function ListingsPage() {
  const [filters, setFilters] = useState<LF>({ services: [], languages: [], minRating: undefined });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { items } = await fetchListingsOnce({
          city: filters.city,
          cityPlaceId: (filters as any).cityPlaceId,
          services: filters.services,
          languages: filters.languages,
          minRating: filters.minRating,
        }, 60);
        if (alive) setItems(items);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [filters.city, (filters as any).cityPlaceId, filters.services, filters.languages, filters.minRating]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex gap-2">
        <Link href="/masters" className="rounded-md border px-3 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-pink-50">Masters</Link>
        <Link href="/listings" className="rounded-md border px-3 py-2 text-sm font-medium bg-pink-500 text-white border-pink-500">Listings</Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
        <aside className="rounded-lg border p-4">
          <MasterFilters value={{
            city: filters.city,
            services: filters.services ?? [],
            languages: filters.languages ?? [],
            minRating: filters.minRating,
          }}
          onChange={setFilters as any}
          showName={false}
          />
        </aside>

        <section>
          {/* Reuse same map component; feeds listing geos */}
          <div className="mb-4">
            <div className="relative z-0">
              <MastersMap items={items.map(i => ({ id: i.id, displayName: i.title ?? 'Listing', geo: i.geo }))} />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No listings match your filters yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
