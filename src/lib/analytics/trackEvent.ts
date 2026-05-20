export type DataLayerEvent = Record<string, unknown> & {
  event: string;
};

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

/** SSR-safe GTM / GA4 dataLayer push. Never throws. */
export function trackEvent(payload: DataLayerEvent): void {
  if (typeof window === "undefined") return;

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    // Analytics must never break the app
  }
}

export function currentPathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname || "";
}
