"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    _gmapsLoader?: Promise<void>;
    google?: any;
  }
}

export function useGoogleMaps() {
  const [ready, setReady] = useState<boolean>(typeof window !== "undefined" && !!(window as any).google);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) return;

    // If already loading, reuse the promise
    if (window._gmapsLoader) {
      window._gmapsLoader
        .then(() => setReady(true))
        .catch((err) => setError(err.message));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const errorMsg = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    window._gmapsLoader = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      s.async = true;
      s.onload = () => {
        setReady(true);
        resolve();
      };
      s.onerror = () => {
        const errorMsg = "Failed to load Google Maps API";
        setError(errorMsg);
        reject(new Error(errorMsg));
      };
      document.body.appendChild(s);
    });
  }, [ready]);

  return { ready, error };
}