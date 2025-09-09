'use client';

import React, { useEffect, useRef } from 'react';

type Marker = { 
  id: string; 
  position: { lat: number; lng: number }; 
  title?: string 
};

type Props = { 
  markers: Marker[]; 
  center: { lat: number; lng: number };
  onMarkerClick?: (id: string) => void;
};

function MapViewImpl({ markers, center, onMarkerClick }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const layerRef = useRef<Map<string, google.maps.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current) {
      const mapElement = document.getElementById("masters-map") as HTMLElement;
      if (mapElement) {
        mapRef.current = new google.maps.Map(mapElement, {
          center,
          zoom: 11,
          gestureHandling: "greedy",
        });
      }
    }
  }, []); // init once

  // Update center without recreating map
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(center);
    }
  }, [center]);

  // Incremental markers update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = layerRef.current;
    const nextIds = new Set(markers.map(m => m.id));

    // remove stale
    existing.forEach((mk, id) => {
      if (!nextIds.has(id)) { 
        mk.setMap(null); 
        existing.delete(id); 
      }
    });

    // add/update
    markers.forEach(m => {
      const prev = existing.get(m.id);
      if (prev) {
        prev.setPosition(m.position as any);
        prev.setTitle(m.title || "Master");
      } else {
        const mk = new google.maps.Marker({ 
          position: m.position as any, 
          title: m.title || "Master", 
          map 
        });
        
        if (onMarkerClick) {
          mk.addListener('click', () => {
            onMarkerClick(m.id);
          });
        }
        
        existing.set(m.id, mk);
      }
    });
  }, [markers, onMarkerClick]);

  return <div id="masters-map" className="h-full w-full" />;
}

export default React.memo(MapViewImpl);
