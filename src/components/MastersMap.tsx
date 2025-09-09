'use client';

import { useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface Master {
  id: string;
  title: string;
  lat: number;
  lng: number;
}

interface MastersMapProps {
  masters: Master[];
  onMarkerClick?: (masterId: string) => void;
}

const defaultCenter = { lat: 43.6532, lng: -79.3832 }; // Toronto

export default function MastersMap({ masters, onMarkerClick }: MastersMapProps) {
  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const options = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  // Calculate center based on markers or use default
  const center = useMemo(() => {
    if (masters.length === 0) return defaultCenter;
    
    // Only use google.maps if it's available (when wrapped by GoogleMapsLoader)
    if (typeof window !== 'undefined' && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      masters.forEach(master => {
        bounds.extend({ lat: master.lat, lng: master.lng });
      });
      
      return bounds.getCenter().toJSON();
    }
    
    // Fallback: calculate center manually
    const totalLat = masters.reduce((sum, master) => sum + master.lat, 0);
    const totalLng = masters.reduce((sum, master) => sum + master.lng, 0);
    return {
      lat: totalLat / masters.length,
      lng: totalLng / masters.length
    };
  }, [masters]);

  // Calculate zoom level based on markers
  const zoom = useMemo(() => {
    if (masters.length === 0) return 10;
    if (masters.length === 1) return 12;
    return 11; // Default zoom for multiple markers
  }, [masters]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={options}
    >
      {masters.map((master) => (
        <Marker
          key={master.id}
          position={{ lat: master.lat, lng: master.lng }}
          title={master.title}
          onClick={() => onMarkerClick?.(master.id)}
        />
      ))}
    </GoogleMap>
  );
}
