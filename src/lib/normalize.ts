export const toStringSafe = (v: any, fallback = ""): string => {
 if (v == null) return fallback;
 if (typeof v === "string") return v;
 if (typeof v === "number" || typeof v === "boolean") return String(v);
 // common shapes
 if (typeof v === "object") {
 return v.name ?? v.label ?? v.title ?? fallback;
 }
 return fallback;
};

export const toNumberSafe = (v: any, fallback?: number): number | undefined => {
 if (v == null) return fallback;
 if (typeof v === "number") return v;
 const n = Number(v);
 return Number.isFinite(n) ? n : fallback;
};

export const normalizeCity = (city: any): string =>
 toStringSafe(city, "");

export const normalizeLanguages = (langs: any): string[] => {
 if (!Array.isArray(langs)) return [];
 return langs
 .map((x) => toStringSafe(x, ""))
 .filter(Boolean);
};

export const normalizePhotos = (photos: any): string[] => {
 if (!Array.isArray(photos)) return [];
 return photos
 .map((p) => (typeof p === "string" ? p : p?.url ?? p?.src ?? ""))
 .filter(Boolean);
};
