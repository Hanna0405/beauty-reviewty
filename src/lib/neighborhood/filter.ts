import { neighborhoodSlug } from "./slug";

function norm(v?: string | null): string {
  return v ? v.toLowerCase().trim() : "";
}

export function docCityKey(doc: Record<string, unknown> | null | undefined): string {
  if (!doc) return "";
  const city = doc.city as { slug?: string } | string | undefined;
  return norm(
    String(
      doc.cityKey ||
        doc.citySlug ||
        (typeof city === "object" && city?.slug ? city.slug : "") ||
        ""
    )
  );
}

export function docCityName(doc: Record<string, unknown> | null | undefined): string {
  if (!doc) return "";
  const city = doc.city;
  if (typeof doc.cityName === "string") return norm(doc.cityName);
  if (typeof city === "string") return norm(city);
  if (city && typeof city === "object") {
    const c = city as { formatted?: string; name?: string };
    return norm(c.formatted || c.name || "");
  }
  return "";
}

export function docNeighborhoodKey(
  doc: Record<string, unknown> | null | undefined
): string {
  if (!doc) return "";
  const key = doc.neighborhoodKey;
  if (typeof key === "string" && key.trim()) return norm(key);
  const nested = doc.neighborhood as { slug?: string; name?: string } | undefined;
  if (nested?.slug) return norm(nested.slug);
  const name = doc.neighborhoodName || nested?.name;
  if (typeof name === "string" && name.trim()) {
    return neighborhoodSlug(name);
  }
  return "";
}

/** City match — same rules as existing masters/listings city filters. */
export function matchesCityKey(
  doc: Record<string, unknown>,
  cityKey: string
): boolean {
  const selectedSlug = norm(cityKey);
  if (!selectedSlug) return true;

  const itemSlug = docCityKey(doc);
  const itemName = docCityName(doc);

  if (itemSlug && itemSlug === selectedSlug) return true;
  if (itemName && itemName.startsWith(selectedSlug.split("-")[0])) return true;
  if (itemName && itemName.includes(selectedSlug)) return true;
  return false;
}

export function matchesNeighborhoodKey(
  doc: Record<string, unknown>,
  neighborhoodKey: string
): boolean {
  const selected = norm(neighborhoodKey);
  if (!selected) return true;
  const itemKey = docNeighborhoodKey(doc);
  if (!itemKey) return false;
  return itemKey === selected;
}

/** Apply cityKey first, then optional neighborhoodKey. */
export function filterByCityThenNeighborhood<T extends Record<string, unknown>>(
  items: T[],
  opts: { cityKey?: string | null; neighborhoodKey?: string | null }
): T[] {
  let result = items;
  if (opts.cityKey) {
    result = result.filter((item) => matchesCityKey(item, opts.cityKey!));
  }
  if (opts.neighborhoodKey) {
    result = result.filter((item) =>
      matchesNeighborhoodKey(item, opts.neighborhoodKey!)
    );
  }
  return result;
}
