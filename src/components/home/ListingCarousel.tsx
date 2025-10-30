"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";

type ListingCarouselItem = {
  listingId: string;
  name: string;
  city: string;
  mainPhoto: string | null;
  services: string[];
  href: string;
};

type ListingCarouselProps = {
  items: ListingCarouselItem[];
};

function ListingCard({ item }: { item: ListingCarouselItem }) {
  return (
    <Link
      href={item.href}
      className="snap-start shrink-0 w-[240px] rounded-md border border-rose-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden block"
    >
      <div className="w-full h-40 bg-gray-100">
        {item.mainPhoto ? (
          <img
            src={item.mainPhoto}
            alt={item.name}
            className="w-full h-40 object-cover rounded-t-md"
          />
        ) : (
          <div className="w-full h-40 rounded-t-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            No photo
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-rose-900 text-sm mb-1 truncate">
          {item.name}
        </h3>
        <p className="text-rose-700 text-xs mb-2 truncate">{item.city}</p>

        {item.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.services.map((service, idx) => (
              <span
                key={idx}
                className="inline-block text-xs rounded-full border px-2 py-0.5 bg-rose-100 text-rose-700"
              >
                {service}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ListingCarousel({ items }: ListingCarouselProps) {
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
      <div className="flex items-center justify-end mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => scrollBy(-300)}
            className="px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition-colors"
            aria-label="Previous listings"
          >
            ‹
          </button>
          <button
            onClick={() => scrollBy(300)}
            className="px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition-colors"
            aria-label="Next listings"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-auto no-scrollbar gap-4 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <ListingCard key={item.listingId} item={item} />
        ))}
      </div>
    </div>
  );
}
