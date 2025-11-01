"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MasterFilters from "@/components/Filters/MasterFilters";
import MasterCard from "@/components/MasterCard";
import ListingCard from "./components/ListingCard";
import { fetchMastersOnce, fetchListingsOnce, MasterFilters as FM } from "@/lib/firestoreQueries";
import { includesAll } from "@/lib/filters/matchers";
import { selectedToKeys, docServiceKeysDeep, docLanguageKeysDeep, extractCityKey, normalizeCitySelection, toKey, docCityKeyDeep, toRegionKey } from "@/lib/filters/normalize";
import dynamicImport from 'next/dynamic';

const MastersMapNoSSR = dynamicImport(() => import('@/components/mapComponents').then(m => m.MastersMap), { ssr: false });

function PageContent() {
  // Get URL search params for city fallback
  const searchParams = useSearchParams();
  const urlCity = searchParams?.get("city")?.toLowerCase() || undefined;

  // Controlled state for filters
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [name, setName] = useState<string>('');
  
  // Full dataset loaded once (never changes after initial load)
  const [allMasters, setAllMasters] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial data load
  const [showMap, setShowMap] = useState(true); // for mobile toggle

  // Handlers with normalization
  const handleServicesChange = useCallback((next: any[]) => {
    const norm = Array.isArray(next) 
      ? next.map(v => (typeof v === "string" ? { key: toKey(v) } : { ...v, key: toKey(v) || v?.key })).filter(Boolean) 
      : [];
    setSelectedServices(norm);
  }, []);

  const handleLanguagesChange = useCallback((next: any[]) => {
    const norm = Array.isArray(next) 
      ? next.map(v => (typeof v === "string" ? { key: toKey(v) } : { ...v, key: toKey(v) || v?.key })).filter(Boolean) 
      : [];
    setSelectedLanguages(norm);
  }, []);

  const handleCityChange = useCallback((next: any) => {
    const norm = normalizeCitySelection(next);
    setSelectedCity(norm);
  }, []);

  // Consolidated filter change handler for MasterFilters component
  const handleFiltersChange = useCallback((newFilters: FM) => {
    if (newFilters.services !== undefined) handleServicesChange(newFilters.services);
    if (newFilters.languages !== undefined) handleLanguagesChange(newFilters.languages);
    if ((newFilters as any).cityPlaceId || newFilters.city) {
      handleCityChange({
        formatted: newFilters.city,
        placeId: (newFilters as any).cityPlaceId,
        cityKey: (newFilters as any).cityKey,
      });
    }
    if (newFilters.minRating !== undefined) setMinRating(newFilters.minRating);
    if (newFilters.name !== undefined) setName(newFilters.name);
  }, [handleServicesChange, handleLanguagesChange, handleCityChange]);

  // Initial data load on mount (ONCE - loads ALL data, no filters)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [mastersResult, listingsResult] = await Promise.all([
          fetchMastersOnce({}, 500), // Fetch large initial dataset without filters
          fetchListingsOnce({}, 500)
        ]);
        if (alive) {
          setAllMasters(mastersResult.items);
          setAllListings(listingsResult.items);
          setInitialLoad(false); // Mark initial load complete
        }
      } catch (error) {
        console.error('[Masters] Initial load error:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []); // Run only ONCE on mount - no refetching!

  // 1) Normalize UI selections to KEYS
  const selectedServiceKeys = selectedToKeys(selectedServices as any);
  const selectedLanguageKeys = selectedToKeys(selectedLanguages as any);
  
  // Use UI selection first, fallback to ?city=<key> from URL
  const cityKey = extractCityKey(selectedCity) ?? urlCity;

  // Helper functions for city matching
  const normalize = (val: any) => {
    if (!val) return "";
    return val
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ");
  };

  // detect city-like fields from current data
  const detectCityFields = (items: any[]) => {
    const result = new Set<string>();
    const base = [
      "city",
      "cityKey",
      "citySlug",
      "cityName",
      "location",
      "formattedAddress",
      "addressFormatted",
    ];

    items.slice(0, 5).forEach((it) => {
      if (!it) return;
      Object.keys(it).forEach((k) => {
        const lk = k.toLowerCase();
        if (lk.includes("city") || lk.includes("location") || lk.includes("address")) {
          result.add(k);
        }
      });

      if (it.location && typeof it.location === "object") {
        Object.keys(it.location).forEach((k) => {
          const lk = k.toLowerCase();
          if (lk.includes("city") || lk.includes("slug") || lk.includes("formatted") || lk.includes("address")) {
            result.add("location." + k);
          }
        });
      }
    });

    base.forEach((b) => result.add(b));

    return Array.from(result);
  };

  // ---- CITY FILTER (dynamic) ----
  let filteredMasters = allMasters;
  let filteredListings = allListings;

  const selectedCityValue =
    selectedCity ||
    cityKey ||
    null;

  if (selectedCityValue) {
    const selectedNorms = [
      typeof selectedCityValue === "string" ? selectedCityValue : null,
      selectedCityValue.slug,
      selectedCityValue.cityKey,
      selectedCityValue.city,
      selectedCityValue.formatted,
      selectedCityValue.label,
      selectedCityValue.value,
      selectedCityValue.name,
      selectedCityValue.displayName,
    ]
      .filter(Boolean)
      .map(normalize);

    if (selectedNorms.length > 0) {
      // detect fields from actual data
      const masterCityFields = detectCityFields(allMasters || []);
      const listingCityFields = detectCityFields(allListings || []);

      // filter masters
      filteredMasters = filteredMasters.filter((m: any) => {
        const itemVals: string[] = [];

        masterCityFields.forEach((field) => {
          if (field.startsWith("location.")) {
            const sub = field.split(".")[1];
            const v = m.location?.[sub];
            if (v) itemVals.push(normalize(v));
          } else {
            const v = m?.[field];
            if (v) itemVals.push(normalize(v));
          }
        });

        if (itemVals.length === 0) return false;

        return itemVals.some((iv) =>
          selectedNorms.some((sv) => {
            if (!iv || !sv) return false;
            return iv === sv || iv.startsWith(sv) || sv.startsWith(iv);
          })
        );
      });

      // filter listings
      filteredListings = filteredListings.filter((l: any) => {
        const itemVals: string[] = [];

        listingCityFields.forEach((field) => {
          if (field.startsWith("location.")) {
            const sub = field.split(".")[1];
            const v = l.location?.[sub];
            if (v) itemVals.push(normalize(v));
          } else {
            const v = l?.[field];
            if (v) itemVals.push(normalize(v));
          }
        });

        if (itemVals.length === 0) return false;

        return itemVals.some((iv) =>
          selectedNorms.some((sv) => {
            if (!iv || !sv) return false;
            return iv === sv || iv.startsWith(sv) || sv.startsWith(iv);
          })
        );
      });
    }
  }

  // Apply other filters after city filter
  filteredMasters = filteredMasters
    .filter(m => includesAll(docServiceKeysDeep(m), selectedServiceKeys))
    .filter(m => includesAll(docLanguageKeysDeep(m), selectedLanguageKeys))
    .filter(m => {
      // Apply minRating filter
      if (minRating && m.rating < minRating) return false;
      // Apply name search filter
      if (name && m.displayName && !m.displayName.toLowerCase().includes(name.toLowerCase())) return false;
      return true;
    });

  filteredListings = filteredListings
    .filter(l => includesAll(docServiceKeysDeep(l), selectedServiceKeys))
    .filter(l => includesAll(docLanguageKeysDeep(l), selectedLanguageKeys))
    .filter(l => {
      // Apply minRating filter
      if (minRating && l.rating < minRating) return false;
      return true;
    });


  const hasResults = filteredMasters.length > 0 || filteredListings.length > 0;
  
  // Combine all items for map markers
  const allMapMarkers = [
    ...filteredMasters.map(m => ({ lat: m.geo?.lat ?? 0, lng: m.geo?.lng ?? 0, title: m.displayName ?? 'Master' })),
    ...filteredListings.map(l => ({ lat: l.geo?.lat ?? 0, lng: l.geo?.lng ?? 0, title: l.title ?? 'Listing' }))
  ];

  // Show loading screen during initial data load
  if (initialLoad) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 flex gap-2">
            <Link href="/masters" className="rounded-md border px-3 py-2 text-sm font-medium bg-pink-500 text-white border-pink-500">Masters</Link>
            <Link href="/listings" className="rounded-md border px-3 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-pink-50">Listings</Link>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading masters and listings...</p>
            </div>
          </div>
        </div>
    );
  }

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
              city: selectedCity?.formatted,
              cityPlaceId: selectedCity?.cityKey,
              services: selectedServices,
              languages: selectedLanguages,
              minRating: minRating,
              name: name,
            }}
            onChange={handleFiltersChange}
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
              <MastersMapNoSSR markers={allMapMarkers} />
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-8 text-center">Loading…</div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-gray-500">No matches for selected filters.</div>
          ) : (
            <div className="space-y-10">
              {/* Masters Section */}
              {filteredMasters.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold mb-3">Masters ({filteredMasters.length})</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredMasters.map(m => <MasterCard key={m.id} master={m} />)}
                  </div>
                </section>
              )}

              {/* Listings Section */}
              {filteredListings.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold mb-3">Listings ({filteredListings.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredListings.map(l => <ListingCard key={l.id || l._id} item={l} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MastersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}