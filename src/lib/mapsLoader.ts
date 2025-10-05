'use client';
import { useJsApiLoader } from '@react-google-maps/api';

export const MAP_LIBRARIES = ['places'] as const;

export function useGoogleMapsLoaded() {
  const key = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  return useJsApiLoader({ id: 'br-google-maps', googleMapsApiKey: key, libraries: MAP_LIBRARIES as any });
}