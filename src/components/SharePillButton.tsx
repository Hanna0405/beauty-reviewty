"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  ariaLabel: string;
  shareTitle: string;
  shareText: string;
  getUrl: () => string;
};

function canUseClipboardApi(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  );
}

function copyViaExecCommand(shareUrl: string): boolean {
  if (typeof document === "undefined") return false;
  let ta: HTMLTextAreaElement | null = null;
  try {
    ta = document.createElement("textarea");
    ta.value = shareUrl;
    ta.setAttribute("readonly", "");
    ta.setAttribute("aria-hidden", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, shareUrl.length);
    const ok =
      typeof document.execCommand === "function" &&
      document.execCommand("copy");
    return ok;
  } catch {
    return false;
  } finally {
    try {
      if (ta?.parentNode) ta.parentNode.removeChild(ta);
    } catch {
      /* ignore */
    }
  }
}

async function copyTextFallback(shareUrl: string): Promise<boolean> {
  if (canUseClipboardApi()) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      /* fall through to execCommand */
    }
  }
  try {
    return copyViaExecCommand(shareUrl);
  } catch {
    return false;
  }
}

/**
 * Compact share control: Web Share API when present; otherwise clipboard or execCommand + feedback.
 */
export default function SharePillButton({
  ariaLabel,
  shareTitle,
  shareText,
  getUrl,
}: Props) {
  const [feedback, setFeedback] = useState<null | "copied" | "error">(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showFeedback = useCallback((kind: typeof feedback, ms: number) => {
    setFeedback(kind);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFeedback(null);
      timerRef.current = null;
    }, ms);
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (typeof navigator === "undefined" || typeof window === "undefined")
          return;

        const resolved =
          getUrl().trim() ||
          `${window.location.origin}${window.location.pathname}`;
        const href = window.location.href;
        const shareUrl = resolved || href;
        const textToCopy = href || shareUrl;

        if (!shareUrl) {
          console.error("Share failed: empty URL");
          showFeedback("error", 2000);
          return;
        }

        if (typeof navigator.share === "function") {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: shareUrl,
            });
            return;
          } catch (err: unknown) {
            const name = (err as { name?: string })?.name;
            if (name === "AbortError") return;
            console.error("navigator.share failed, trying copy:", err);
          }
        }

        const copiedOk = await copyTextFallback(textToCopy);
        if (copiedOk) {
          showFeedback("copied", 1750);
        } else {
          console.error("All copy strategies failed.");
          showFeedback("error", 2000);
        }
      } catch (err: unknown) {
        console.error("Share handler error:", err);
        showFeedback("error", 2000);
      }
    },
    [getUrl, shareText, shareTitle, showFeedback]
  );

  const statusLabel =
    feedback === "copied"
      ? "Copied!"
      : feedback === "error"
        ? "Could not copy"
        : null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={handleClick}
        className="relative z-10 rounded-full border border-pink-300 bg-white/95 px-[10px] py-1.5 text-[13px] leading-tight font-medium text-pink-600 hover:bg-pink-50 active:bg-pink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-1"
      >
        ↗ Share
      </button>
      {statusLabel ? (
        <span className="text-[11px] font-medium text-pink-600" role="status">
          {statusLabel}
        </span>
      ) : null}
    </div>
  );
}
