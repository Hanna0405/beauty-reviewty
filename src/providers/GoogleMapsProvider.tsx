"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import Script from "next/script";

interface GoogleMapsContextType {
  isLoaded: boolean;
  error: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  error: null,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within GoogleMapsProvider");
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(null);
  };

  const handleError = () => {
    setError("Failed to load Google Maps API");
    setIsLoaded(false);
  };

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, error }}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={handleLoad}
        onError={handleError}
      />
      {children}
    </GoogleMapsContext.Provider>
  );
}
