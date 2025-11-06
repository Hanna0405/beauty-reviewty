/* src/lib/googleMaps.ts */
'use client';

declare const google: any;

// Single, idempotent loader for Google Maps JS API (with Places + Marker)
export async function ensureMapsLib(): Promise<typeof google.maps> {
if (typeof window === 'undefined') {
throw new Error('ensureMapsLib must run on the client');
}
// already loaded
if (window.google?.maps) return window.google.maps;

const existing = document.querySelector('script[data-gmaps-loader="1"]') as HTMLScriptElement | null;
if (!existing) {
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!key) throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

const url =
`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
`&libraries=places,marker&v=weekly`;

const s = document.createElement('script');
s.src = url;
(s as any).dataset.gmapsLoader = '1';
s.async = true;
s.defer = true;
document.head.appendChild(s);
}

// wait until window.google.maps appears
await new Promise<void>((resolve, reject) => {
const start = Date.now();
const timer = setInterval(() => {
if (window.google?.maps) {
clearInterval(timer);
resolve();
} else if (Date.now() - start > 15000) {
clearInterval(timer);
reject(new Error('Google Maps failed to load'));
}
}, 50);
});

return window.google!.maps as typeof google.maps;
}