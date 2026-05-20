import type { NeighborhoodValue } from "./types";
import { neighborhoodSlug } from "./slug";

export function parseNeighborhood(raw: unknown): NeighborhoodValue | null {
  if (!raw) return null;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { name?: unknown; slug?: unknown };
    const name = String(obj.name || "").trim();
    if (!name) return null;
    const slug = String(obj.slug || "").trim() || neighborhoodSlug(name);
    return { name, slug };
  }

  return null;
}

/** Read neighborhood from a listing/profile document without touching city fields. */
export function getNeighborhoodFromDoc(doc: Record<string, unknown> | null | undefined): NeighborhoodValue | null {
  if (!doc) return null;

  const nested = parseNeighborhood(doc.neighborhood);
  if (nested) return nested;

  const name = String(doc.neighborhoodName || "").trim();
  if (!name) return null;

  const slug =
    String(doc.neighborhoodKey || "").trim() || neighborhoodSlug(name);
  return { name, slug };
}

export function neighborhoodFieldsForSave(
  value: NeighborhoodValue | null | undefined
): Record<string, unknown> {
  if (!value?.name?.trim()) return {};

  const name = value.name.trim();
  const slug = (value.slug || neighborhoodSlug(name)).trim();

  return {
    neighborhoodName: name,
    neighborhoodKey: slug,
  };
}
