"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  getExternalAnchorAttributes,
  handleExternalLinkClick,
  isSpecialSchemeHref,
  normalizeExternalHref,
} from "@/lib/links/externalLinks";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Renders an external http(s) link with wrapper-safe hooks, or a plain anchor for tel:/mailto:.
 */
export function ExternalLink({
  href,
  children,
  onClick,
  target,
  rel,
  ...rest
}: ExternalLinkProps) {
  const trimmed = href.trim();

  if (isSpecialSchemeHref(trimmed)) {
    return (
      <a href={trimmed} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  const attrs = getExternalAnchorAttributes(trimmed);
  if (!attrs) {
    if (process.env.NODE_ENV === "development" && trimmed && trimmed !== "#") {
      // eslint-disable-next-line no-console
      console.warn("[ExternalLink] Invalid or internal href; use Next.js Link instead.", trimmed);
    }
    return null;
  }

  return (
    <a
      {...rest}
      href={attrs.href}
      target={target ?? attrs.target}
      rel={rel ?? attrs.rel}
      data-external={attrs["data-external"]}
      data-external-category={attrs["data-external-category"]}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          handleExternalLinkClick(event, attrs.href);
        }
      }}
    >
      {children}
    </a>
  );
}

/** Normalize master-entered website/social URLs before save or display. */
export function resolveMasterExternalHref(
  input: string | null | undefined
): string | null {
  return normalizeExternalHref(input);
}
