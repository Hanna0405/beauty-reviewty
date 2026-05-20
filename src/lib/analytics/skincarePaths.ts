/** Internal routes that lead to the skincare checker (no SEO/route changes). */
export const SKINCARE_CHECKER_PATHS = [
  "/skincare-checker",
  "/check-skincare",
] as const;

export function isSkincareCheckerHref(href: string): boolean {
  const raw = href.trim();
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:")) return false;

  const matchPath = (pathname: string) => {
    const path = pathname.replace(/\/$/, "") || "/";
    return SKINCARE_CHECKER_PATHS.some(
      (p) => path === p || path.startsWith(`${p}/`)
    );
  };

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      return matchPath(u.pathname);
    } catch {
      return false;
    }
  }

  const pathOnly = raw.split("?")[0]?.split("#")[0] ?? raw;
  return matchPath(pathOnly);
}
