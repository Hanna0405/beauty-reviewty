import type { Option } from "@/components/AutocompleteList";
import { cityToDisplay } from "@/lib/city/format";
import { fetchMastersOnce } from "@/lib/firestoreQueries";

export type MasterSearchOption = Option & {
  uid: string;
  profileId: string;
};

function toServiceLabel(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value !== null) {
    const item = value as { name?: string; label?: string; key?: string; title?: string };
    return String(item.name || item.label || item.title || item.key || "").trim();
  }
  return "";
}

function looksLikeSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)+$/.test(value);
}

export function formatMasterServices(master: Record<string, unknown>): string[] {
  const labels: string[] = [];

  if (Array.isArray(master.serviceNames)) {
    for (const name of master.serviceNames) {
      const label = toServiceLabel(name);
      if (label) labels.push(label);
    }
  }

  if (Array.isArray(master.services)) {
    for (const service of master.services) {
      if (typeof service === "object" && service !== null) {
        const item = service as { name?: string; label?: string; title?: string };
        const label = String(item.name || item.label || item.title || "").trim();
        if (label) labels.push(label);
      } else if (typeof service === "string") {
        const s = service.trim();
        if (s && !looksLikeSlug(s)) labels.push(s);
      }
    }
  }

  const unique = [...new Set(labels.filter(Boolean))];
  if (unique.length) return unique;

  if (Array.isArray(master.serviceKeys)) {
    for (const key of master.serviceKeys) {
      const raw = toServiceLabel(key);
      if (!raw) continue;
      const pretty = raw
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      if (pretty) labels.push(pretty);
    }
  }

  return [...new Set(labels.filter(Boolean))];
}

function formatMasterLanguages(master: Record<string, unknown>): string[] {
  const labels: string[] = [];

  if (Array.isArray(master.languageNames)) {
    for (const name of master.languageNames) {
      const label = toServiceLabel(name);
      if (label) labels.push(label);
    }
  }

  if (Array.isArray(master.languages)) {
    for (const language of master.languages) {
      const label = toServiceLabel(language);
      if (label) labels.push(label);
    }
  }

  return [...new Set(labels.filter(Boolean))];
}

export function masterToSearchOption(master: Record<string, unknown>): MasterSearchOption | null {
  const uid = String(
    master.uid || master.userId || master.ownerId || master.userUID || ""
  ).trim();
  const profileId = String(master.id || uid).trim();
  if (!uid) return null;

  const displayName = String(master.displayName || master.name || "Master").trim();
  const avatar =
    (typeof master.avatarUrl === "string" && master.avatarUrl.trim()) ||
    (typeof master.photoURL === "string" && master.photoURL.trim()) ||
    "";

  return {
    id: uid,
    uid,
    profileId,
    title: displayName,
    city: cityToDisplay(master.city as never) || String(master.cityName || "").trim(),
    services: formatMasterServices(master),
    photoUrl: avatar,
  };
}

export async function loadActiveMasterSearchOptions(
  pageSize = 100
): Promise<MasterSearchOption[]> {
  const { items } = await fetchMastersOnce({}, pageSize);
  const options: MasterSearchOption[] = [];
  const seen = new Set<string>();

  for (const master of items) {
    const option = masterToSearchOption(master as Record<string, unknown>);
    if (!option || seen.has(option.id)) continue;
    seen.add(option.id);
    options.push(option);
  }

  return options;
}

export function languagesFromProfile(profile: Record<string, unknown>): string[] {
  return formatMasterLanguages(profile);
}
