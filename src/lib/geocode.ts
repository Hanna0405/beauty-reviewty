export type GeocodeResult = { lat: number; lng: number; name: string };

export async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return null;
    const loc = r.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch (error) {
    console.error('Error geocoding city:', error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function geocodeCityLegacy(q: string): Promise<GeocodeResult | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  return (await res.json()) as GeocodeResult;
}
