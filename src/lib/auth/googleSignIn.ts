"use client";

import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type AuthProvider,
  type UserCredential,
} from "firebase/auth";

export type GoogleSignInResult =
  | { kind: "signed-in"; credential: UserCredential }
  | { kind: "redirect-started" };

function devWarn(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(message, detail ?? "");
  }
}

function authErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    return String((err as { code?: string }).code || "");
  }
  return "";
}

/**
 * True when running inside a native wrapper / in-app WebView where popups are unreliable.
 */
export function isAppWebViewEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  const w = window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  };

  const cap = w.Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  const platform = cap?.getPlatform?.();
  if (platform === "ios" || platform === "android") return true;

  const ua = navigator.userAgent || "";

  // iOS WKWebView (no Safari token)
  if (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return true;
  }

  // Android System WebView
  if (/Android/i.test(ua) && /\bwv\b/i.test(ua)) return true;

  // Common in-app browsers
  if (/FBAN|FBAV|Instagram|Line\//i.test(ua)) return true;

  return false;
}

export function shouldPreferGoogleRedirect(): boolean {
  return isAppWebViewEnvironment();
}

export function shouldFallbackPopupToRedirect(err: unknown): boolean {
  const code = authErrorCode(err);
  if (!code) return false;

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return false;
  }

  return (
    code.includes("popup") ||
    code === "auth/operation-not-supported-in-this-environment" ||
    code.includes("blocked") ||
    code.includes("unavailable")
  );
}

/**
 * Google sign-in: popup on desktop browsers; redirect in app WebViews or when popup fails.
 */
export async function signInWithGoogleCompatible(
  auth: Auth,
  provider: AuthProvider = new GoogleAuthProvider()
): Promise<GoogleSignInResult> {
  await setPersistence(auth, browserLocalPersistence);

  if (shouldPreferGoogleRedirect()) {
    devWarn("[auth] Using signInWithRedirect (app/WebView environment)");
    await signInWithRedirect(auth, provider);
    return { kind: "redirect-started" };
  }

  try {
    const credential = await signInWithPopup(auth, provider);
    return { kind: "signed-in", credential };
  } catch (err) {
    if (shouldFallbackPopupToRedirect(err)) {
      devWarn("[auth] Popup sign-in failed; falling back to signInWithRedirect", err);
      await signInWithRedirect(auth, provider);
      return { kind: "redirect-started" };
    }
    throw err;
  }
}

/** Call on auth pages after returning from Google redirect. */
export async function consumeGoogleRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    devWarn("[auth] getRedirectResult failed", err);
    return null;
  }
}

let redirectResultPromise: Promise<UserCredential | null> | null = null;

/** Shared redirect result for AuthProvider + auth pages (getRedirectResult is one-shot). */
export function getGoogleRedirectResultOnce(
  auth: Auth
): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = consumeGoogleRedirectResult(auth);
  }
  return redirectResultPromise;
}
