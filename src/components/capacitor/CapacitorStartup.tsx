"use client";

import { useEffect, useState } from "react";

import { hideSplashWhenReady, SPLASH_MAX_WAIT_MS } from "@/lib/capacitor/startup";
import { isCapacitorNativePlatform } from "@/lib/capacitor/platform";

const FALLBACK_DELAY_MS = 600;

/**
 * Native launch coordinator: hides the Capacitor splash when ready and shows a
 * friendly loading state if the remote site is slow to become interactive.
 */
export function CapacitorStartup() {
  const [isNative, setIsNative] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!isCapacitorNativePlatform()) {
      return;
    }

    setIsNative(true);

    const fallbackTimer = window.setTimeout(() => {
      setShowFallback(true);
    }, FALLBACK_DELAY_MS);

    const maxTimer = window.setTimeout(() => {
      setShowFallback(false);
    }, SPLASH_MAX_WAIT_MS + 200);

    void hideSplashWhenReady().finally(() => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(maxTimer);
      setShowFallback(false);
    });

    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  if (!isNative || !showFallback) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#fff5f7] px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-2xl font-bold text-white shadow-md">
        BR
      </div>
      <p className="text-base font-medium text-rose-900">Loading BeautyReviewty…</p>
    </div>
  );
}
