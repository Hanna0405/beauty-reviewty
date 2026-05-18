import { findServiceLabel, SERVICE_GROUPS } from "@/constants/services";

export type ResolvedCity = {
  citySlug: string;
  cityKey: string;
  cityName: string;
};

export type ResolvedService = {
  serviceSlug: string;
  serviceName: string;
  serviceKeys: string[];
};

const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "book",
  "dashboard",
  "directory",
  "home",
  "listing",
  "listings",
  "login",
  "map",
  "master",
  "masters",
  "onboarding",
  "privacy",
  "profile",
  "review",
  "reviewty",
  "settings",
  "signup",
  "terms",
  "_next",
  "favicon.ico",
]);

const CITY_DISPLAY_NAMES: Record<string, string> = {
  toronto: "Toronto",
  vancouver: "Vancouver",
  montreal: "Montreal",
  calgary: "Calgary",
  edmonton: "Edmonton",
  ottawa: "Ottawa",
  winnipeg: "Winnipeg",
  "new-york": "New York",
  "los-angeles": "Los Angeles",
};

const SERVICE_SLUG_ALIASES: Record<string, string> = {
  lash: "lashes-brows",
  lashes: "lashes-brows",
  brows: "lashes-brows",
  brow: "lashes-brows",
  nail: "nails",
  nails: "nails",
  hair: "hair",
  makeup: "makeup",
  cosmetology: "cosmetology",
  tattoo: "tattoo",
  "permanent-makeup": "makeup",
};

/** Curated slugs for related-service links (not exhaustive catalog). */
export const SEO_LANDING_SERVICE_SLUGS = [
  "nails",
  "lashes",
  "hair",
  "makeup",
  "cosmetology",
  "tattoo",
  "manicure",
  "eyelash-extensions",
  "hair-braids",
] as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function resolveCitySlug(citySlug: string): ResolvedCity | null {
  const normalized = citySlug.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return null;
  }
  if (isReservedSlug(normalized)) return null;

  return {
    citySlug: normalized,
    cityKey: normalized,
    cityName: CITY_DISPLAY_NAMES[normalized] || titleCaseSlug(normalized),
  };
}

function keysForGroup(groupId: string): string[] {
  const group = SERVICE_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.children.map((child) => child.value);
}

export function resolveServiceSlug(serviceSlug: string): ResolvedService | null {
  const normalized = serviceSlug.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return null;
  }
  if (isReservedSlug(normalized)) return null;

  const groupId = SERVICE_SLUG_ALIASES[normalized] || normalized;
  const group = SERVICE_GROUPS.find((entry) => entry.id === groupId);
  if (group) {
    return {
      serviceSlug: normalized,
      serviceName: group.label,
      serviceKeys: keysForGroup(group.id),
    };
  }

  for (const entry of SERVICE_GROUPS) {
    const child = entry.children.find((item) => item.value === normalized);
    if (child) {
      return {
        serviceSlug: normalized,
        serviceName: child.label,
        serviceKeys: [child.value],
      };
    }
  }

  const label = findServiceLabel(normalized);
  if (label && label !== normalized) {
    return {
      serviceSlug: normalized,
      serviceName: label,
      serviceKeys: [normalized],
    };
  }

  return null;
}

export function masterMatchesCity(
  record: Record<string, unknown>,
  city: ResolvedCity
): boolean {
  const cityKeyCandidates = [
    record.cityKey,
    record.citySlug,
    (record.city as { slug?: string } | undefined)?.slug,
    slugify(String(record.cityName || "")),
    slugify(String((record.city as { name?: string } | undefined)?.name || "")),
  ].filter(Boolean) as string[];

  if (cityKeyCandidates.some((key) => key === city.cityKey)) {
    return true;
  }

  const cityName = String(
    record.cityName ||
      (record.city as { formatted?: string; name?: string } | undefined)?.formatted ||
      (record.city as { name?: string } | undefined)?.name ||
      ""
  ).trim();

  if (!cityName) return false;

  return (
    slugify(cityName) === city.cityKey ||
    cityName.toLowerCase() === city.cityName.toLowerCase()
  );
}

export function recordServiceKeys(record: Record<string, unknown>): string[] {
  const keys: string[] = [];

  if (Array.isArray(record.serviceKeys)) {
    for (const key of record.serviceKeys) {
      if (key) keys.push(String(key));
    }
  }

  if (Array.isArray(record.services)) {
    for (const service of record.services) {
      if (typeof service === "string") {
        keys.push(slugify(service));
      } else if (service && typeof service === "object") {
        const obj = service as { key?: string; value?: string; name?: string };
        if (obj.key) keys.push(String(obj.key));
        else if (obj.value) keys.push(String(obj.value));
        else if (obj.name) keys.push(slugify(String(obj.name)));
      }
    }
  }

  return [...new Set(keys.filter(Boolean))];
}

export function recordMatchesService(
  record: Record<string, unknown>,
  service: ResolvedService
): boolean {
  const keys = recordServiceKeys(record);
  return service.serviceKeys.some((key) => keys.includes(key));
}
