'use client';

import { useEffect, useRef } from 'react';

export type MasterPin = { id: string; displayName: string; geo?: { lat: number; lng: number } };

export default function InnerMap({ items = [] }: { items?: MasterPin[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: google.maps.Map | null = null;
    
    if (!window.google || !window.google.maps) {
      console.warn('[BR] Google Maps not loaded');
      return;
    }

    if (!ref.current) return;
    
    const valid = items.filter(i => i.geo && typeof i.geo.lat === 'number' && typeof i.geo.lng === 'number');
    map = new google.maps.Map(ref.current!, {
      zoom: 10,
      center: valid[0]?.geo ?? { lat: 43.6532, lng: -79.3832 }, // Toronto default
    });
    
    valid.forEach(i => new google.maps.Marker({ 
      position: i.geo!, 
      map: map!, 
      title: i.displayName 
    }));
  }, [items]);

  return (
    <div 
      ref={ref} 
      className="w-full h-64 rounded-lg border"
      style={{ minHeight: '256px' }}
    />
  );
}
