'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireRole } from '@/components/auth/guards';
import { getByOwner } from '@/lib/services/firestoreMasters';
import type { Master } from '@/types';
import MasterProfileForm from '@/components/MasterProfileForm';

export default function MasterProfilePage() {
  return (
    <RequireRole role="master">
      <Content />
    </RequireRole>
  );
}

function Content() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<Master | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        // Check if user already has a master profile
        const masterData = await getByOwner(user.uid);

        if (masterData) {
          setMasterData(masterData);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Error loading master profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {hasProfile ? 'Edit Profile' : 'Create Profile'}
        </h1>
        <p className="text-gray-600">
          {hasProfile 
            ? 'Update your master profile information and portfolio.'
            : 'Create your master profile to start receiving bookings.'
          }
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <MasterProfileForm 
            initialUser={masterData ? {
              name: masterData.name || masterData.displayName,
              bio: masterData.bio,
              services: masterData.services || masterData.mainServices || [],
              languages: masterData.languages || [],
              priceFrom: masterData.priceFrom || masterData.priceMin,
              priceTo: masterData.priceTo || masterData.priceMax,
              city: masterData.city,
              lat: masterData.lat || masterData.location?.lat,
              lng: masterData.lng || masterData.location?.lng,
              photos: masterData.photos || masterData.photoUrls,
            } : undefined}
          />
        </div>
      </div>

      {hasProfile && masterData && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Profile Status</h3>
          <p className="text-sm text-blue-700">
            Your profile was last updated on{' '}
            {masterData.updatedAt?.toDate?.() 
              ? masterData.updatedAt.toDate().toLocaleDateString()
              : 'recently'
            }
          </p>
        </div>
      )}
    </div>
  );
}
