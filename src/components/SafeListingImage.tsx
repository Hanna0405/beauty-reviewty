"use client";

import React, { useEffect, useState } from "react";
import { storage } from "@/lib/firebase/client";
import { getDownloadURL, ref } from "firebase/storage";

type PhotoInfo = {
  url?: string | null;
  path?: string | null;
  width?: number | null;
  height?: number | null;
};

interface SafeListingImageProps {
  photo?: PhotoInfo;
  alt: string;
  className?: string;
}

export function SafeListingImage({
  photo,
  alt,
  className,
}: SafeListingImageProps) {
  const [finalUrl, setFinalUrl] = useState<string | undefined>(() => {
    if (
      photo?.url &&
      typeof photo.url === "string" &&
      photo.url.trim() !== ""
    ) {
      return photo.url;
    }
    return undefined;
  });

  useEffect(() => {
    // If we don't already have a usable finalUrl AND we seem to have a storage path (not an https:// URL)
    if (!finalUrl && photo?.path && typeof photo.path === "string") {
      const p = photo.path.trim();

      // Heuristic:
      // if path looks like "https://storage.googleapis.com/..." then it's already a full URL.
      // those URLs in old docs are TEMP SIGNED URLs that may be expired -> they might still 403,
      // but we cannot recover them because we don't know the actual storage object path.
      const looksLikeFullUrl =
        p.startsWith("http://") || p.startsWith("https://");

      if (!looksLikeFullUrl) {
        // GOOD CASE: we have a real storage path like "listings/<uid>/IMG_1234.jpg"
        const r = ref(storage, p);
        getDownloadURL(r)
          .then((dlUrl) => {
            setFinalUrl(dlUrl);
          })
          .catch(() => {
            // swallow error, fallback below
          });
      } else {
        // FALLBACK CASE: old data where 'path' is actually an expired signed URL.
        // We'll just try using it directly if we don't already have finalUrl:
        if (!finalUrl) {
          setFinalUrl(p);
        }
      }
    }
  }, [photo?.path, finalUrl]);

  if (!finalUrl) {
    // graceful placeholder instead of broken <img>
    return (
      <div
        className={
          "bg-neutral-200 text-neutral-500 flex items-center justify-center " +
          (className || "")
        }
      >
        <span className="text-xs">no image</span>
      </div>
    );
  }

  return (
    <img
      src={finalUrl}
      alt={alt}
      className={className || "object-cover w-full h-full rounded-md"}
    />
  );
}
