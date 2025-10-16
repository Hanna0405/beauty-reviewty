export type CityObject = {
  // normalized object from our CityAutocomplete pattern (keys may vary)
  name?: string; // e.g., "Toronto"
  formatted?: string; // e.g., "Toronto, ON, Canada"
  city?: string; // sometimes used
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  slug?: string;
};

export type CityValue = string | CityObject | null | undefined;

