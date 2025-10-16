import type { CityValue, CityObject } from './types';

function pickName(obj: CityObject): string | null {
  return (
    obj?.formatted ||
    obj?.name ||
    obj?.city ||
    null
  );
}

/** Returns a human friendly string for UI; never returns [object Object] */
export function cityToDisplay(city: CityValue): string {
  if (!city) return '';
  if (typeof city === 'string') return city;
  const n = pickName(city);
  return n || '';
}

/** Returns a normalized key (mirrors) for filtering when available */
export function cityToKey(entry: any): string | null {
  // Prefer mirrors per our pattern; fall back to object.slug/placeId
  const key =
    entry?.cityKey ||
    (typeof entry?.city === 'object' ? entry.city?.slug : null) ||
    entry?.citySlug ||
    entry?.placeId ||
    null;
  return key ? String(key) : null;
}

