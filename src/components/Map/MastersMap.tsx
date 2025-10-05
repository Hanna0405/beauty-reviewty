'use client';
import { useEffect, useRef } from 'react';
import { useGoogleMapsLoaded } from '@/lib/mapsLoader';

export type MasterPin = { id: string; displayName: string; geo?: { lat: number; lng: number } };

export default function MastersMap({ items }: { items: MasterPin[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isLoaded } = useGoogleMapsLoaded();

  useEffect(() => {
    if (!isLoaded || !ref.current || !window.google?.maps) return;
    
    let map: google.maps.Map | null = null;
    const valid = items.filter(i => i.geo && typeof i.geo.lat === 'number' && typeof i.geo.lng === 'number');
    map = new window.google.maps.Map(ref.current, {
      zoom: 10,
      center: valid[0]?.geo ?? { lat: 43.6532, lng: -79.3832 }, // Toronto default
    });
    valid.forEach(i => new window.google.maps.Marker({ position: i.geo!, map: map!, title: i.displayName }));
    
    return () => { map = null; };
  }, [items, isLoaded]);

  if (!isLoaded) {
    return <div className="h-[320px] w-full rounded-md border flex items-center justify-center text-gray-500">Loading map...</div>;
  }

  return <div ref={ref} className="h-[320px] w-full rounded-md border" />;
}