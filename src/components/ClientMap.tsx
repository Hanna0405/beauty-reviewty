'use client';

import { useEffect, useRef, useState } from 'react';

type MarkerT = { id: string; title: string; lat: number; lng: number };
type Props = {
  markers: MarkerT[];
  me?: { lat: number; lng: number };
  onMarkerClick?: (masterId: string) => void;
};

export default function ClientMap({ markers, me, onMarkerClick }: Props) {
  const [ready, setReady] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && (window as any).google?.maps) {
        setReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkGoogleMaps, 100);
      }
    };
    checkGoogleMaps();
  }, []);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // инициализация карты один раз
  useEffect(() => {
    if (!ready) return;
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const g = (window as any).google as typeof google;
    mapRef.current = new g.maps.Map(mapDivRef.current, {
      center: { lat: 43.6532, lng: -79.3832 }, // Toronto
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  }, [ready]);

  // проставляем маркеры и делаем fitBounds
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = (window as any).google as typeof google;
    const map = mapRef.current;

    // очистить старые маркеры
    (map as any).__markers?.forEach((m: google.maps.Marker) => m.setMap(null));
    (map as any).__markers = [];

    const bounds = new g.maps.LatLngBounds();

    if (me) {
      const you = new g.maps.Marker({
        position: me,
        map,
        title: 'You are here',
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
        },
      });
      (map as any).__markers.push(you);
      bounds.extend(me);
    }

    markers.forEach((mk) => {
      const m = new g.maps.Marker({
        position: { lat: mk.lat, lng: mk.lng },
        map,
        title: mk.title,
      });

      // Add click listener if onMarkerClick is provided
      if (onMarkerClick) {
        m.addListener('click', () => {
          onMarkerClick(mk.id);
        });
      }

      (map as any).__markers.push(m);
      bounds.extend(m.getPosition()!);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 48);
    }
  }, [ready, markers, me, onMarkerClick]);

  return (
    <div
      ref={mapDivRef}
      style={{ height: 360, width: '100%' }}
      className="rounded-lg overflow-hidden border"
    />
  );
}