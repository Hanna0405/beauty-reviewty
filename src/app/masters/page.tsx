'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  DocumentData,
  where,
} from 'firebase/firestore';
import dynamic from 'next/dynamic';
import SearchFilters, { SearchFiltersValue } from '@/components/SearchFilters';
import MasterCard from '@/components/MasterCard';
import type { Master } from '@/data/masters';

// Dynamically import the map component to avoid SSR issues
const ClientMap = dynamic(() => import('@/components/ClientMap'), {
  ssr: false,
});

type MasterItem = Master & {
  id: string;
  displayName?: string;
  city?: string;
  services?: string[];
  mainServices?: string[];
  price?: number;
  priceMin?: number;
  priceMax?: number;
  avgRating?: number;
  ratingAvg?: number;
  rating?: number;
  reviewsCount?: number;
  photoURL?: string;
  photoUrls?: string[];
  photos?: string[];
  photo?: string;
  location?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
};

export default function MastersPage() {
  const [masters, setMasters] = useState<MasterItem[]>([]);
  const [filteredMasters, setFilteredMasters] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersValue>({
    q: '',
    city: '',
    service: '',
    price: 'all',
  });

  // Load masters from Firestore
  useEffect(() => {
    const q = query(collection(db, 'masters'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: MasterItem[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MasterItem[];
      setMasters(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...masters];

    // Text search
    if (filters.q) {
      const query = filters.q.toLowerCase();
      filtered = filtered.filter(
        (master) =>
          (master.displayName || master.name || '').toLowerCase().includes(query) ||
          (master.city || '').toLowerCase().includes(query) ||
          (master.services || master.mainServices || []).some((service: string) =>
            service.toLowerCase().includes(query)
          )
      );
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(
        (master) => (master.city || '').toLowerCase() === filters.city.toLowerCase()
      );
    }

    // Service filter
    if (filters.service) {
      filtered = filtered.filter((master) =>
        (master.services || master.mainServices || []).some((service: string) =>
          service.toLowerCase() === filters.service.toLowerCase()
        )
      );
    }

    // Rating filter
    if (filters.price !== 'all') {
      const minRating = parseFloat(filters.price);
      filtered = filtered.filter((master) => {
        const rating = master.avgRating || master.ratingAvg || master.rating || 0;
        return rating >= minRating;
      });
    }

    setFilteredMasters(filtered);
  }, [masters, filters]);

  // Prepare map markers
  const mapMarkers = filteredMasters
    .filter((master) => {
      const location = master.location || (master.lat && master.lng ? { lat: master.lat, lng: master.lng } : null);
      return location && typeof location.lat === 'number' && typeof location.lng === 'number';
    })
    .map((master) => ({
      id: master.id,
      title: master.displayName || master.name || 'Master',
      lat: master.location?.lat || master.lat!,
      lng: master.location?.lng || master.lng!,
    }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">All Masters</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Find Beauty Masters</h1>

      {/* Filters and Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <SearchFilters value={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Map and Results */}
        <div className="lg:col-span-3">
          {/* Map Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Map View</h2>
            <div className="h-80 rounded-lg overflow-hidden border shadow-sm">
              <ClientMap markers={mapMarkers} />
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-gray-600">
              {filteredMasters.length} master{filteredMasters.length !== 1 ? 's' : ''} found
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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMasters.map((master) => (
            <MasterCard key={master.id} master={master} />
          ))}
        </div>
      )}
    </div>
  );
}