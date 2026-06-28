/** App Store listing — replace with the live URL when available. */
export const APP_STORE_URL =
  "https://apps.apple.com/app/beautyreviewty/id0000000000";

/** Google Play listing for the native Android app. */
export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.beautyreviewty.app";

/** Fallback when the mobile platform is not iOS or Android. */
export const APP_DOWNLOAD_FALLBACK_PATH = "/app";

export type MobileStorePlatform = "ios" | "android" | "other";

export function detectMobileStorePlatform(): MobileStorePlatform {
  if (typeof navigator === "undefined") return "other";

  const ua = navigator.userAgent;
  const isIos =
    /iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

/** True for phone/tablet mobile browsers — not desktop. */
export function isMobileWebBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  return (
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getAppDownloadUrl(platform: MobileStorePlatform): string {
  if (platform === "ios") return APP_STORE_URL;
  if (platform === "android") return GOOGLE_PLAY_URL;
  return APP_DOWNLOAD_FALLBACK_PATH;
}
