import type { NeighborhoodValue } from "./types";
import { getNeighborhoodFromDoc } from "./parse";

const SEPARATOR = " • ";

/**
 * UI-only location label: "Toronto • Yorkville" or city alone.
 * Never substitutes neighborhood for city.
 */
export function formatCityWithNeighborhood(
  cityName: string,
  neighborhood: NeighborhoodValue | null | undefined
): string {
  const city = String(cityName || "").trim();
  const hoodName = String(neighborhood?.name || "").trim();

  if (!city) return hoodName;
  if (!hoodName) return city;
  return `${city}${SEPARATOR}${hoodName}`;
}

/** City string from listing mirrors / city object — does not include neighborhood. */
export function cityNameFromDoc(doc: Record<string, unknown> | null | undefined): string {
  if (!doc) return "";
  const city = doc.city;
  if (typeof doc.cityName === "string" && doc.cityName.trim()) {
    return doc.cityName.trim();
  }
  if (typeof city === "string") return city.trim();
  if (city && typeof city === "object") {
    const c = city as { formatted?: string; name?: string; city?: string };
    return String(c.formatted || c.name || c.city || "").trim();
  }
  return "";
}

/** Full location for cards and listing detail UI (not SEO). */
export function listingLocationLabel(doc: Record<string, unknown> | null | undefined): string {
  if (!doc) return "";
  const city = cityNameFromDoc(doc);
  const neighborhood = getNeighborhoodFromDoc(doc);
  return formatCityWithNeighborhood(city, neighborhood);
}
