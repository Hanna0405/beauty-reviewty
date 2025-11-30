'use client';

import { useEffect } from 'react';

export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('[PWA] Failed to register service worker:', error);
        });
    }
  }, []);

  return null;
}

