"use client";

import { useCallback, useEffect, useState } from "react";
import { MdIosShare } from "react-icons/md";

type ShareIconButtonProps = {
  getUrl?: () => string;
  title?: string;
  text?: string;
  className?: string;
  "aria-label"?: string;
};

export default function ShareIconButton({
  getUrl,
  title,
  text,
  className,
  "aria-label": ariaLabel = "Share",
}: ShareIconButtonProps) {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleShare = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const shareUrl =
        getUrl?.() ??
        (typeof window !== "undefined" ? window.location.href : "");
      if (!shareUrl) return;

      const shareTitle = title ?? (typeof document !== "undefined" ? document.title : "");
      const shareText = text ?? shareTitle;

      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          return;
        }

        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          setNotice("Link copied");
          return;
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
      }

      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.setAttribute("readonly", "true");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setNotice("Link copied");
      } catch {
        // ignore
      }
    },
    [getUrl, text, title]
  );

  return (
    <span className="relative inline-flex shrink-0 flex-col items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label={ariaLabel}
        className={
          className ??
          "inline-flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-600 transition hover:bg-pink-100 hover:text-pink-700"
        }
      >
        <MdIosShare className="text-sm" aria-hidden />
      </button>
      {notice ? (
        <span className="absolute top-full z-10 mt-0.5 whitespace-nowrap text-[10px] text-pink-600">
          {notice}
        </span>
      ) : null}
    </span>
  );
}
