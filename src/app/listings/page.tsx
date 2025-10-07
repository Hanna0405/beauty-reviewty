"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import ListingCard from "@/components/ListingCard";
import { fetchListingsOnce, ListingFilters as LF } from "@/lib/firestoreQueries";
import { includesAll } from "@/lib/filters/matchers";
import { selectedToKeys, docServiceKeysDeep, docLanguageKeysDeep, cityKeyMatches, docCityKeyDeep, normalizeCitySelection, toKey, ensureKeyObject } from "@/lib/filters/normalize";
import type { TagOption } from "@/types/tags";
import type { CityNorm } from "@/lib/city";
import dynamicImport from 'next/dynamic';

const MastersMapNoSSR = dynamicImport(() => import('@/components/mapComponents').then(m => m.MastersMap), { ssr: false });

function PageContent() {
  // Full dataset loaded once
  const [allListings, setAllListings] = useState<any[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Controlled filter state
  const [selectedServices, setSelectedServices] = useState<TagOption[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<TagOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Handlers with normalization
  const handleServicesChange = useCallback((next: TagOption[]) => {
    const norm = Array.isArray(next) 
      ? next.map(v => ensureKeyObject<TagOption>(v)).filter(Boolean) as TagOption[]
      : [];
    setSelectedServices(norm);
  }, []);

  const handleLanguagesChange = useCallback((next: TagOption[]) => {
    const norm = Array.isArray(next) 
      ? next.map(v => ensureKeyObject<TagOption>(v)).filter(Boolean) as TagOption[]
      : [];
    setSelectedLanguages(norm);
  }, []);

  const handleCityChange = useCallback((next: any) => {
    const norm = normalizeCitySelection(next);
    setSelectedCity(norm);
  }, []);

  // Initial data load on mount (ONCE - loads ALL data, no filters)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { items } = await fetchListingsOnce({}, 500);
        if (alive) {
          setAllListings(items);
          setInitialLoad(false);
        }
      } catch (error) {
        console.error('[Listings] Initial load error:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Client-side filtering
  const selectedServiceKeys = selectedToKeys(selectedServices as any);
  const selectedLanguageKeys = selectedToKeys(selectedLanguages as any);
  const cityKey = selectedCity?.cityKey;

  const byCity = (x: any) => cityKeyMatches(docCityKeyDeep(x), cityKey);

  const filteredListings = allListings
    .filter(byCity)
    .filter(l => includesAll(docServiceKeysDeep(l), selectedServiceKeys))
    .filter(l => includesAll(docLanguageKeysDeep(l), selectedLanguageKeys))
    .filter(l => {
      if (minRating && l.rating < minRating) return false;
      return true;
    });

  // Show loading screen during initial data load
  if (initialLoad) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex gap-2">
          <Link href="/masters" className="rounded-md border px-3 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-pink-50">Masters</Link>
          <Link href="/listings" className="rounded-md border px-3 py-2 text-sm font-medium bg-pink-500 text-white border-pink-500">Listings</Link>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading listings...</p>
          </div>
        </div>
      </div>
    );
  }

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
                value={selectedCity}
                onChange={handleCityChange}
                placeholder="Select city"
              />
            </div>

            {/* Services */}
            <MultiSelectAutocompleteV2
              label="Services"
              options={SERVICE_OPTIONS}
              value={selectedServices}
              onChange={handleServicesChange}
              placeholder="Search services..."
            />

            {/* Languages */}
            <MultiSelectAutocompleteV2
              label="Languages"
              options={LANGUAGE_OPTIONS}
              value={selectedLanguages}
              onChange={handleLanguagesChange}
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
                setSelectedServices([]);
                setSelectedLanguages([]);
                setMinRating(undefined);
                setSelectedCity(null);
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
              <MastersMapNoSSR markers={filteredListings.map(i => ({ lat: i.geo?.lat ?? 0, lng: i.geo?.lng ?? 0, title: i.title ?? 'Listing' }))} />
            </div>
          </div>

          {loading && initialLoad ? (
            <div className="py-8 text-center">Loading…</div>
          ) : filteredListings.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No listings match your filters.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredListings.map(l => <ListingCard key={l.id} listing={l} />)}
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
