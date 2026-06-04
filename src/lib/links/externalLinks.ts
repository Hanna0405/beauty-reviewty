/**
 * Centralized external URL handling for web + future Capacitor/iOS/Android wrappers.
 * Internal Next.js paths and special schemes (tel:, mailto:) are left unchanged.
 */

export type ExternalLinkCategory =
  | "social"
  | "affiliate"
  | "master-website"
  | "external";

export type ExternalAnchorAttributes = {
  href: string;
  target: "_blank";
  rel: "noopener noreferrer";
  "data-external": "true";
  "data-external-category": ExternalLinkCategory;
};

export type ExternalOpenOptions = {
  presentationStyle?: "popover" | "fullscreen";
};

const KNOWN_EXTERNAL_HOST_PATTERNS: RegExp[] = [
  /(^|\.)instagram\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)fb\.com$/i,
  /(^|\.)tiktok\.com$/i,
  /(^|\.)amazon\./i,
  /(^|\.)amzn\.to$/i,
  /(^|\.)stylevana\./i,
  /(^|\.)wa\.me$/i,
  /(^|\.)api\.whatsapp\.com$/i,
];

function devWarnExternal(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(message, detail ?? "");
  }
}

/** Next.js in-app route (not an off-site URL). */
export function isInternalNavigationHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#") return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("#")) return true;
  return false;
}

export function isSpecialSchemeHref(href: string): boolean {
  return /^(mailto|tel|sms|geo):/i.test(href.trim());
}

/**
 * Normalize http(s) URLs; bare domains get https://.
 * Returns null and logs in development when the value cannot be used as an external URL.
 */
export function normalizeExternalHref(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const raw = input.trim();
  if (!raw || raw === "#") return null;

  if (isInternalNavigationHref(raw) || isSpecialSchemeHref(raw)) {
    return raw;
  }

  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      devWarnExternal("[externalLinks] Unsupported URL protocol", raw);
      return null;
    }
    return url.toString();
  } catch {
    devWarnExternal("[externalLinks] Malformed external URL", raw);
    return null;
  }
}

export function parseExternalUrl(href: string): URL | null {
  const normalized = normalizeExternalHref(href);
  if (
    !normalized ||
    isInternalNavigationHref(normalized) ||
    isSpecialSchemeHref(normalized)
  ) {
    return null;
  }

  try {
    return new URL(normalized);
  } catch {
    devWarnExternal("[externalLinks] Malformed external URL", href);
    return null;
  }
}

export function isKnownExternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return KNOWN_EXTERNAL_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export function isExternalHttpUrl(
  href: string,
  pageOrigin?: string
): boolean {
  const url = parseExternalUrl(href);
  if (!url) return false;

  const origin =
    pageOrigin ??
    (typeof window !== "undefined" ? window.location.origin : undefined);

  if (!origin) return true;

  try {
    return url.origin !== new URL(origin).origin;
  } catch {
    return true;
  }
}

export function classifyExternalUrl(href: string): ExternalLinkCategory | null {
  const url = parseExternalUrl(href);
  if (!url) return null;

  const host = url.hostname.toLowerCase();

  if (/amazon\.|amzn\.to|stylevana\./i.test(host)) {
    return "affiliate";
  }
  if (/instagram|facebook|fb\.com|tiktok/i.test(host)) {
    return "social";
  }
  if (isKnownExternalHost(host)) {
    return "external";
  }

  return "master-website";
}

export function isWrapperSafeExternalUrl(href: string): boolean {
  return parseExternalUrl(href) !== null;
}

/** True in Capacitor native shell or typical in-app WebViews. */
export function isNativeWrapperEnvironment(): boolean {
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
  if (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return true;
  }
  if (/Android/i.test(ua) && /\bwv\b/i.test(ua)) return true;

  return false;
}

/**
 * Opens an off-site URL via Capacitor Browser when available.
 * Returns true when the wrapper handled navigation (caller may preventDefault).
 */
export async function openExternalUrlInWrapper(
  url: string,
  _options?: ExternalOpenOptions
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const normalized = normalizeExternalHref(url);
  if (!normalized || !parseExternalUrl(normalized)) return false;

  const w = window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        Browser?: { open: (opts: { url: string }) => Promise<void> };
      };
    };
  };

  if (!w.Capacitor?.isNativePlatform?.()) return false;

  const browser = w.Capacitor.Plugins?.Browser;
  if (browser?.open) {
    await browser.open({ url: normalized });
    return true;
  }

  window.open(normalized, "_blank", "noopener,noreferrer");
  return true;
}

export function handleExternalLinkClick(
  event: { preventDefault: () => void; defaultPrevented: boolean },
  href: string
): void {
  if (!isNativeWrapperEnvironment()) return;

  const normalized = normalizeExternalHref(href);
  if (!normalized || !parseExternalUrl(normalized)) return;

  const w = window as Window & {
    Capacitor?: { Plugins?: { Browser?: unknown } };
  };
  if (!w.Capacitor?.Plugins?.Browser) return;

  event.preventDefault();
  void openExternalUrlInWrapper(normalized);
}

/** Anchor props for off-site http(s) links (target + rel preserved for web). */
export function getExternalAnchorAttributes(
  href: string
): ExternalAnchorAttributes | null {
  const url = parseExternalUrl(href);
  if (!url) return null;

  const category = classifyExternalUrl(url.toString()) ?? "external";

  return {
    href: url.toString(),
    target: "_blank",
    rel: "noopener noreferrer",
    "data-external": "true",
    "data-external-category": category,
  };
}

type AnchorClickEvent = {
  preventDefault: () => void;
  defaultPrevented: boolean;
};

/** Spreadable props + optional click handler for custom analytics hooks. */
export function getExternalLinkProps(
  href: string,
  onClick?: (event: AnchorClickEvent) => void
): (ExternalAnchorAttributes & { onClick?: (event: AnchorClickEvent) => void }) | null {
  const attrs = getExternalAnchorAttributes(href);
  if (!attrs) return null;

  if (!onClick) {
    return {
      ...attrs,
      onClick: (event) => handleExternalLinkClick(event, attrs.href),
    };
  }

  return {
    ...attrs,
    onClick: (event) => {
      onClick(event);
      if (!event.defaultPrevented) {
        handleExternalLinkClick(event, attrs.href);
      }
    },
  };
}
