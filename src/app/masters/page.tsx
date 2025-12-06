"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MasterFilters from "@/components/Filters/MasterFilters";
import MasterCard from "@/components/MasterCard";
import ListingCard from "./components/ListingCard";
import { fetchMastersOnce, fetchListingsOnce, MasterFilters as FM } from "@/lib/firestoreQueries";
import { includesAll } from "@/lib/filters/matchers";
import { selectedToKeys, docServiceKeysDeep, docLanguageKeysDeep, extractCityKey, normalizeCitySelection, toKey, docCityKeyDeep, toRegionKey } from "@/lib/filters/normalize";
import dynamicImport from 'next/dynamic';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MastersMapNoSSR = dynamicImport(() => import('@/components/mapComponents').then(m => m.MastersMap), { ssr: false });

const PAGE_SIZE = 20;

function PageContent() {
  // Get URL search params for city fallback
  const searchParams = useSearchParams();
  const urlCity = searchParams?.get("city")?.toLowerCase() || undefined;

  // Controlled state for filters - use null for "Any" to match /reviewty pattern
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null); // null = "Any", matching /reviewty
  const [name, setName] = useState<string>('');
  
  // Full dataset loaded once (never changes after initial load)
  const [allMasters, setAllMasters] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial data load
  const [showMap, setShowMap] = useState(true); // for desktop toggle
  const [showFiltersMobile, setShowFiltersMobile] = useState(false); // mobile-only: filters panel
  const [showMapModal, setShowMapModal] = useState(false); // mobile-only: map modal

  // Map center and marker state
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: 43.6532, lng: -79.3832 }); // default Toronto
  const [mapMarker, setMapMarker] = useState<{lat: number; lng: number} | null>(null);
  
  // Pagination state
  const [visibleMastersCount, setVisibleMastersCount] = useState(PAGE_SIZE);
  const [visibleListingsCount, setVisibleListingsCount] = useState(PAGE_SIZE);

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
    // Preserve the full city object with lat/lng if available
    if (next && typeof next.lat === 'number' && typeof next.lng === 'number') {
      setSelectedCity({ ...norm, lat: next.lat, lng: next.lng });
    } else {
      setSelectedCity(norm);
    }
  }, []);

  // Consolidated filter change handler for MasterFilters component
  // Accepts MasterFilters Props value type which allows minRating?: number | null
  type MasterFiltersValue = {
    city?: string;
    cityPlaceId?: string;
    lat?: number;
    lng?: number;
    services: any[];
    languages: any[];
    minRating?: number | null;
    name?: string;
  };
  const handleFiltersChange = useCallback((newFilters: MasterFiltersValue) => {
    if (newFilters.services !== undefined) handleServicesChange(newFilters.services);
    if (newFilters.languages !== undefined) handleLanguagesChange(newFilters.languages);
    if (newFilters.city !== undefined) {
      if ((newFilters as any).cityPlaceId || newFilters.city) {
        // Preserve any lat/lng that might be in the filter object
        handleCityChange({
          formatted: newFilters.city,
          placeId: (newFilters as any).cityPlaceId,
          cityKey: (newFilters as any).cityKey,
          lat: (newFilters as any).lat,
          lng: (newFilters as any).lng,
        });
      } else {
        // City was cleared
        handleCityChange(null);
      }
    }
    if (newFilters.minRating !== undefined) setMinRating(newFilters.minRating ?? null);
    if (newFilters.name !== undefined) setName(newFilters.name);
  }, [handleServicesChange, handleLanguagesChange, handleCityChange]);

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
              if (!existingIds.has(d.id)) {
                reviewsBatch.push({ id: d.id, ...d.data() });
              }
            });
          } catch (batchError) {
            console.error('[Masters] Failed to load reviews batch:', batchError);
          }
        }

        if (!cancelled) {
          setAllReviews(reviewsBatch);
        }
      } catch (error) {
        console.error('[Masters] Reviews load error:', error);
      }
    })();
    
    return () => { cancelled = true; };
  }, [allListings, initialLoad]);

  // Normalize UI selections to KEYS (shared for masters & listings) - defined early before any useMemo
  const selectedServiceKeys = selectedToKeys(selectedServices as any);
  const selectedLanguageKeys = selectedToKeys(selectedLanguages as any);

  // Helper to normalize strings for city comparison
  const normalizeCityVal = (v?: string) => v ? v.toLowerCase().trim() : "";

  // Get city slug from URL query param
  const queryCitySlug = urlCity || undefined;

  // Build effective city slug from either filters or URL
  const effectiveCitySlug =
    selectedCity?.slug ||
    selectedCity?.cityKey ||
    queryCitySlug ||
    null;

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

    // Enhance ALL listings with computed ratings - always start from full dataset
    return allListings.map((listing) => {
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
  }, [allListings, allReviews]);

  // Compute master ratings from ALL enhanced listings (not filtered) - ensures ratings always computed from full dataset
  const masterRatings = useMemo(() => {
    const ratings = new Map<string, { rating: number | null; count: number }>();
    
    // Group listings by master - use ALL enhanced listings
    const listingsByMaster = new Map<string, any[]>();
    enhancedListings.forEach((listing) => {
      // Try multiple field names to link listing to master
      const masterId = listing.masterId || listing.ownerId || listing.userId || listing.uid || listing.userUID || listing.ownerUid || listing.profileUid || listing.masterUid || listing.userUid || listing.authorUid;
      if (!masterId) return;
      
      if (!listingsByMaster.has(masterId)) {
        listingsByMaster.set(masterId, []);
      }
      listingsByMaster.get(masterId)!.push(listing);
    });
    
    // Compute aggregated rating for each master
    listingsByMaster.forEach((listings, masterId) => {
      const rated = listings.filter((l) => {
        const r = l.finalRating;
        return typeof r === "number";
      });
      
      if (!rated.length) {
        ratings.set(masterId, { rating: null, count: 0 });
        return;
      }
      
      let totalWeighted = 0;
      let totalReviews = 0;
      
      rated.forEach((l) => {
        const r = l.finalRating;
        const c = l.finalCount;
        totalWeighted += r * c;
        totalReviews += c;
      });
      
      ratings.set(masterId, {
        rating: totalWeighted / totalReviews,
        count: totalReviews,
      });
    });
    
    return ratings;
  }, [enhancedListings]);

  // Filter masters - ALWAYS start from allMasters (full dataset), matching /reviewty pattern
  const filteredMastersFinal = useMemo(() => {
    let filtered = [...allMasters];

    // CITY FILTER
    if (effectiveCitySlug) {
      const normalizedSlug = normalizeCityVal(effectiveCitySlug);
      filtered = filtered.filter((m: any) => {
        const itemSlug = m.cityKey || m.citySlug || m.city?.slug || "";
        const itemName = m.cityName || m.city?.formatted || m.city || "";
        return (
          normalizeCityVal(itemSlug) === normalizedSlug ||
          normalizeCityVal(itemName).startsWith(normalizedSlug.split("-")[0])
        );
      });
    }

    // SERVICES FILTER
    if (selectedServiceKeys.length > 0) {
      filtered = filtered.filter(m => includesAll(docServiceKeysDeep(m), selectedServiceKeys));
    }

    // LANGUAGES FILTER
    if (selectedLanguageKeys.length > 0) {
      filtered = filtered.filter(m => includesAll(docLanguageKeysDeep(m), selectedLanguageKeys));
    }

    // NAME FILTER
    if (name) {
      const nameLower = name.toLowerCase();
      filtered = filtered.filter(m => {
        return m.displayName && m.displayName.toLowerCase().includes(nameLower);
      });
    }

    // RATING FILTER - match /reviewty behavior: if minRating is null, show all
    if (minRating != null && minRating > 0) {
      filtered = filtered.filter(m => {
        const masterId = m.id || m.uid;
        const ratingData = masterId ? masterRatings.get(masterId) : null;
        const r = ratingData?.rating;
        if (typeof r !== "number") return false;
        return r >= minRating;
      });
    }

    return filtered;
  }, [allMasters, effectiveCitySlug, selectedServiceKeys, selectedLanguageKeys, name, minRating, masterRatings]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleMastersCount(PAGE_SIZE);
    setVisibleListingsCount(PAGE_SIZE);
  }, [effectiveCitySlug, selectedServiceKeys, selectedLanguageKeys, name, minRating]);

  // Filter listings - ALWAYS start from enhancedListings (full dataset with ratings), matching /reviewty pattern
  const filteredListingsWithRatings = useMemo(() => {
    let filtered = [...enhancedListings];

    // CITY FILTER
    if (effectiveCitySlug) {
      const normalizedSlug = normalizeCityVal(effectiveCitySlug);
      filtered = filtered.filter((l: any) => {
        const itemSlug = l.cityKey || l.citySlug || l.city?.slug || "";
        const itemName = l.cityName || l.city?.formatted || l.city || "";
        return (
          normalizeCityVal(itemSlug) === normalizedSlug ||
          normalizeCityVal(itemName).startsWith(normalizedSlug.split("-")[0])
        );
      });
    }

    // SERVICES FILTER
    if (selectedServiceKeys.length > 0) {
      filtered = filtered.filter(l => includesAll(docServiceKeysDeep(l), selectedServiceKeys));
    }

    // LANGUAGES FILTER
    if (selectedLanguageKeys.length > 0) {
      filtered = filtered.filter(l => includesAll(docLanguageKeysDeep(l), selectedLanguageKeys));
    }

    // RATING FILTER - match /reviewty behavior: if minRating is null, show all
    if (minRating != null && minRating > 0) {
      filtered = filtered.filter(l => {
        const r = l.finalRating;
        if (typeof r !== "number") return false;
        return r >= minRating;
      });
    }

    return filtered;
  }, [enhancedListings, effectiveCitySlug, selectedServiceKeys, selectedLanguageKeys, minRating]);
  
  const hasResults = filteredMastersFinal.length > 0 || filteredListingsWithRatings.length > 0;
  
  // Combine all items for map markers
  const allMapMarkers = [
    ...filteredMastersFinal.map(m => ({ lat: m.geo?.lat ?? 0, lng: m.geo?.lng ?? 0, title: m.displayName ?? 'Master' })),
    ...filteredListingsWithRatings.map(l => ({ lat: l.geo?.lat ?? 0, lng: l.geo?.lng ?? 0, title: l.title ?? 'Listing' }))
  ];

  // Add city marker if available
  const mapMarkersWithCity = mapMarker 
    ? [{ lat: mapMarker.lat, lng: mapMarker.lng, title: selectedCity?.formatted || 'Selected city' }, ...allMapMarkers]
    : allMapMarkers;

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

      {/* Mobile-only: Filters button */}
      <div className="mb-4 md:hidden">
        <button
          type="button"
          onClick={() => setShowFiltersMobile(true)}
          className="w-full rounded-md border border-pink-500 bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
          Filters
        </button>
      </div>

      {/* Layout: sidebar + content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar filters (vertical) - hidden on mobile, shown on desktop */}
        <aside className="hidden rounded-lg border p-4 md:block">
          <MasterFilters
            value={{
              city: selectedCity?.formatted,
              cityPlaceId: selectedCity?.cityKey,
              lat: selectedCity?.lat,
              lng: selectedCity?.lng,
              services: selectedServices,
              languages: selectedLanguages,
              minRating: minRating,
              name: name,
            }}
            onChange={handleFiltersChange}
            showName
          />
          {/* Desktop map toggle */}
          <button
            type="button"
            onClick={() => setShowMap(s => !s)}
            className="mt-4 w-full rounded-md border px-3 py-2 text-sm">
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </aside>

        {/* Content: map + list */}
        <section>
          {/* Desktop Map */}
          <div className={`mb-4 hidden md:block ${showMap ? 'block' : 'hidden'}`}>
            <div className="relative z-0">
              <MastersMapNoSSR 
                center={mapCenter} 
                zoom={10}
                markers={mapMarkersWithCity}
              />
            </div>
          </div>

          {/* Mobile-only: Map button */}
          <div className="mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
              Show Map
            </button>
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-8 text-center">Loading…</div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-gray-500">No matches for selected filters.</div>
          ) : (
            <div className="space-y-10">
              {/* Masters Section */}
              {filteredMastersFinal.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold mb-3">Masters ({filteredMastersFinal.length})</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredMastersFinal.slice(0, visibleMastersCount).map(m => {
                      const masterId = m.id || m.uid;
                      const ratingData = masterId ? masterRatings.get(masterId) : null;
                      return <MasterCard key={m.id} master={m} rating={ratingData?.rating} reviewCount={ratingData?.count} />;
                    })}
                  </div>
                  {filteredMastersFinal.length > visibleMastersCount && (
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        onClick={() => setVisibleMastersCount((prev) => prev + PAGE_SIZE)}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-pink-300 hover:bg-pink-50"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Listings Section */}
              {filteredListingsWithRatings.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold mb-3">Listings ({filteredListingsWithRatings.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredListingsWithRatings.slice(0, visibleListingsCount).map(l => <ListingCard key={l.id || l._id} item={l} />)}
                  </div>
                  {filteredListingsWithRatings.length > visibleListingsCount && (
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        onClick={() => setVisibleListingsCount((prev) => prev + PAGE_SIZE)}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-pink-300 hover:bg-pink-50"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filters Modal */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowFiltersMobile(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div 
            className="absolute inset-y-0 left-0 right-0 flex flex-col overflow-y-auto bg-pink-50 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-pink-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setShowFiltersMobile(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4">
              <MasterFilters
                value={{
                  city: selectedCity?.formatted,
                  cityPlaceId: selectedCity?.cityKey,
                  lat: selectedCity?.lat,
                  lng: selectedCity?.lng,
                  services: selectedServices,
                  languages: selectedLanguages,
                  minRating: minRating,
                  name: name,
                }}
                onChange={handleFiltersChange}
                showName
              />
            </div>
            <div className="sticky bottom-0 border-t bg-pink-50 p-4">
            <button
                type="button"
                onClick={() => setShowFiltersMobile(false)}
                className="w-full rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
                Apply
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 flex flex-col bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
              <h2 className="text-lg font-semibold">Map</h2>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Map Container */}
            <div className="relative flex-1 min-h-0">
              <MastersMapNoSSR 
                center={mapCenter} 
                zoom={10}
                markers={mapMarkersWithCity}
                className="h-full w-full rounded-none border-0"
              />
            </div>
          </div>
        </div>
      )}
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