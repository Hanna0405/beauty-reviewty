"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "@/components/links/ExternalLink";
import { isCapacitorNativePlatform } from "@/lib/capacitor/platform";
import {
  detectMobileStorePlatform,
  getAppDownloadUrl,
  isMobileWebBrowser,
  type MobileStorePlatform,
} from "@/lib/appStoreLinks";

const STORAGE_KEY = "br_app_download_banner_dismissed_until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2000;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function dismissBanner(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    // ignore quota / private mode
  }
}

function DownloadButton({ platform }: { platform: MobileStorePlatform }) {
  const href = getAppDownloadUrl(platform);
  const className =
    "inline-flex flex-1 items-center justify-center rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        Download App
      </Link>
    );
  }

  return (
    <ExternalLink href={href} className={className}>
      Download App
    </ExternalLink>
  );
}

export function AppDownloadBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<MobileStorePlatform>("other");

  const dismiss = useCallback(() => {
    dismissBanner();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isCapacitorNativePlatform()) return;
    if (!isMobileWebBrowser()) return;
    if (isDismissed()) return;

    const detected = detectMobileStorePlatform();
    setPlatform(detected);

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label="Download the BeautyReviewty app"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-pink-100 bg-gradient-to-br from-white via-white to-pink-50/90 p-4 shadow-[0_-4px_24px_rgba(244,114,182,0.18)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug text-gray-900">
              BeautyReviewty is now available as an app
            </p>
            <p className="mt-1 text-[13px] leading-snug text-gray-600">
              Find beauty masters faster and save your favorites.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-pink-50 hover:text-gray-600"
            aria-label="Close app download banner"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <DownloadButton platform={platform} />
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-pink-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-pink-50/80"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
