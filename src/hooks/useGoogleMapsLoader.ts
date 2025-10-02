'use client';
import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
let globalLoader: Loader | null = null;
let globalPromise: Promise<typeof google> | null = null;

export function useGoogleMapsLoader() {
  const [status, setStatus] = useState<LoadStatus>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
      setStatus('error');
      return;
    }
    if (!globalLoader) {
      globalLoader = new Loader({
        apiKey: key,
        version: 'weekly',
        libraries: ['places'],
        language: 'en',
        region: 'CA',
      });
    }
    setStatus('loading');
    if (!globalPromise) {
      globalPromise = globalLoader.load()
        .then(() => window.google)
        .catch((e) => {
          console.error('Google Maps JS API failed to load', e);
          setStatus('error');
          throw e;
        });
    }
    globalPromise.then(() => setStatus('ready')).catch(() => setStatus('error'));
  }, []);

  return { status, google: (typeof window !== 'undefined' ? (window as any).google : undefined) as typeof google | undefined };
}