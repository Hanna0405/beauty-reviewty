"use client";

import React from "react";

// Define type locally since reviewty.ts is now client-safe
type PublicReview = {
  id: string;
  masterSlug?: string;
  masterName?: string;
  rating: number;
  text: string;
  createdAt: string; // ISO string
  clientName?: string;
  photos: string[]; // default []
  cityName?: string;
  serviceNames?: string[];
  languageNames?: string[];
};

export default function ReviewsList({ reviews }: { reviews: PublicReview[] }) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-sm text-gray-500">No reviews yet.</div>;
  }

  // newest first by createdAt desc
  const sorted = [...reviews].sort((a, b) => {
    const ta = a.createdAt || "";
    const tb = b.createdAt || "";
    return tb.localeCompare(ta);
  });

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((rev) => (
        <div key={rev.id} className="border rounded-lg p-4 bg-white shadow-sm">
          {/* header row: rating, client, date */}
          <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-yellow-500 text-xs leading-none">
                <span>★★★★★</span>
                <span className="text-gray-900 font-medium">{rev.rating}</span>
              </div>
              <div className="text-gray-800 font-semibold text-sm">
                {rev.clientName || "Verified client"}
              </div>
            </div>

            <div className="text-[11px] text-gray-500">
              {rev.createdAt ? rev.createdAt.slice(0, 10) : ""}
            </div>
          </div>

          {/* text body */}
          {rev.text && (
            <div className="mt-2 text-sm text-gray-800 whitespace-pre-line">
              {rev.text}
            </div>
          )}

          {/* photos */}
          {rev.photos && rev.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rev.photos.map((url, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded border overflow-hidden bg-gray-100"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
