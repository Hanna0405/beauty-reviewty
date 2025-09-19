let mapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string, language = 'en', region = 'CA') {
  if (typeof window === 'undefined') return Promise.reject('window is undefined');
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) return resolve(google);

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      language,
      region,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onload = () => resolve(google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return mapsPromise;
}
