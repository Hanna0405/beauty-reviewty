'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import RequireRole from '@/components/auth/RequireRole';
import { getListingById } from '@/lib/services/firestoreMastersClient';
import { MapContainer } from '@/components/mapComponents';
import type { Listing } from '@/types';

// Dynamically import the form to disable SSR
const MasterListingForm = dynamic(() => import('@/components/masters/MasterListingForm'), { 
  ssr: false 
});

export default function EditListingPage() {
  return (
    <RequireRole role="master">
      <Content />
    </RequireRole>
  );
}

function Content() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const listingId = params?.id;
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const loadListing = async () => {
    if (!listingId) {
      setError('Invalid listing ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getListingById(listingId);
      
      if (!data) {
        setError('Listing not found');
        return;
      }

      // Verify ownership
      if (data.ownerId !== user?.uid) {
        setError('You do not have permission to edit this listing');
        return;
      }

      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/dashboard/master/listings"
            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
          >
            Back to Listings
          </a>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Listing</h1>
        <p className="text-gray-600">
          Update your service listing information and portfolio.
        </p>
      </div>

      <MapContainer>
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <MasterListingForm 
              mode="edit"
              uid={user?.uid || ''}
              listingId={listingId}
              initialData={listing}
            />
          </div>
        </div>
      </MapContainer>
    </div>
  );
}
