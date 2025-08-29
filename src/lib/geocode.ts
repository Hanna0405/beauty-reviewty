export type GeocodeResult = { lat: number; lng: number; name: string };

export async function geocodeCity(q: string): Promise<GeocodeResult | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  return (await res.json()) as GeocodeResult;
}
