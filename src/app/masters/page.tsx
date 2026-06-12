"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MasterFilters from "@/components/Filters/MasterFilters";
import MasterCard from "@/components/MasterCard";
import ListingCard from "./components/ListingCard";
import { fetchMastersOnce, fetchListingsOnce, fetchMastersTotalCount, fetchListingsTotalCount, MasterFilters as FM } from "@/lib/firestoreQueries";
import { includesAll } from "@/lib/filters/matchers";
import { selectedToKeys, docServiceKeysDeep, docLanguageKeysDeep, extractCityKey, normalizeCitySelection, toKey, docCityKeyDeep, toRegionKey } from "@/lib/filters/normalize";
import dynamicImport from 'next/dynamic';
import { collection, getDocs, limit, query, where, type Firestore, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMasterProfileId } from "@/lib/listings/getMasterProfileId";
import {
  aggregateRatingsByMaster,
  aliasMasterRatings,
  buildListingOwnerMap,
  lookupMasterRating,
} from "@/lib/reviews/aggregateByMaster";
import {
  getReviewSubjectType,
  isApprovedMasterReviewForFeed,
  isApprovedReviewStatus,
} from "@/lib/reviews/masterReviewFilters";
import { filterByCityThenNeighborhood } from "@/lib/neighborhood/filter";
import {
  MASTERS_DATA_STALE_KEY,
  MASTER_AVATAR_UPDATED_EVENT,
} from "@/lib/profile/persistMasterAvatar";

const MastersMapNoSSR = dynamicImport(() => import('@/components/mapComponents').then(m => m.MastersMap), { ssr: false });

const MASTERS_PAGE_SIZE = 60;
const LISTINGS_PAGE_SIZE = 60;
const INITIAL_LOAD_TIMEOUT_MS = 25000;

function withLoadTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = INITIAL_LOAD_TIMEOUT_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Masters] ${label} timed out after ${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

type MastersLoadResult = Awaited<ReturnType<typeof fetchMastersOnce>>;
type ListingsLoadResult = Awaited<ReturnType<typeof fetchListingsOnce>>;

function applyMastersResult(
  mastersResult: MastersLoadResult,
  setters: {
    setAllMasters: (items: any[]) => void;
    setMastersCursor: (cursor: DocumentData | undefined) => void;
    setHasMoreMasters: (value: boolean) => void;
  }
) {
  setters.setAllMasters(mastersResult.items);
  setters.setMastersCursor(mastersResult.nextCursor);
  setters.setHasMoreMasters(
    mastersResult.items.length >= MASTERS_PAGE_SIZE &&
      !!mastersResult.nextCursor
  );
}

function applyListingsResult(
  listingsResult: ListingsLoadResult,
  setters: {
    setAllListings: (items: any[]) => void;
    setListingsCursor: (cursor: DocumentData | undefined) => void;
    setHasMoreListings: (value: boolean) => void;
  }
) {
  setters.setAllListings(listingsResult.items);
  setters.setListingsCursor(listingsResult.nextCursor);
  setters.setHasMoreListings(
    listingsResult.fetchedCount >= LISTINGS_PAGE_SIZE &&
      !!listingsResult.nextCursor
  );
}

async function loadMastersAndListingsSafely() {
  const [mastersSettled, listingsSettled] = await Promise.allSettled([
    withLoadTimeout(fetchMastersOnce({}, MASTERS_PAGE_SIZE), "masters fetch"),
    withLoadTimeout(fetchListingsOnce({}, LISTINGS_PAGE_SIZE), "listings fetch"),
  ]);

  const errors: string[] = [];
  let mastersResult: MastersLoadResult | null = null;
  let listingsResult: ListingsLoadResult | null = null;

  if (mastersSettled.status === "fulfilled") {
    mastersResult = mastersSettled.value;
  } else {
    console.error("[Masters] Failed to load masters:", mastersSettled.reason);
    errors.push("masters");
  }

  if (listingsSettled.status === "fulfilled") {
    listingsResult = listingsSettled.value;
  } else {
    console.error("[Masters] Failed to load listings:", listingsSettled.reason);
    errors.push("listings");
  }

  let loadError: string | null = null;
  if (errors.length === 2) {
    loadError =
      "Unable to load masters and listings. Please check your connection and refresh the page.";
  } else if (errors.includes("masters")) {
    loadError = "Unable to load masters right now. Listings are shown below.";
  } else if (errors.includes("listings")) {
    loadError = "Unable to load listings right now. Masters are shown below.";
  }

  return { mastersResult, listingsResult, loadError };
}

function isFirestoreDb(value: unknown): value is Firestore {
  return !!value && typeof value === "object" && "_databaseId" in (value as Record<string, unknown>);
}

function PageContent() {
  // Get URL search params for city fallback
  const searchParams = useSearchParams();
  const urlCity = searchParams?.get("city")?.toLowerCase() || undefined;
  const urlNeighborhood = searchParams?.get("neighborhood")?.trim().toLowerCase() || undefined;

  // Controlled state for filters - use null for "Any" to match /reviewty pattern
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [selectedNeighborhoodKey, setSelectedNeighborhoodKey] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null); // null = "Any", matching /reviewty
  const [name, setName] = useState<string>('');
  
  // Full dataset loaded once (never changes after initial load)
  const [allMasters, setAllMasters] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [mastersTotalCount, setMastersTotalCount] = useState(0);
  const [listingsTotalCount, setListingsTotalCount] = useState(0);
  const [countFetchFailed, setCountFetchFailed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial data load
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true); // for desktop toggle
  const [showFiltersMobile, setShowFiltersMobile] = useState(false); // mobile-only: filters panel
  const [showMapModal, setShowMapModal] = useState(false); // mobile-only: map modal

  // Map center and marker state
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: 43.6532, lng: -79.3832 }); // default Toronto
  const [mapMarker, setMapMarker] = useState<{lat: number; lng: number} | null>(null);
  
  // Pagination state
  const [mastersCursor, setMastersCursor] = useState<DocumentData | undefined>(undefined);
  const [listingsCursor, setListingsCursor] = useState<DocumentData | undefined>(undefined);
  const [hasMoreMasters, setHasMoreMasters] = useState(true);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [loadingMoreMasters, setLoadingMoreMasters] = useState(false);
  const [loadingMoreListings, setLoadingMoreListings] = useState(false);

  // Handlers with normalization
  const handleServicesChange = useCallback((next: any[]) => {
    const norm = Array.isArray(next) 
      ? next.map(v => (typeof v === "string" ? { key: toKey(v) } : { ...v, key: toKey(v) || v?.key })).filter(Boolean) 
      : [];
    setSelectedServices(norm);
  }, []);

  useEffect(() => {
    if (initialLoad) return;
    let alive = true;
    (async () => {
      try {
        const [mastersCount, listingsCount] = await Promise.all([
          fetchMastersTotalCount(),
          fetchListingsTotalCount(),
        ]);
        if (!alive) return;
        setMastersTotalCount(mastersCount);
        setListingsTotalCount(listingsCount);
        setCountFetchFailed(false);
      } catch (error) {
        console.warn("[Masters] Failed to fetch total counters, falling back to loaded counts:", error);
        if (!alive) return;
        setCountFetchFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialLoad]);

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
    cityKey?: string;
    lat?: number;
    lng?: number;
    neighborhoodKey?: string | null;
    neighborhoodName?: string | null;
    services: any[];
    languages: any[];
    minRating?: number | null;
    name?: string;
  };
  const handleFiltersChange = useCallback((newFilters: MasterFiltersValue) => {
    if (newFilters.services !== undefined) handleServicesChange(newFilters.services);
    if (newFilters.languages !== undefined) handleLanguagesChange(newFilters.languages);
    if (newFilters.city !== undefined) {
      if ((newFilters as any).cityPlaceId || newFilters.city || newFilters.cityKey) {
        handleCityChange({
          formatted: newFilters.city,
          placeId: (newFilters as any).cityPlaceId,
          slug: newFilters.cityKey,
          cityKey: newFilters.cityKey,
          lat: (newFilters as any).lat,
          lng: (newFilters as any).lng,
        });
      } else {
        handleCityChange(null);
      }
    }
    if (newFilters.neighborhoodKey !== undefined) {
      setSelectedNeighborhoodKey(newFilters.neighborhoodKey ?? null);
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

  const reloadPublicData = useCallback(async () => {
    const { mastersResult, listingsResult, loadError: nextLoadError } =
      await loadMastersAndListingsSafely();

    if (mastersResult) {
      applyMastersResult(mastersResult, {
        setAllMasters,
        setMastersCursor,
        setHasMoreMasters,
      });
    }

    if (listingsResult) {
      applyListingsResult(listingsResult, {
        setAllListings,
        setListingsCursor,
        setHasMoreListings,
      });
    }

    setLoadError(nextLoadError);
  }, []);

  // Initial data load on mount (first batch only)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { mastersResult, listingsResult, loadError: nextLoadError } =
          await loadMastersAndListingsSafely();
        if (!alive) return;

        if (mastersResult) {
          applyMastersResult(mastersResult, {
            setAllMasters,
            setMastersCursor,
            setHasMoreMasters,
          });
        } else {
          setAllMasters([]);
          setHasMoreMasters(false);
        }

        if (listingsResult) {
          applyListingsResult(listingsResult, {
            setAllListings,
            setListingsCursor,
            setHasMoreListings,
          });
        } else {
          setAllListings([]);
          setHasMoreListings(false);
        }

        setLoadError(nextLoadError);
      } catch (error) {
        console.error("[Masters] Initial load error:", error);
        if (alive) {
          setAllMasters([]);
          setAllListings([]);
          setHasMoreMasters(false);
          setHasMoreListings(false);
          setLoadError(
            "Unable to load masters and listings. Please check your connection and refresh the page."
          );
        }
      } finally {
        if (alive) {
          setInitialLoad(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Refresh when user returns to the tab (keeps public view in sync with dashboard)
  useEffect(() => {
    if (initialLoad) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      reloadPublicData().catch((error) => {
        console.warn("[Masters] Refresh on focus failed:", error);
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [initialLoad, reloadPublicData]);

  // Re-fetch after avatar update from dashboard (same session navigation)
  useEffect(() => {
    if (initialLoad) return;

    const refreshIfStale = () => {
      try {
        if (!sessionStorage.getItem(MASTERS_DATA_STALE_KEY)) return;
        sessionStorage.removeItem(MASTERS_DATA_STALE_KEY);
        reloadPublicData().catch((error) => {
          console.warn("[Masters] Refresh after avatar update failed:", error);
        });
      } catch {
        reloadPublicData().catch(() => {});
      }
    };

    refreshIfStale();

    const onAvatarUpdated = () => {
      reloadPublicData().catch((error) => {
        console.warn("[Masters] Refresh on avatar event failed:", error);
      });
    };

    window.addEventListener(MASTER_AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => {
      window.removeEventListener(MASTER_AVATAR_UPDATED_EVENT, onAvatarUpdated);
    };
  }, [initialLoad, reloadPublicData]);

  const mergeUniqueById = useCallback((prev: any[], next: any[]) => {
    const map = new Map<string, any>();
    prev.forEach((item) => {
      const id = String(item?.id ?? item?._id ?? "");
      if (id) map.set(id, item);
    });
    next.forEach((item) => {
      const id = String(item?.id ?? item?._id ?? "");
      if (id) map.set(id, item);
    });
    return Array.from(map.values());
  }, []);

  const loadMoreMasters = useCallback(async () => {
    if (loadingMoreMasters || !hasMoreMasters || !mastersCursor) return;
    setLoadingMoreMasters(true);
    try {
      const result = await fetchMastersOnce({}, MASTERS_PAGE_SIZE, mastersCursor);
      setAllMasters((prev) => mergeUniqueById(prev, result.items));
      setMastersCursor(result.nextCursor);
      setHasMoreMasters(
        result.items.length >= MASTERS_PAGE_SIZE && !!result.nextCursor
      );
    } catch (error) {
      console.warn("[Masters] Load more masters failed:", error);
    } finally {
      setLoadingMoreMasters(false);
    }
  }, [loadingMoreMasters, hasMoreMasters, mastersCursor, mergeUniqueById]);

  const loadMoreListings = useCallback(async () => {
    if (loadingMoreListings || !hasMoreListings || !listingsCursor) return;
    setLoadingMoreListings(true);
    try {
      const result = await fetchListingsOnce({}, LISTINGS_PAGE_SIZE, listingsCursor);
      setAllListings((prev) => mergeUniqueById(prev, result.items));
      setListingsCursor(result.nextCursor);
      setHasMoreListings(
        result.fetchedCount >= LISTINGS_PAGE_SIZE && !!result.nextCursor
      );
    } catch (error) {
      console.warn("[Masters] Load more listings failed:", error);
    } finally {
      setLoadingMoreListings(false);
    }
  }, [loadingMoreListings, hasMoreListings, listingsCursor, mergeUniqueById]);

  const loadAllReviews = useCallback(async () => {
    if (!isFirestoreDb(db)) {
      console.warn("[Masters] Firestore DB unavailable for reviews fetch. Using empty fallback.");
      setAllReviews([]);
      return;
    }

    const merged = new Map<string, any>();
    const addReview = (docSnap: { id: string; data: () => Record<string, unknown> }) => {
      const data = docSnap.data();
      if (!isApprovedReviewStatus(data)) return;
      const subjectType = getReviewSubjectType(data);
      const countsForMaster =
        isApprovedMasterReviewForFeed(data) ||
        Boolean(data.listingId) ||
        subjectType === "listing";
      if (!countsForMaster) return;
      if (!merged.has(docSnap.id)) {
        merged.set(docSnap.id, { id: docSnap.id, ...data });
      }
    };

    try {
      const masterQueries = [
        query(
          collection(db, "reviews"),
          where("subjectType", "==", "master"),
          where("status", "==", "approved"),
          limit(500)
        ),
        query(
          collection(db, "reviews"),
          where("subjectType", "==", "master"),
          limit(500)
        ),
      ];

      for (const masterQuery of masterQueries) {
        try {
          const snap = await getDocs(masterQuery);
          snap.docs.forEach(addReview);
        } catch (error) {
          console.warn("[Masters] Failed to load master reviews:", error);
        }
      }

      try {
        const recentSnap = await getDocs(
          query(collection(db, "reviews"), limit(400))
        );
        recentSnap.docs.forEach((docSnap) => addReview(docSnap));
      } catch (error) {
        console.warn("[Masters] Failed to load recent reviews fallback:", error);
      }

      const listingIds = allListings.map((l) => l.id || l._id).filter(Boolean);
      for (let i = 0; i < listingIds.length; i += 10) {
        const batch = listingIds.slice(i, i + 10);
        try {
          const q1 = query(
            collection(db, "reviews"),
            where("subjectType", "==", "listing"),
            where("subjectId", "in", batch)
          );
          const snap1 = await getDocs(q1);
          snap1.docs.forEach(addReview);

          const q2 = query(collection(db, "reviews"), where("listingId", "in", batch));
          const snap2 = await getDocs(q2);
          snap2.docs.forEach(addReview);
        } catch (batchError) {
          console.warn("[Masters] Failed to load listing reviews batch:", batchError);
        }
      }

      setAllReviews(Array.from(merged.values()));
    } catch (error) {
      console.warn("[Masters] Reviews load error:", error);
    }
  }, [allListings]);

  // Load reviews for masters + listings once initial catalog is ready
  useEffect(() => {
    if (initialLoad) return;
    let cancelled = false;
    (async () => {
      await loadAllReviews();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [allListings, initialLoad, loadAllReviews]);

  useEffect(() => {
    if (initialLoad) return;
    const onSubmitted = () => {
      loadAllReviews().catch((error) => {
        console.warn("[Masters] Failed to refresh reviews after submit:", error);
      });
    };
    window.addEventListener("reviewty:reviewSubmitted", onSubmitted);
    return () => window.removeEventListener("reviewty:reviewSubmitted", onSubmitted);
  }, [initialLoad, loadAllReviews]);

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

  const effectiveNeighborhoodKey =
    selectedNeighborhoodKey || urlNeighborhood || null;

  const listingOwnerMap = useMemo(
    () => buildListingOwnerMap(allListings),
    [allListings]
  );

  const masterRatings = useMemo(() => {
    const base = aggregateRatingsByMaster(allReviews, listingOwnerMap);
    return aliasMasterRatings(base, allMasters);
  }, [allReviews, listingOwnerMap, allMasters]);

  const enhancedListings = useMemo(() => {
    return allListings.map((listing) => {
      const masterKey = getMasterProfileId(listing);
      const masterRating = masterKey
        ? lookupMasterRating(masterRatings, { id: masterKey, uid: masterKey, masterId: masterKey })
        : lookupMasterRating(masterRatings, listing);

      const finalRating =
        masterRating?.rating ??
        listing.averageRating ??
        listing.rating ??
        listing.avgRating ??
        listing.stars ??
        null;
      const finalCount =
        masterRating?.count ??
        listing.ratingCount ??
        listing.reviewsCount ??
        listing.totalReviews ??
        0;

      return {
        ...listing,
        finalRating,
        finalCount,
        masterAggregateRating: masterRating?.rating ?? null,
        masterAggregateCount: masterRating?.count ?? 0,
      };
    });
  }, [allListings, masterRatings]);

  // Filter masters - ALWAYS start from allMasters (full dataset), matching /reviewty pattern
  const filteredMastersFinal = useMemo(() => {
    let filtered = [...allMasters];

    filtered = filterByCityThenNeighborhood(filtered, {
      cityKey: effectiveCitySlug,
      neighborhoodKey: effectiveNeighborhoodKey,
    });

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
        const ratingData = lookupMasterRating(masterRatings, m);
        const r = ratingData?.rating;
        if (typeof r !== "number") return false;
        return r >= minRating;
      });
    }

    return filtered;
  }, [allMasters, effectiveCitySlug, effectiveNeighborhoodKey, selectedServiceKeys, selectedLanguageKeys, name, minRating, masterRatings]);

  // Filter listings - ALWAYS start from enhancedListings (full dataset with ratings), matching /reviewty pattern
  const filteredListingsWithRatings = useMemo(() => {
    let filtered = [...enhancedListings];

    filtered = filterByCityThenNeighborhood(filtered, {
      cityKey: effectiveCitySlug,
      neighborhoodKey: effectiveNeighborhoodKey,
    });

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
  }, [enhancedListings, effectiveCitySlug, effectiveNeighborhoodKey, selectedServiceKeys, selectedLanguageKeys, minRating]);
  
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
      <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden px-4 py-6">
          <div className="mb-4 flex flex-wrap gap-2">
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
    <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden px-4 py-6">
      {/* Toggle Masters | Listings */}
      <div className="mb-4 flex flex-wrap gap-2">
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
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sidebar filters (vertical) - hidden on mobile, shown on desktop */}
        <aside className="hidden rounded-lg border p-4 md:block">
          <MasterFilters
            value={{
              city: selectedCity?.formatted,
              cityPlaceId: selectedCity?.placeId,
              cityKey: selectedCity?.slug || selectedCity?.cityKey,
              lat: selectedCity?.lat,
              lng: selectedCity?.lng,
              neighborhoodKey: selectedNeighborhoodKey,
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
        <section className="min-w-0 w-full max-w-full">
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
          {loadError ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadError}
            </div>
          ) : null}
          {loading ? (
            <div className="py-8 text-center">Loading…</div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-gray-500">
              {loadError
                ? "No content could be loaded."
                : "No matches for selected filters."}
            </div>
          ) : (
            <div className="min-w-0 w-full max-w-full space-y-10">
              {/* Masters Section */}
              {filteredMastersFinal.length > 0 && (
                <section className="min-w-0 w-full max-w-full">
                  <h2 className="text-base font-semibold mb-3">Masters ({filteredMastersFinal.length})</h2>
                  <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredMastersFinal.map(m => {
                      const ratingData = lookupMasterRating(masterRatings, m);
                      return (
                        <MasterCard
                          key={m.id || m.uid}
                          master={m}
                          rating={ratingData?.rating ?? undefined}
                          reviewCount={ratingData?.count ?? 0}
                        />
                      );
                    })}
                  </div>
                  {hasMoreMasters && (
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        onClick={loadMoreMasters}
                        disabled={loadingMoreMasters}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-pink-300 hover:bg-pink-50"
                      >
                        {loadingMoreMasters ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Listings Section */}
              {filteredListingsWithRatings.length > 0 && (
                <section className="min-w-0 w-full max-w-full">
                  <h2 className="text-base font-semibold mb-3">Listings ({filteredListingsWithRatings.length})</h2>
                  <div className="grid w-full min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredListingsWithRatings.map((l, i) => (
                      <ListingCard key={l.id || l._id || `listing-${i}`} item={l} />
                    ))}
                  </div>
                  {hasMoreListings && (
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        onClick={loadMoreListings}
                        disabled={loadingMoreListings}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-pink-300 hover:bg-pink-50"
                      >
                        {loadingMoreListings ? "Loading..." : "Load more"}
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
            <div className="sticky bottom-0 border-t bg-pink-50 px-4 pt-4 pb-4-safe">
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