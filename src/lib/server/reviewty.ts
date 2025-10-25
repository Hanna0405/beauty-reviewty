export type CityNormalized = {
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

export type PublicCardPayload = {
  name: string; // master display name
  services: { key: string; name: string; emoji?: string }[];
  serviceKeys: string[]; // mirrors
  serviceNames: string[]; // mirrors
  languages: { key: string; name: string; emoji?: string }[];
  languageKeys: string[]; // mirrors
  languageNames: string[]; // mirrors
  city: CityNormalized;
  cityKey: string;
  cityName: string;
};

export type ReviewPayload = {
  rating: number; // 1..5
  text: string;
  photos: string[]; // downloadURLs from Firebase Storage
};

export function assertCity(x: any): asserts x is CityNormalized {
  if (
    !x || typeof x !== 'object' ||
    typeof x.city !== 'string' ||
    typeof x.country !== 'string' ||
    typeof x.countryCode !== 'string' ||
    typeof x.formatted !== 'string' ||
    typeof x.placeId !== 'string' ||
    typeof x.slug !== 'string' ||
    typeof x.lat !== 'number' ||
    typeof x.lng !== 'number'
  ) {
    throw new Error('Invalid city object');
  }
}

export function sanitizePublicCardPayload(x: any): PublicCardPayload {
  if (!x || typeof x !== 'object') throw new Error('Invalid payload');
  const name = String(x.name || '').trim();
  if (!name) throw new Error('Name is required');

  const services = Array.isArray(x.services) ? x.services : [];
  const languages = Array.isArray(x.languages) ? x.languages : [];
  const serviceKeys = Array.isArray(x.serviceKeys) ? x.serviceKeys : (services || []).map((s:any)=>s.key).filter(Boolean);
  const serviceNames = Array.isArray(x.serviceNames) ? x.serviceNames : (services || []).map((s:any)=>s.name).filter(Boolean);
  const languageKeys = Array.isArray(x.languageKeys) ? x.languageKeys : (languages || []).map((l:any)=>l.key).filter(Boolean);
  const languageNames = Array.isArray(x.languageNames) ? x.languageNames : (languages || []).map((l:any)=>l.name).filter(Boolean);

  assertCity(x.city);
  const city = x.city;
  const cityKey = String(x.cityKey || city.slug);
  const cityName = String(x.cityName || city.formatted);

  return { name, services, serviceKeys, serviceNames, languages, languageKeys, languageNames, city, cityKey, cityName };
}

export function sanitizeReviewPayload(x: any): ReviewPayload {
  const rating = Number(x.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error('Invalid rating 1..5');

  const text = String(x.text || '').trim();
  const photos = Array.isArray(x.photos) ? x.photos.filter((u:string)=>typeof u==='string' && u.startsWith('http')) : [];

  return { rating, text, photos };
}
