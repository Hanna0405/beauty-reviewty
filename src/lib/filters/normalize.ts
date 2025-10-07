export type OptionObj = { key: string; name?: string; emoji?: string } | string;
export type PickOpt = { key?: string; name?: string; emoji?: string } | string;
export type OptionLike = { key?: string; name?: string; emoji?: string } | string | null | undefined;

function slugifyKey(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toKey(x: OptionLike): string | null {
  if (!x) return null;
  if (typeof x === "string") return slugifyKey(x);
  if (typeof x === "object") {
    const raw = (x as any).key ?? (x as any).name;
    if (typeof raw === "string") return slugifyKey(raw);
  }
  return null;
}

export function selectedToKeys(arr: PickOpt[] | undefined | null): string[] {
  const out = (arr ?? []).map(toKey).filter(Boolean) as string[];
  return Array.from(new Set(out));
}

// --- Deep path helpers ---
export function getAtPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, p) => (acc == null ? acc : acc[p]), obj);
}

export function firstNonEmpty<T = any>(obj: any, paths: string[], predicate: (v: any) => boolean): T | undefined {
  for (const p of paths) {
    const v = getAtPath(obj, p);
    if (predicate(v)) return v as T;
  }
  return undefined;
}

// --- Helper to map arrays to keys ---
function mapToKeys(arr: any[], keyProp = "key", nameProp = "name"): string[] {
  return arr
    .map((x: any) => {
      if (typeof x === "string") return slugifyKey(x);
      if (x && typeof x === "object") {
        const raw = x[keyProp] ?? x[nameProp];
        return typeof raw === "string" ? slugifyKey(raw) : null;
      }
      return null;
    })
    .filter(Boolean) as string[];
}

export function normalizeSelectedServiceKeys(selected: OptionObj[] | undefined | null): string[] {
  return selectedToKeys(selected as any);
}

export function normalizeSelectedLanguageKeys(selected: OptionObj[] | undefined | null): string[] {
  return selectedToKeys(selected as any);
}

export function ensureKeyObject<T extends {key?: string; name?: string; emoji?: string}>(x: any): T | null {
  // For selects that might return plain strings, upgrade to {key}
  if (!x) return null as any;
  if (typeof x === "string") return { key: slugifyKey(x) || x } as any;
  if (typeof x === "object") {
    const key = toKey(x as any);
    return key ? { ...(x as any), key } : null as any;
  }
  return null as any;
}

// Document key extractors with fallbacks for different storage formats (shallow - for backward compatibility)
export function docServiceKeys(x: any): string[] {
  // prefer mirrors; fallback to objects/names if mirrors are missing
  if (Array.isArray(x?.serviceKeys) && x.serviceKeys.length) return x.serviceKeys as string[];
  if (Array.isArray(x?.services) && x.services.length) {
    return x.services.map((s: any) => (s?.key ?? s?.name) ? slugifyKey(String(s.key ?? s.name)) : null).filter(Boolean) as string[];
  }
  if (Array.isArray(x?.serviceNames) && x.serviceNames.length) {
    return x.serviceNames.map((n: any) => slugifyKey(String(n))).filter(Boolean);
  }
  return [];
}

export function docLanguageKeys(x: any): string[] {
  if (Array.isArray(x?.languageKeys) && x.languageKeys.length) return x.languageKeys as string[];
  if (Array.isArray(x?.languages) && x.languages.length) {
    return x.languages.map((l: any) => (l?.key ?? l?.name) ? slugifyKey(String(l.key ?? l.name)) : null).filter(Boolean) as string[];
  }
  if (Array.isArray(x?.languageNames) && x.languageNames.length) {
    return x.languageNames.map((n: any) => slugifyKey(String(n))).filter(Boolean);
  }
  if (Array.isArray(x?.languageCodes) && x.languageCodes.length) return x.languageCodes as string[];
  return [];
}

// Deep extractors - check nested paths like profile.serviceKeys, details.serviceKeys, etc.
export function docServiceKeysDeep(x: any): string[] {
  // candidate paths to arrays of strings:
  const stringArray = firstNonEmpty<string[]>(x,
    ["serviceKeys", "servicesKeys", "profile.serviceKeys", "details.serviceKeys", "data.serviceKeys"],
    v => Array.isArray(v) && v.every((s: any) => typeof s === "string")
  );
  if (stringArray) return stringArray;

  // candidate paths to arrays of objects:
  const objArray = firstNonEmpty<any[]>(x,
    ["services", "profile.services", "details.services", "data.services"],
    v => Array.isArray(v) && v.length > 0 && typeof v[0] === "object"
  );
  if (objArray) return mapToKeys(objArray);

  // names fallback:
  const nameArray = firstNonEmpty<any[]>(x,
    ["serviceNames", "profile.serviceNames", "details.serviceNames", "data.serviceNames"],
    v => Array.isArray(v)
  );
  if (nameArray) return mapToKeys(nameArray);

  return [];
}

