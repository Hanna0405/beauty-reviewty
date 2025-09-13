'use client';
import React from 'react';

interface Marker {
  lat: number;
  lng: number;
  title: string;
}

interface MapMiniProps {
  markers: Marker[];
  city?: string;
}

export default function MapMini({ markers, city }: MapMiniProps) {
  // Filter markers that have valid coordinates
  const validMarkers = markers.filter(m => m.lat && m.lng);
  
  // If no valid markers, show city-based static map
  if (validMarkers.length === 0 && city) {
    const query = encodeURIComponent(city);
    return (
      <div className="w-full h-64 rounded-lg border border-gray-200 overflow-hidden">
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${query}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${city}`}
        />
      </div>
    );
  }
  
  // If only one valid marker, show that location
  if (validMarkers.length === 1) {
    const marker = validMarkers[0];
    const query = `${marker.lat},${marker.lng}`;
    return (
      <div className="w-full h-64 rounded-lg border border-gray-200 overflow-hidden">
        <iframe
          src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${query}&zoom=12`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${marker.title}`}
        />
      </div>
    );
  }
  
  // Multiple markers - show placeholder SVG
  if (validMarkers.length > 1) {
    return (
      <div className="w-full h-64 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <div className="font-medium">{validMarkers.length} locations</div>
            <div className="text-xs text-gray-400">TODO: Replace with interactive map</div>
          </div>
        </div>
      </div>
    );
  }
  
  // No markers or city
  return (
    <div className="w-full h-64 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <div className="text-sm">No location data</div>
      </div>
    </div>
  );
}
