export type NormalizedCity = {
  city: string;
  state?: string;
  stateCode?: string;
  country: string;
  countryCode: string;
  formatted: string;
  lat: number;
  lng: number;
  placeId: string;
  slug: string;
  // mirrors for UI/filters
  cityName: string; // == formatted
  cityKey: string; // == slug
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export function normalizeFromPlace(details: google.maps.places.PlaceResult): NormalizedCity {
  const comps = details.address_components || [];
  const byType = (t: string) => comps.find(c => c.types.includes(t));

  const locality = byType('locality') || byType('postal_town') || byType('administrative_area_level_3');
  const admin1 = byType('administrative_area_level_1');
  const country = byType('country');

  const city = locality?.long_name || details.name || '';
  const state = admin1?.long_name || '';
  const stateCode = admin1?.short_name || '';
  const countryName = country?.long_name || '';
  const countryCode = country?.short_name || '';

  const lat = details.geometry?.location?.lat() ?? 0;
  const lng = details.geometry?.location?.lng() ?? 0;

  const formatted = [city, stateCode || state, countryName].filter(Boolean).join(', ');
  const slug = slugify([city, stateCode || state, countryName].filter(Boolean).join(' '));

  return {
    city,
    state,
    stateCode,
    country: countryName,
    countryCode: countryCode || '',
    formatted,
    lat,
    lng,
    placeId: details.place_id || '',
    slug,
    // mirrors
    cityName: formatted,
    cityKey: slug,
  };
}
