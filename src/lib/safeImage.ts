export function safeImageSrc(url: string | undefined | null, context?: string) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    if (typeof window !== "undefined") {
      console.warn("[BrokenPhoto] missing url in", context);
    }
    return null;
  }
  return url;
}
