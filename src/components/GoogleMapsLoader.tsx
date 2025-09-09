'use client';

import { useJsApiLoader } from '@react-google-maps/api';

// Static libraries constant to prevent "LoadScript has been reloaded" warnings
const libraries = ['places'] as const;

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

export default function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined');
    return <div>Google Maps API key is missing</div>;
  }

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries as any
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
