"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import ListingCard from "../masters/components/ListingCard";
import { fetchListingsOnce, ListingFilters as LF } from "@/lib/firestoreQueries";
import { includesAll } from "@/lib/filters/matchers";
import { selectedToKeys, docServiceKeysDeep, docLanguageKeysDeep, cityKeyMatches, docCityKeyDeep, normalizeCitySelection, toKey, ensureKeyObject } from "@/lib/filters/normalize";
import type { TagOption } from "@/types/tags";
import type { CityNorm } from "@/lib/city";
import dynamicImport from 'next/dynamic';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MastersMapNoSSR = dynamicImport(() => import('@/components/mapComponents').then(m => m.MastersMap), { ssr: false });

function PageContent() {
  // Get URL search params for city
  const searchParams = useSearchParams();
  const urlCity = searchParams?.get("city") || undefined;

  // Full dataset loaded once
  const [allListings, setAllListings] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Controlled filter state
  const [selectedServices, setSelectedServices] = useState<TagOption[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<TagOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Map center and marker state
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({
    lat: 43.6532,
    lng: -79.3832,
  });
  const [mapMarker, setMapMarker] = useState<{lat: number; lng: number} | null>(null);

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
    // Preserve the full city object with lat/lng if available
    if (next && typeof next.lat === 'number' && typeof next.lng === 'number') {
      setSelectedCity({ ...norm, lat: next.lat, lng: next.lng });
    } else {
      setSelectedCity(norm);
    }
  }, []);

  // Update map center and marker when city filter changes
  useEffect(() => {
    if (selectedCity && typeof selectedCity.lat === 'number' && typeof selectedCity.lng === 'number') {
      setMapCenter({ lat: selectedCity.lat, lng: selectedCity.lng });
      setMapMarker({ lat: selectedCity.lat, lng: selectedCity.lng });
    } else {
      // If city cleared – back to default center
      setMapMarker(null);
      setMapCenter({ lat: 43.6532, lng: -79.3832 });
    }
  }, [selectedCity]);

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

  // Load reviews for listings after listings are loaded
  useEffect(() => {
    if (!allListings.length || initialLoad) return;
    
    let cancelled = false;
    (async () => {
      try {
        // Collect all listing IDs
        const listingIds = allListings.map(l => l.id || l._id).filter(Boolean);
        if (listingIds.length === 0) return;

        // Fetch reviews for these listings (split into batches if needed)
        const reviewsBatch: any[] = [];
        for (let i = 0; i < listingIds.length; i += 10) {
          const batch = listingIds.slice(i, i + 10);
          try {
            // Try new schema first (subjectId for listings)
            const q1 = query(collection(db, 'reviews'), where('subjectType', '==', 'listing'), where('subjectId', 'in', batch));
            const snap1 = await getDocs(q1);
            reviewsBatch.push(...snap1.docs.map(d => ({ id: d.id, ...d.data() })));
            
            // Also try legacy schema (listingId)
            const q2 = query(collection(db, 'reviews'), where('listingId', 'in', batch));
            const snap2 = await getDocs(q2);
            // Avoid duplicates
            const existingIds = new Set(reviewsBatch.map(r => r.id));
            snap2.docs.forEach(d => {
              const data = { id: d.id, ...d.data() };
              if (!existingIds.has(data.id)) {
                reviewsBatch.push(data);
              }
            });
          } catch (err) {
            console.error('[Listings] Error fetching reviews batch:', err);
          }
        }

        if (!cancelled) {
          setAllReviews(reviewsBatch);
        }
      } catch (error) {
        console.error('[Listings] Error loading reviews:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [allListings, initialLoad]);

  // Helper to normalize city values for comparison
  const normalizeCityVal = (v?: string) =>
    v ? v.toLowerCase().replace(/,/g, "").trim() : "";

  // Extract city key from selected city or URL
  const extractCityKey = (c: any) =>
    c?.slug || c?.cityKey || c?.placeId || null;

  const cityKey = extractCityKey(selectedCity) ?? urlCity ?? null;

  // Client-side filtering
  const selectedServiceKeys = selectedToKeys(selectedServices as any);
  const selectedLanguageKeys = selectedToKeys(selectedLanguages as any);

  let filteredListings = allListings;

  // City filtering
  if (selectedCity || urlCity) {
    const selectedName = normalizeCityVal(
      selectedCity?.formatted ||
      selectedCity?.city ||
      ""
    );
    const selectedSlug = (cityKey || "").toLowerCase();

    filteredListings = filteredListings.filter((l: any) => {
      const itemSlug =
        l.cityKey ||
        l.citySlug ||
        l.city?.slug ||
        "";
      const itemName = normalizeCityVal(
        l.cityName ||
        l.city?.formatted ||
        l.city ||
        ""
      );

      // 1) slug match
      if (selectedSlug && itemSlug && itemSlug.toLowerCase() === selectedSlug) {
        return true;
      }
      // 2) name match (first-word style)
      if (selectedName && itemName) {
        if (itemName.startsWith(selectedName)) return true;
        if (itemName.includes(selectedName)) return true;
      }
      return false;
    });
  }

  // Apply other filters
  filteredListings = filteredListings
    .filter(l => includesAll(docServiceKeysDeep(l), selectedServiceKeys))
    .filter(l => includesAll(docLanguageKeysDeep(l), selectedLanguageKeys))
    .filter(l => {
      if (minRating && l.rating < minRating) return false;
      return true;
    });

  // Compute listing ratings from reviews
  const enhancedListings = useMemo(() => {
    // Group reviews by listingId (support both new schema subjectId and legacy listingId)
    const reviewsByListing = new Map<string, any[]>();
    allReviews.forEach((review) => {
      // New schema: subjectId when subjectType === 'listing'
      // Legacy: listingId
      const listingId = (review.subjectType === 'listing' ? review.subjectId : null) || review.listingId;
      if (!listingId) return;
      if (!reviewsByListing.has(listingId)) {
        reviewsByListing.set(listingId, []);
      }
      reviewsByListing.get(listingId)!.push(review);
    });

    // Enhance listings with computed ratings
    return filteredListings.map((listing) => {
      const listingId = listing.id || listing._id;
      const reviews = listingId ? reviewsByListing.get(listingId) || [] : [];
      
      // Compute rating from reviews
      const computedRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : null;
      const computedReviewsCount = reviews.length;

      // Prefer existing rating, fallback to computed
      const finalRating = listing.averageRating ?? listing.rating ?? listing.avgRating ?? listing.stars ?? computedRating;
      const finalCount = listing.ratingCount ?? listing.reviewsCount ?? listing.totalReviews ?? listing.reviews?.length ?? computedReviewsCount;

      return {
        ...listing,
        computedRating,
        computedReviewsCount,
        finalRating,
        finalCount,
      };
    });
  }, [filteredListings, allReviews]);

  // Apply minRating filter using finalRating
  const filteredListingsWithRatings = enhancedListings.filter(l => {
    if (minRating) {
      const r = l.finalRating;
      if (typeof r !== "number" || r < minRating) return false;
    }
    return true;
  });

  // Combine listing markers with city marker if available
  const allMapMarkers = filteredListingsWithRatings.map(i => ({ lat: i.geo?.lat ?? 0, lng: i.geo?.lng ?? 0, title: i.title ?? 'Listing' }));
  const mapMarkersWithCity = mapMarker 
    ? [{ lat: mapMarker.lat, lng: mapMarker.lng, title: selectedCity?.formatted || 'Selected city' }, ...allMapMarkers]
    : allMapMarkers;

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
              <MastersMapNoSSR 
                center={mapCenter}
                zoom={10}
                markers={mapMarkersWithCity}
              />
            </div>
          </div>

          {loading && initialLoad ? (
            <div className="py-8 text-center">Loading…</div>
          ) : filteredListingsWithRatings.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No listings match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListingsWithRatings.map(l => <ListingCard key={l.id} item={l} />)}
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
