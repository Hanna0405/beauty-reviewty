'use client';
import { useEffect, useRef, useState } from 'react';
import { ensureMapsLib } from '@/lib/googleMaps';

type LatLng = { lat: number; lng: number };
type MarkerItem = { id: string; position: LatLng; title?: string };

type Props = {
  center: LatLng;
  markers?: MarkerItem[];
  zoom?: number;
  className?: string;
};

export default function Map({ center, markers = [], zoom = 11, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    let map: google.maps.Map | null = null;
    let gMarkers: google.maps.Marker[] = [];

    ensureMapsLib().then(() => {
      if (!ref.current) return;
      try {
        map = new google.maps.Map(ref.current!, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // add markers
        gMarkers = markers.map(m => new google.maps.Marker({ position: m.position, map: map!, title: m.title }));
        if (gMarkers.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          gMarkers.forEach(m => bounds.extend(m.getPosition()!));
          map!.fitBounds(bounds);
        }
      } catch (e: any) {
        setMapError(e?.message || "Google Maps failed to load. Check API key, billing, and referrer.");
      }
    }).catch((e: any) => {
      setMapError(e?.message || "Google Maps failed to load. Check API key, billing, and referrer.");
    });

    return () => {
      gMarkers.forEach(m => m.setMap(null));
      map = null;
    };
  }, [center.lat, center.lng, zoom, JSON.stringify(markers)]);

  return <div ref={ref} className={className ?? 'w-full h-[360px] rounded-lg border border-gray-200'} />;
}
