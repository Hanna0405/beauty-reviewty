"use client";
import React, { useState } from "react";
import Image from "next/image";
import { normalizePhotos } from "./getPhotoUrl";

type Props = { photos?: any; max?: number; className?: string };

export default function PhotoThumbs({ photos, max = 3, className }: Props) {
  const urls = normalizePhotos(photos);
  const displayUrls = urls.slice(0, max);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <div className={className ?? "mt-3 flex gap-2"}>
        {displayUrls.map((u, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveImageIndex(i)}
            className="relative h-16 w-16 overflow-hidden rounded-md border bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
            aria-label={`Open photo ${i + 1}`}
          >
            {/* next/image keeps layout stable */}
            <Image src={u} alt={`photo-${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Image preview modal */}
      {activeImageIndex !== null && urls[activeImageIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveImageIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image
              src={urls[activeImageIndex]}
              alt={`photo ${activeImageIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {/* Controls */}
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = activeImageIndex > 0 
                      ? activeImageIndex - 1 
                      : urls.length - 1;
                    setActiveImageIndex(newIndex);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/70 px-3 py-2 text-sm hover:bg-white/90"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (activeImageIndex + 1) % urls.length;
                    setActiveImageIndex(newIndex);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/70 px-3 py-2 text-sm hover:bg-white/90"
                >
                  ›
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(null);
              }}
              className="absolute right-2 top-2 rounded bg-white/80 px-3 py-1 text-sm hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
