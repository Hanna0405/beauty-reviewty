"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";

type ReviewCard = {
  reviewId: string;
  rating: number;
  text: string;
  imageUrl: string | null;
};

type Props = {
  items: ReviewCard[];
};

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="text-rose-500 text-sm">
      {"★★★★★".slice(0, r)}
      <span className="text-rose-200">{"★★★★★".slice(r)}</span>
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewCard }) {
  return (
    <article className="snap-start shrink-0 w-[220px] md:w-[240px] rounded-xl border border-rose-100 bg-white shadow-sm overflow-hidden">
      <div className="relative w-full h-40 bg-gray-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt="Review photo"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 220px, 240px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            No photo
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Stars rating={item.rating} />
        </div>
        <p className="text-rose-700 text-sm line-clamp-3 leading-relaxed">
          {item.text}
        </p>
      </div>
    </article>
  );
}

export default function LatestReviewsCarousel({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((dx: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-rose-900 font-semibold text-lg">Latest reviews</h3>
        <div className="flex gap-2">
          <button
            onClick={() => scrollBy(-300)}
            className="px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition-colors"
            aria-label="Previous reviews"
          >
            ‹
          </button>
          <button
            onClick={() => scrollBy(300)}
            className="px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition-colors"
            aria-label="Next reviews"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <ReviewCard key={item.reviewId} item={item} />
        ))}
      </div>
    </div>
  );
}
