'use client';
import React, { useEffect, useRef } from 'react';

type MapPreviewProps = {
  lat?: number;
  lng?: number;
  zoom?: number;
  className?: string;
};

export default function MapPreview({ lat, lng, zoom = 12, className }: MapPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;
    if (lat == null || lng == null) return;

    const g = (window as any).google;
    if (!g?.maps) return;

    const map = new g.maps.Map(ref.current, {
      center: { lat, lng }, zoom,
      disableDefaultUI: true, gestureHandling: 'none',
    });
    new g.maps.Marker({ position: { lat, lng }, map });
  }, [lat, lng, zoom]);

  const hasCoords = lat != null && lng != null;

  return (
    <div className={['overflow-hidden rounded-xl border bg-white/60', className].filter(Boolean).join(' ')}>
      <div className="p-3 text-sm font-medium">Location</div>
      <div className="h-64 w-full" ref={ref}>
        {!hasCoords && (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Location is not provided.
          </div>
        )}
        {hasCoords && !(typeof window !== 'undefined' && (window as any).google?.maps) && (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Map is unavailable right now.
          </div>
        )}
      </div>
    </div>
  );
}
