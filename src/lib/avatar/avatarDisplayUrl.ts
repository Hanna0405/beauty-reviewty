/** Normalize Firestore Timestamp / ISO string / ms for cache-busting query params. */
export function avatarCacheVersion(source: unknown): string | number | undefined {
  if (source == null) return undefined;
  if (typeof source === "number" && Number.isFinite(source)) return source;
  if (typeof source === "string" && source.trim()) return source.trim();

  if (typeof source === "object") {
    const ts = source as {
      seconds?: number;
      toMillis?: () => number;
    };
    if (typeof ts.seconds === "number") return ts.seconds;
    if (typeof ts.toMillis === "function") {
      const ms = ts.toMillis();
      if (Number.isFinite(ms)) return ms;
    }
  }

  return undefined;
}

/** Append ?v= version to avatar URL without breaking Storage paths. */
export function withAvatarCacheBust(
  url?: string | null,
  version?: unknown
): string {
  if (!url?.trim()) return "";
  const base = url.trim();
  const v = avatarCacheVersion(version);
  if (v == null) return base;
  return `${base}${base.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(v))}`;
}

export function resolveMasterAvatarSrc(
  master: {
    avatarUrl?: string | null;
    photoURL?: string | null;
    avatarUpdatedAt?: unknown;
    updatedAt?: unknown;
  } | null
): string | null {
  const raw =
    (typeof master?.avatarUrl === "string" && master.avatarUrl.trim()) ||
    (typeof master?.photoURL === "string" && master.photoURL.trim()) ||
    null;
  if (!raw) return null;
  return withAvatarCacheBust(raw, master?.avatarUpdatedAt ?? master?.updatedAt) || null;
}
