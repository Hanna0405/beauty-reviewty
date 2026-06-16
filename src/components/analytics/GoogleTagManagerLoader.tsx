"use client";

import { useEffect } from "react";

import { isCapacitorNativePlatform } from "@/lib/capacitor/platform";
import { GTM_ID, injectGoogleTagManager } from "@/components/analytics/GoogleTagManager";

const NATIVE_GTM_DEFER_MS = 3000;

/**
 * Loads GTM on the public website immediately after hydration.
 * Defers GTM in the Capacitor native shell so launch stays responsive.
 */
export function GoogleTagManagerLoader() {
  useEffect(() => {
    if (isCapacitorNativePlatform()) {
      const defer = () => injectGoogleTagManager();

      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(defer, { timeout: NATIVE_GTM_DEFER_MS });
      } else {
        window.setTimeout(defer, NATIVE_GTM_DEFER_MS);
      }
      return;
    }

    injectGoogleTagManager();
  }, []);

  return null;
}

/** Noscript fallback for browsers with JavaScript disabled (web only). */
export function GoogleTagManagerNoscript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
