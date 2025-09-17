'use client';
import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/mapsLoader';

export type MasterPin = { id: string; displayName: string; geo?: { lat: number; lng: number } };

export default function MastersMap({ items }: { items: MasterPin[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: google.maps.Map | null = null;
    loadGoogleMaps().then((g) => {
      if (!ref.current) return;
      const valid = items.filter(i => i.geo && typeof i.geo.lat === 'number' && typeof i.geo.lng === 'number');
      map = new g.maps.Map(ref.current!, {
        zoom: 10,
        center: valid[0]?.geo ?? { lat: 43.6532, lng: -79.3832 }, // Toronto default
      });
      valid.forEach(i => new g.maps.Marker({ position: i.geo!, map: map!, title: i.displayName }));
    }).catch(() => {/* ignore */});
    return () => { map = null; };
  }, [items]);

  return <div ref={ref} className="h-[320px] w-full rounded-md border" />;
}