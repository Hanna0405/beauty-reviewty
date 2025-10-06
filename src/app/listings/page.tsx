"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import ListingCard from "@/components/ListingCard";
import { fetchListingsOnce, ListingFilters as LF } from "@/lib/firestoreQueries";
import type { TagOption } from "@/types/tags";
import type { CityNorm } from "@/lib/city";
import dynamicImport from 'next/dynamic';

const MastersMapNoSSR = dynamicImport(() => import('@/components/mapComponents').then(m => m.MastersMap), { ssr: false });

function PageContent() {
  const [services, setServices] = useState<TagOption[]>([]);
  const [languages, setLanguages] = useState<TagOption[]>([]);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [city, setCity] = useState<CityNorm | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { items } = await fetchListingsOnce({
          city: city?.formatted,
          cityPlaceId: city?.placeId,
          services: services,
          languages: languages,
          minRating: minRating,
        }, 60);
        if (alive) setItems(items);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [city, services.map(s=>s.key).join(','), languages.map(l=>l.key).join(','), minRating]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex gap-2">
        <Link href="/masters" className="rounded-md border px-3 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-pink-50">Masters</Link>
        <Link href="/listings" className="rounded-md border px-3 py-2 text-sm font-medium bg-pink-500 text-white border-pink-500">Listings</Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
        <aside className="rounded-lg border p-4">
          <div className="flex w-full flex-col gap-4">
            {/* City */}
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <CityAutocomplete 
                value={city}
                onChange={setCity}
                placeholder="Select city"
              />
            </div>

            {/* Services */}
            <MultiSelectAutocompleteV2
              label="Services"
              options={SERVICE_OPTIONS}
              value={services}
              onChange={(vals: TagOption[]) => {
                setServices(vals);
              }}
              placeholder="Search services..."
            />

            {/* Languages */}
            <MultiSelectAutocompleteV2
              label="Languages"
              options={LANGUAGE_OPTIONS}
              value={languages}
              onChange={(vals: TagOption[]) => {
                setLanguages(vals);
              }}
              placeholder="Search languages..."
            />

            {/* Rating */}
            <div>
              <label className="mb-1 block text-sm">Rating (min)</label>
              <select
                value={minRating ?? ''}
                onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-md border px-3 py-2">
                <option value="">Any</option>
                {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}★ & up</option>)}
              </select>
            </div>

            {/* Clear all */}
            <button
              type="button"
              onClick={() => {
                setServices([]);
                setLanguages([]);
                setMinRating(undefined);
                setCity(null);
              }}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
              Clear all ✖︎
            </button>
          </div>
        </aside>

        <section>
          {/* Reuse same map component; feeds listing geos */}
          <div className="mb-4">
            <div className="relative z-0">
              <MastersMapNoSSR markers={items.map(i => ({ lat: i.geo?.lat ?? 0, lng: i.geo?.lng ?? 0, title: i.title ?? 'Listing' }))} />
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

export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
