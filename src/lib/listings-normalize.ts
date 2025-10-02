export type PhotoItem = { url: string; path: string };

export function asArray<T = any>(v: any, fallback: T[] = []): T[] {
  return Array.isArray(v) ? v : (v ? [v] : fallback);
}

// Accepts Firestore doc.data() and returns safe object for the form
export function normalizeListing(raw: any) {
  const photosRaw = raw?.photos ?? [];
  const photos: PhotoItem[] = Array.isArray(photosRaw)
    ? photosRaw
        .filter(Boolean)
        .map((p: any) => ({ url: String(p?.url || ''), path: String(p?.path || '') }))
        .filter(p => p.url && p.path)
    : [];

  // city may be: null | string (old) | object (new)
  let city = raw?.city ?? null;
  if (city && typeof city === 'string') {
    // legacy string -> minimal object for UI
    city = { formatted: city, slug: '', city: city };
  } else if (city && typeof city === 'object') {
    // leave as is, but don't crash if fields are missing
    city = {
      city: String(city.city || ''),
      state: city.state ?? undefined,
      stateCode: city.stateCode ?? undefined,
      country: String(city.country || ''),
      countryCode: String(city.countryCode || ''),
      formatted: String(city.formatted || city.city || ''),
      lat: typeof city.lat === 'number' ? city.lat : 0,
      lng: typeof city.lng === 'number' ? city.lng : 0,
      placeId: String(city.placeId || ''),
      slug: String(city.slug || ''),
    };
  } else {
    city = null;
  }

  return {
    id: raw?.id || '',
    title: String(raw?.title || ''),
    description: String(raw?.description || ''),
    minPrice: Number.isFinite(raw?.minPrice) ? Number(raw.minPrice) : 0,
    maxPrice: Number.isFinite(raw?.maxPrice) ? Number(raw.maxPrice) : 0,
    services: asArray(raw?.services, []), // arrays guaranteed
    languages: asArray(raw?.languages, []),
    city,
    cityKey: typeof raw?.cityKey === 'string' ? raw.cityKey : (city?.slug || null),
    cityName: typeof raw?.cityName === 'string' ? raw.cityName : (city?.formatted || null),
    photos,
  };
}
