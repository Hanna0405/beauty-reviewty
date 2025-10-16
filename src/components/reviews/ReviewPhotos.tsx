"use client";
import { useState } from "react";
import Image from "next/image";
import { useResolvedImages } from "@/lib/media/useResolvedImages";

function ReviewPhotos({ review }: { review: any }) {
  const urls = useResolvedImages(review); // resolve all we can
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!urls.length) return null;

  return (
    <>
      {/* Thumbnails grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {urls.slice(0, 9).map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative aspect-square overflow-hidden rounded bg-gray-100"
            aria-label={`Open review photo ${i + 1}`}
          >
            <Image
              src={src}
              alt={`review photo ${i + 1}`}
              fill
              sizes="(max-width: 768px) 33vw, 200px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Simple lightbox */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image
              src={urls[openIndex]}
              alt={`review photo ${openIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {/* Controls */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpenIndex((i) => (i! > 0 ? i! - 1 : urls.length - 1)); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/70 px-3 py-2 text-sm"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpenIndex((i) => (i! + 1) % urls.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/70 px-3 py-2 text-sm"
            >
              ›
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpenIndex(null); }}
              className="absolute right-2 top-2 rounded bg-white/80 px-3 py-1 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ReviewPhotos;
export { ReviewPhotos };