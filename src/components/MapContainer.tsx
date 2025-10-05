'use client';
import React from 'react';
import { useGoogleMapsLoaded } from '@/lib/mapsLoader';

export default function MapContainer({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useGoogleMapsLoaded();
  if (loadError) return <div className="text-sm text-red-600">Google Maps failed to load.</div>;
  if (!isLoaded) return <div className="text-sm text-gray-500">Loading…</div>;
  return <>{children}</>;
}
