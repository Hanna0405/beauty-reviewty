// @ts-nocheck
'use client';
export type CityNorm = {
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
};

function get(ac: google.maps.GeocoderAddressComponent[] | undefined, type: string) {
  if (!ac) return undefined;
  const comp = ac.find(c => c.types.includes(type));
  return comp?.long_name;
}
function getShort(ac: google.maps.GeocoderAddressComponent[] | undefined, type: string) {
  if (!ac) return undefined;
  const comp = ac.find(c => c.types.includes(type));
  return comp?.short_name;
}
function slugify(input: string) {
  return input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
export function toCitySlug(city: string, countryCode?: string, stateCode?: string) {
  const base = slugify(city);
  const cc = countryCode ? `-${countryCode.toLowerCase()}` : '';
  const sc = stateCode ? `-${stateCode.toLowerCase()}` : '';
  return (countryCode === 'CA' || countryCode === 'US') ? `${base}${cc}${sc}` : `${base}${cc}`;
}
export function normalizePlace(place: google.maps.places.PlaceResult) {
  if (!place || !place.address_components || !place.geometry?.location || !place.place_id) return null;
  const ac = place.address_components;
  const city = get(ac, 'locality') || get(ac, 'postal_town') || place.name || '';
  const state = get(ac, 'administrative_area_level_1');
  const stateCode = getShort(ac, 'administrative_area_level_1');
  const country = get(ac, 'country') || '';
  const countryCode = getShort(ac, 'country') || '';
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const formatted = [city, state, country].filter(Boolean).join(', ');
  const slug = toCitySlug(city, countryCode, stateCode);
  return { city, state, stateCode, country, countryCode, formatted, lat, lng, placeId: place.place_id!, slug };
}