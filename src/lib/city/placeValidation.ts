/* eslint-disable @typescript-eslint/no-explicit-any */

/** Google place types that must not be treated as a city selection. */
const NON_CITY_PRIMARY_TYPES = new Set([
  "neighborhood",
  "sublocality",
  "sublocality_level_1",
  "sublocality_level_2",
  "premise",
  "street_address",
  "route",
  "postal_code",
  "establishment",
  "point_of_interest",
]);

/**
 * Returns true when the Google place result is a city/town (locality), not a neighborhood.
 */
export function isAcceptedCityPlace(
  place: { types?: string[]; address_components?: Array<{ types: string[]; long_name: string }>; place_id?: string } | null | undefined
): boolean {
  if (!place?.address_components?.length || !place.place_id) return false;

  const types = place.types || [];
  const primary = types[0] || "";
  if (NON_CITY_PRIMARY_TYPES.has(primary)) return false;
  if (
    types.includes("neighborhood") &&
    !types.includes("locality") &&
    !types.includes("postal_town")
  ) {
    return false;
  }

  const ac = place.address_components;
  const cityName =
    ac.find((c) => c.types.includes("locality"))?.long_name ||
    ac.find((c) => c.types.includes("postal_town"))?.long_name ||
    "";

  return Boolean(cityName.trim());
}
