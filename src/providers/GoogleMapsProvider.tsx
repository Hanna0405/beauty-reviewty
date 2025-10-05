"use client";
import React, { createContext, useContext } from "react";
import { useGoogleMapsLoaded } from '@/lib/mapsLoader';

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
  const { isLoaded, loadError } = useGoogleMapsLoaded();

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, error: loadError ? "Failed to load Google Maps API" : null }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
