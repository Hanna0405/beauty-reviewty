'use client';
import { useGoogleMapsLoaded } from '@/lib/mapsLoader';

export function useGoogleMapsLoader() {
  const { isLoaded, loadError } = useGoogleMapsLoaded();
  const status = loadError ? 'error' : isLoaded ? 'ready' : 'loading';
  return { status, google: (typeof window !== 'undefined' ? (window as any).google : undefined) as typeof google | undefined };
}