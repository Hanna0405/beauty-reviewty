import { SplashScreen } from "@capacitor/splash-screen";

import { isCapacitorNativePlatform } from "./platform";

/** Max time to keep the native splash visible before forcing hide. */
export const SPLASH_MAX_WAIT_MS = 12_000;

async function hideNativeSplash(): Promise<void> {
  try {
    await SplashScreen.hide();
  } catch {
    // SplashScreen plugin is unavailable outside the native shell.
  }
}

function waitForDocumentReady(): Promise<void> {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

/** Wait for two animation frames so the first React paint can complete. */
function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Keep the Capacitor splash visible until the remote page has loaded and painted,
 * then hide it. Always resolves (with a timeout fallback).
 */
export async function hideSplashWhenReady(): Promise<void> {
  if (!isCapacitorNativePlatform()) {
    return;
  }

  let finished = false;

  const finish = async () => {
    if (finished) return;
    finished = true;
    await hideNativeSplash();
  };

  const timeoutId = window.setTimeout(() => {
    void finish();
  }, SPLASH_MAX_WAIT_MS);

  try {
    await waitForDocumentReady();
    await waitForNextPaint();
    window.clearTimeout(timeoutId);
    await finish();
  } catch {
    window.clearTimeout(timeoutId);
    await finish();
  }
}
