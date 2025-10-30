"use client";

import React, { useState } from "react";

export default function PhotoCarousel({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);

  if (!photos || photos.length === 0) return null;

  const prev = () => {
    setActive((idx) => (idx === 0 ? photos.length - 1 : idx - 1));
  };
  const next = () => {
    setActive((idx) => (idx === photos.length - 1 ? 0 : idx + 1));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* main photo */}
      <div className="relative">
        <img
          src={photos[active]}
          alt=""
          className="w-full max-h-[320px] object-cover rounded-lg border"
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 text-xs px-2 py-1 rounded border shadow-sm"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 text-xs px-2 py-1 rounded border shadow-sm"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 border rounded overflow-hidden w-16 h-16 ${
                i === active ? "ring-2 ring-pink-500" : ""
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
