export type NormalizedCity = {
  city: string | null;
  state: string | null;
  stateCode: string | null;
  country: string | null;
  countryCode: string | null;
  formatted: string; // for display
  lat: number | null;
  lng: number | null;
  placeId: string;
  slug: string; // canonical key
  cityName: string; // mirror for UI (== formatted)
  cityKey: string; // mirror for filters (== slug)
};