"use client";
import React from "react";
import Image from "next/image";
import { normalizePhotos } from "./getPhotoUrl";

type Props = { photos?: any };

export default function PhotoGallery({ photos }: Props) {
  const urls = normalizePhotos(photos);
  const [idx, setIdx] = React.useState(0);
  if (urls.length === 0) return null;

  const safeIdx = Math.min(Math.max(idx, 0), urls.length - 1);

  return (
    <div className="mt-4">
      <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg border">
        <Image
          src={urls[safeIdx]}
          alt={`work-${safeIdx + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="mt-3 flex gap-3">
        {urls.map((u, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`relative h-16 w-16 rounded-md overflow-hidden border ${
              i === safeIdx ? "ring-2 ring-pink-500" : ""
            }`}
            aria-label={`Show photo ${i + 1}`}
          >
            <Image
              src={u}
              alt={`thumb-${i + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
