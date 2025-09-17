// src/lib/mapsLoader.ts
let mapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  if (typeof window === 'undefined') return Promise.reject('SSR');
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);

  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const cb = '__gm_cb_' + Math.random().toString(36).slice(2);
      (window as any)[cb] = () => resolve((window as any).google);
      const s = document.createElement('script');
      // Force English + Canada region
      const params = new URLSearchParams({
        key: String(key),
        libraries: 'places',
        language: 'en',
        region: 'CA',
        callback: cb,
      });
      s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      s.async = true;
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }
  return mapsPromise!;
}
