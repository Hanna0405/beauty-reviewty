/** Stable publicCards doc id for a registered master profile. */
export function buildMasterPublicCardId(masterId: string): string {
  return `master_${String(masterId).trim()}`;
}

export function slugifyMasterName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function slugifyCityKey(city: string): string {
  const slug = city
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return slug || "unknown";
}
