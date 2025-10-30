export type AnyPhoto =
  | string
  | { url?: string | null; src?: string | null }
  | null
  | undefined;

export const getPhotoUrl = (p: AnyPhoto): string | null => {
  if (!p) return null;
  if (typeof p === "string") return p || null;
  // prefer url, then src
  const u = (p as any).url ?? (p as any).src;
  return typeof u === "string" && u.length > 0 ? u : null;
};

export const normalizePhotos = (
  photos: AnyPhoto[] | undefined | null
): string[] => {
  if (!Array.isArray(photos)) return [];
  return photos.map(getPhotoUrl).filter(Boolean) as string[];
};
