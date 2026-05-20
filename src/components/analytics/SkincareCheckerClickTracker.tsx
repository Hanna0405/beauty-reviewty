"use client";

import { useEffect } from "react";
import { currentPathname, trackEvent } from "@/lib/analytics/trackEvent";
import { isSkincareCheckerHref } from "@/lib/analytics/skincarePaths";

/**
 * Captures internal clicks to skincare checker routes (Masters, home, etc.).
 * Does not modify links or layout — listen-only.
 */
export default function SkincareCheckerClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (anchor.target === "_blank" && href.startsWith("http")) return;

      if (!isSkincareCheckerHref(href)) return;

      trackEvent({
        event: "click_check_skincare",
        source_page: currentPathname(),
        target_url: href,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
