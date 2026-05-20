import type { CityNorm } from "@/lib/city";
import type { NeighborhoodValue } from "./types";
import { neighborhoodSlug } from "./slug";
import { TORONTO_NEIGHBORHOODS } from "./toronto";

export type LocationSelection = {
  city: CityNorm | null;
  neighborhoodKey: string | null;
  neighborhoodName: string | null;
};

export function neighborhoodFromSelection(
  neighborhoodKey: string | null | undefined,
  neighborhoodName: string | null | undefined
): NeighborhoodValue | null {
  const name = String(neighborhoodName || "").trim();
  if (!name) return null;
  const slug =
    String(neighborhoodKey || "").trim() || neighborhoodSlug(name);
  return { name, slug };
}

export function neighborhoodFieldsFromSelection(
  selection: Pick<LocationSelection, "neighborhoodKey" | "neighborhoodName">
): { neighborhoodName?: string; neighborhoodKey?: string } {
  const name = String(selection.neighborhoodName || "").trim();
  if (!name) return {};
  const key =
    String(selection.neighborhoodKey || "").trim() || neighborhoodSlug(name);
  return { neighborhoodName: name, neighborhoodKey: key };
}

export function findTorontoNeighborhoodLabel(
  neighborhoodKey: string | null | undefined
): string | null {
  const key = String(neighborhoodKey || "").trim();
  if (!key) return null;
  const slug = neighborhoodSlug(key);
  return (
    TORONTO_NEIGHBORHOODS.find(
      (label) => neighborhoodSlug(label) === slug || label === key
    ) ?? null
  );
}
