'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import SearchFilters from '@/components/SearchFilters';
import MasterCard from '@/components/MasterCard';
import MasterCardSkeleton from '@/components/MasterCardSkeleton';
import { query as queryMasters } from '@/lib/services/firestoreMasters';
import type { MasterWithExtras, SearchFiltersValue } from '@/types';

// Dynamically import the map component to avoid SSR issues
const ClientMap = dynamic(() => import('@/components/ClientMap'), {
  ssr: false,
});

const CARDS_PER_PAGE = 8;

export default function MastersPage() {
  const [masters, setMasters] = useState<MasterWithExtras[]>([]);
  const [filteredMasters, setFilteredMasters] = useState<MasterWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedMasterId, setHighlightedMasterId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersValue>({
    q: '',
    city: '',
    service: '',
    languages: [],
    price: 'all',
  });

  // Create refs for each master card
  const masterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Memoize derived filters
  const languagesKey = useMemo(() => (filters.languages ?? []).slice().sort().join("|"), [filters.languages]);
  const masterFilters: SearchFiltersValue = useMemo(() => ({
    q: filters.q?.trim() || "",
    city: filters.city || "",
    service: filters.service || "",
    price: filters.price || "all",
    languages: filters.languages ?? []
  }), [filters.q, filters.city, filters.service, filters.price, languagesKey]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMasters.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const displayedMasters = filteredMasters.slice(startIndex, endIndex);
  const hasMorePages = currentPage < totalPages;

  // Memoize map markers to avoid rerenders
  const mapMarkers = useMemo(() => filteredMasters
    .filter((master) => {
      const location = master.location || (master.lat && master.lng ? { lat: master.lat, lng: master.lng } : null);
      return location && typeof location.lat === 'number' && typeof location.lng === 'number';
    })
    .map((master) => ({
      id: master.id,
      title: master.displayName || master.name || 'Master',
      lat: master.location?.lat || master.lat!,
      lng: master.location?.lng || master.lng!,
    })), [filteredMasters]);

  // Handle marker click - scroll to corresponding card and highlight
  const handleMarkerClick = useCallback((masterId: string) => {
    const cardElement = masterRefs.current[masterId];
    if (cardElement) {
      // Scroll to the card
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Add highlight effect
      setHighlightedMasterId(masterId);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedMasterId(null);
      }, 3000);
    }
  }, []);

  // Load more masters
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMorePages) return;
    
    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentPage(prev => prev + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMorePages]);

  // Load masters from Firestore
 useEffect(() => {
    async function loadMasters() {
      try {
        setLoading(true);
        const mastersData = await queryMasters({});
        setMasters(mastersData);
      } catch (error) {
        console.error('Error loading masters:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMasters();
 }, []);

  // Apply filters using the service with in-flight guard
  useEffect(() => {
    let cancelled = false;
    
    async function applyFilters() {
      setLoading(true);
      
      try {
        // Convert SearchFiltersValue to query filters
        const queryFilters: Partial<SearchFiltersValue> = {
          q: masterFilters.q || undefined,
          city: masterFilters.city || undefined,
          service: masterFilters.service || undefined,
          languages: masterFilters.languages && masterFilters.languages.length > 0 ? masterFilters.languages : undefined,
          price: masterFilters.price === 'all' ? undefined : masterFilters.price,
        };
        
        const filteredData = await queryMasters(queryFilters);
        if (!cancelled) {
          setFilteredMasters(filteredData);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error applying filters:', error);
          setLoading(false);
        }
      }
    }
    
    applyFilters();
    
    return () => {
      cancelled = true;
    };
  }, [masterFilters.q, masterFilters.city, masterFilters.service, masterFilters.price, languagesKey]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Find Beauty Masters</h1>
        
        {/* Loading Layout */}
        <div className="space-y-6 md:space-y-8">
          {/* Filters Sidebar Skeleton */}
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/2" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/3" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Map Skeleton */}
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/4" />
            <div className="h-60 md:h-80 bg-gray-200 rounded-lg" />
          </div>

          {/* Results Count Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>

        {/* Masters Grid Skeleton */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 mt-6 md:mt-8">
          {[...Array(6)].map((_, i) => (
            <MasterCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

 return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Find Beauty Masters</h1>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Filters Accordion */}
        <div className="bg-white rounded-lg border">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="font-semibold">Filters</span>
            <svg
              className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
                     {filtersOpen && (
             <div className="px-4 pb-4 border-t relative overflow-visible">
               <SearchFilters value={filters} onChange={setFilters} />
             </div>
           )}
        </div>

        {/* Map Toggle */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Map View</h2>
            <button
              onClick={() => setShowMap(!showMap)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-pink-600 text-white hover:bg-pink-700 transition-colors"
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>
          {showMap && (
            <div className="h-60 rounded-lg overflow-hidden border shadow-sm">
              <ClientMap 
                markers={mapMarkers} 
                onMarkerClick={handleMarkerClick}
              />
 </div>
 )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {filteredMasters.length} master{filteredMasters.length !== 1 ? 's' : ''} found
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
        {/* Filters Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border p-6 sticky top-6 relative overflow-visible">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <SearchFilters value={filters} onChange={setFilters} />
          </div>
 </div>

        {/* Map and Results */}
        <div className="md:col-span-3">
          {/* Map Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Map View</h2>
            <div className="h-80 rounded-lg overflow-hidden border shadow-sm">
              <ClientMap 
                markers={mapMarkers} 
                onMarkerClick={handleMarkerClick}
              />
            </div>
 </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-gray-600">
              {filteredMasters.length} master{filteredMasters.length !== 1 ? 's' : ''} found
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </p>
          </div>
        </div>
 </div>

      {/* Masters Grid */}
      {filteredMasters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No masters found matching your criteria.</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {displayedMasters.map((master) => (
              <div
                key={master.id}
                ref={(el) => {
                  masterRefs.current[master.id] = el;
                }}
                className={`transition-all duration-500 ${
                  highlightedMasterId === master.id
                    ? 'ring-4 ring-pink-400 ring-opacity-75 scale-105 shadow-lg'
                    : ''
                }`}
              >
                <MasterCard key={master.id} master={master} />
 </div>
            ))}
            
            {/* Loading More Skeletons */}
            {loadingMore && (
              <>
                {[...Array(4)].map((_, i) => (
                  <MasterCardSkeleton key={`skeleton-${i}`} />
                ))}
              </>
 )}
 </div>

          {/* Load More Button */}
          {hasMorePages && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  `Load More (${Math.min(CARDS_PER_PAGE, filteredMasters.length - endIndex)} more)`
                )}
              </button>
 </div>
          )}
        </>
      )}
 </div>
 );
}