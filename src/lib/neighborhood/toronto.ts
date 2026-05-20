import type { CityNorm } from "@/lib/city";

/** Fixed Toronto neighborhood list (display labels). */
export const TORONTO_NEIGHBORHOODS = [
  "Yorkville",
  "Etobicoke",
  "North York",
  "Scarborough",
  "Downtown Toronto",
  "Midtown Toronto",
  "The Annex",
  "Liberty Village",
  "Queen West",
  "King West",
  "Leslieville",
  "The Beaches",
  "Rosedale",
  "Forest Hill",
  "High Park",
  "Little Italy",
  "Kensington Market",
  "Danforth",
  "Yonge and Eglinton",
  "Harbourfront",
] as const;

/** True when Google city selection is Toronto, Ontario, Canada. */
export function isTorontoCity(city: CityNorm | null | undefined): boolean {
  if (!city) return false;

  const cityName = String(city.city || "").trim().toLowerCase();
  const countryCode = String(city.countryCode || "").trim().toUpperCase();
  const stateCode = String(city.stateCode || "").trim().toUpperCase();

  if (cityName === "toronto" && countryCode === "CA" && stateCode === "ON") {
    return true;
  }

  const slug = String(city.slug || "").toLowerCase();
  if (slug.startsWith("toronto") && slug.includes("-ca") && slug.includes("-on")) {
    return true;
  }

  const formatted = String(city.formatted || "").toLowerCase();
  if (
    formatted.includes("toronto") &&
    (formatted.includes("on") || formatted.includes("ontario")) &&
    (formatted.includes("canada") || formatted.includes(", ca"))
  ) {
    return true;
  }

  return false;
}