export function docLanguageKeysDeep(x: any): string[] {
  const stringArray = firstNonEmpty<string[]>(x,
    ["languageKeys", "languagesKeys", "profile.languageKeys", "details.languageKeys", "data.languageKeys", "languageCodes", "profile.languageCodes"],
    v => Array.isArray(v) && v.every((s: any) => typeof s === "string")
  );
  if (stringArray) return stringArray;

  const objArray = firstNonEmpty<any[]>(x,
    ["languages", "profile.languages", "details.languages", "data.languages"],
    v => Array.isArray(v) && v.length > 0 && typeof v[0] === "object"
  );
  if (objArray) return mapToKeys(objArray);

  const nameArray = firstNonEmpty<any[]>(x,
    ["languageNames", "profile.languageNames", "details.languageNames", "data.languageNames"],
    v => Array.isArray(v)
  );
  if (nameArray) return mapToKeys(nameArray);

  return [];
}

/** Extract cityKey from many possible shapes. If nothing valid — return undefined (no city filter). */
export function extractCityKey(input: any): string | undefined {
  if (!input) return undefined;

  const direct =
    input.cityKey ||
    input.slug ||
    input.value?.cityKey ||
    input.value?.slug ||
    input.selection?.cityKey ||
    input.selection?.slug ||
    input.normalized?.slug;

  if (typeof direct === "string" && direct.trim()) return direct.trim().toLowerCase();

  // Try to build slug from parts
  const city =
    input.city ||
    input.name ||
    input.formatted ||
    input.cityName ||
    input.value?.formatted ||
    input.value?.cityName;
  const state = input.stateCode || input.state || input.value?.stateCode;
  const country = input.countryCode || input.country || input.value?.countryCode;

  if (city && state && country) {
    return slugifyKey(`${city}-${state}-${country}`);
  }
  return undefined;
}

/** Extract region-only key from full city key. Example: "vaughan-ca-on" -> "-ca-on" */
export function toRegionKey(fullKey?: string | null): string | undefined {
  // "vaughan-ca-on" -> "-ca-on"
  if (!fullKey) return undefined;
  const parts = String(fullKey).toLowerCase().split("-").filter(Boolean);
  if (parts.length < 2) return undefined;
  const country = parts[parts.length - 2]; // "ca"
  const state = parts[parts.length - 1]; // "on"
  if (!country || !state) return undefined;
  return `-${country}-${state}`;
}

/** Robust comparator: consider exact match, startsWith, contains (to handle city vs province slugs) */
export function cityKeyMatches(docKey?: string, filterKey?: string): boolean {
  if (!filterKey) return true; // no city selected → pass
  if (!docKey) return false; // city selected, but doc has none → fail
  const a = String(docKey).toLowerCase();
  const b = String(filterKey).toLowerCase();
  return a === b || a.startsWith(b) || b.startsWith(a) || a.includes(b) || b.includes(a);
}

/** Read cityKey from many common locations inside the doc */
export function docCityKeyDeep(x: any): string | undefined {
  if (!x) return undefined;

  // Try to find normalized city key
  const direct =
    x.cityKey ||
    x.slug ||
    x.city?.cityKey ||
    x.city?.slug ||
    x.profile?.cityKey ||
    x.profile?.city?.cityKey ||
    x.data?.cityKey ||
    x.data?.city?.cityKey;

  if (typeof direct === "string" && direct.trim()) return direct.trim().toLowerCase();

  // Try to fallback to a built slug
  const formatted =
    x.city?.formatted ||
    x.cityName ||
    x.formatted ||
    x.profile?.cityName ||
    x.data?.cityName;

  const state = x.city?.stateCode || x.stateCode || x.profile?.stateCode;
  const country = x.city?.countryCode || x.countryCode || x.profile?.countryCode;

  if (formatted && state && country) {
    return slugifyKey(`${formatted}-${state}-${country}`);
  }

  return undefined;
}

/** Normalize city selection to a consistent format with cityKey and formatted name */
export function normalizeCitySelection(raw: any): { cityKey?: string; formatted?: string } | null {
  if (!raw) return null;
  
  const key =
    raw.cityKey || raw.slug || raw.value?.cityKey || raw.value?.slug ||
    raw.selection?.cityKey || raw.selection?.slug || raw.normalized?.slug;

  if (typeof key === "string" && key.trim()) {
    return { 
      cityKey: key.trim(), 
      formatted: raw.formatted || raw.value?.formatted || raw.name || raw.city || undefined 
    };
  }

  // Fallback: try to make a slug from city/state/country (only if all present)
  const city = raw.city || raw.name || raw.formatted || raw.value?.formatted;
  const stateCode = raw.stateCode || raw.value?.stateCode || raw.state?.code;
  const countryCode = raw.countryCode || raw.value?.countryCode || raw.country?.code;
  
  if (city && stateCode && countryCode) {
    return { 
      cityKey: slugifyKey(`${city}-${stateCode}-${countryCode}`), 
      formatted: String(city) 
    };
  }
  
  return null;
}

