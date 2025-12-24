/**
 * Get the public base URL for email links.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL
 * 2. SITE_URL
 * 3. VERCEL_URL (prepend https:// if missing)
 * 4. http://localhost:3000 (dev only)
 *
 * Ensures URLs are properly formatted (no double slashes, always http/https).
 */

let cachedBaseUrl: string | null = null;
let hasLogged = false;

export function getEmailBaseUrl(): string {
  // Return cached value if already computed
  if (cachedBaseUrl !== null) {
    return cachedBaseUrl;
  }

  let baseUrl: string | undefined;

  // Priority 1: NEXT_PUBLIC_SITE_URL
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // Priority 2: SITE_URL
  if (!baseUrl) {
    baseUrl = process.env.SITE_URL?.trim();
  }

  // Priority 3: VERCEL_URL (prepend https:// if missing)
  if (!baseUrl) {
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
      baseUrl =
        vercelUrl.startsWith("http://") || vercelUrl.startsWith("https://")
          ? vercelUrl
          : `https://${vercelUrl}`;
    }
  }

  // Priority 4: localhost (dev only)
  if (!baseUrl) {
    baseUrl = "http://localhost:3000";
  }

  // Normalize URL: remove trailing slash, ensure proper protocol
  baseUrl = baseUrl.replace(/\/$/, "");
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }

  // Cache the result
  cachedBaseUrl = baseUrl;

  // Log once (server-side only)
  if (typeof window === "undefined" && !hasLogged) {
    const source = process.env.NEXT_PUBLIC_SITE_URL
      ? "NEXT_PUBLIC_SITE_URL"
      : process.env.SITE_URL
      ? "SITE_URL"
      : process.env.VERCEL_URL
      ? "VERCEL_URL"
      : "localhost (dev fallback)";
    console.log(`[Email] Using base URL: ${baseUrl} (from ${source})`);
    hasLogged = true;
  }

  return baseUrl;
}
