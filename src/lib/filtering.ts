// src/lib/filtering.ts
export type CityLike = string | { name?: string } | null | undefined;

export function normalizeCity(value: any): { cityName?: string; cityKey?: string; placeId?: string } {
  if (!value) return {};
  if (typeof value === 'string') return { cityName: value, cityKey: value.toLowerCase().replace(/\s+/g, '-') };
  return {
    cityName: value?.name ?? value?.label ?? value?.cityName ?? value?.formatted,
    cityKey: value?.key ?? value?.cityKey ?? value?.slug,
    placeId: value?.placeId ?? value?.place_id
  };
}

export function toLowerSet(arr?: string[] | null) {
  return new Set((arr ?? []).map(s => (s ?? '').toString().toLowerCase()));
}

// item can store services/languages as ["Nails","Hair Braids"] OR [{value,label}, ...] OR use mirror fields
export function extractStringArray(field: any, mirrorField?: any): string[] {
  // Prefer mirror field if available (new format)
  if (mirrorField && Array.isArray(mirrorField)) {
    return mirrorField.filter(Boolean);
  }
  
  // Fallback to original field (old format)
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map((v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') return (v.value ?? v.label ?? '').toString();
      return '';
    }).filter(Boolean);
  }
  return [];
}

export type CommonFilters = {
  city?: string;
  cityPlaceId?: string;
  services?: string[];
  languages?: string[];
  minRating?: number;
  // optional masters-only:
  name?: string;
};

export function matchesAllFilters(item: any, f: CommonFilters, isMaster: boolean): boolean {
  // City
  const itemCity = normalizeCity(item?.city);
  if (f.cityPlaceId && itemCity.placeId && itemCity.placeId !== f.cityPlaceId) return false;
  else if (!f.cityPlaceId && f.city && itemCity.cityName && itemCity.cityName !== f.city) return false;

  // Rating
  if (typeof f.minRating === 'number') {
    const r = typeof item?.rating === 'number' ? item.rating : -Infinity;
    if (r < f.minRating) return false;
  }

  // Services - prefer mirror fields, fallback to original
  if (f.services && f.services.length) {
    const src = toLowerSet(extractStringArray(item?.services, item?.serviceNames));
    const needs = toLowerSet(f.services);
    // require overlap
    let ok = false;
    for (const s of needs) { if (src.has(s)) { ok = true; break; } }
    if (!ok) return false;
  }

  // Languages - prefer mirror fields, fallback to original
  if (f.languages && f.languages.length) {
    const src = toLowerSet(extractStringArray(item?.languages, item?.languageNames));
    const needs = toLowerSet(f.languages);
    let ok = false;
    for (const s of needs) { if (src.has(s)) { ok = true; break; } }
    if (!ok) return false;
  }

  // Name (masters only, substring CI)
  if (isMaster && f.name && f.name.trim()) {
    const t = f.name.trim().toLowerCase();
    const name = (item?.displayName ?? '').toString().toLowerCase();
    if (!name.includes(t)) return false;
  }

  return true;
}
