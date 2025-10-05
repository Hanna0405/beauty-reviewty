'use client';
import { useEffect, useRef } from 'react';
import { useGoogleMapsLoaded } from '@/lib/mapsLoader';

type Marker = { lat: number; lng: number; title?: string };

export default function MastersMap({
  center = { lat: 43.65107, lng: -79.347015 }, // Toronto fallback
  zoom = 10,
  markers = [],
  className = 'h-80 w-full rounded-md border',
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Marker[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useGoogleMapsLoaded();

  useEffect(() => {
    if (!isLoaded || !window.google?.maps || !ref.current) return;
    const map = new window.google.maps.Map(ref.current, {
      center,
      zoom,
      mapId: undefined, // keep default; don't require custom mapId
      gestureHandling: 'greedy',
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    });

    markers.forEach((m) => {
      new window.google.maps.Marker({
        map,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
      });
    });

    return () => {
      // no explicit destroy required; GC will clean up
    };
  }, [isLoaded, center.lat, center.lng, zoom, JSON.stringify(markers)]);

  if (loadError) {
    return (
      <div className={`${className} grid place-items-center text-sm text-red-600`}>
        Google Maps failed to load. Check API key, billing, and "Places API" enablement.
      </div>
    );
  }

  return <div ref={ref} className={className} />;
}
