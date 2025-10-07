"use client";
import Link from "next/link";
import Image from "next/image";
import {
  pickFirstImage, cityLabel, serviceLabel, languagesLabel,
  titleLabel, ratingValue, listingId
} from "@/lib/listings/presenters";

export default function ListingCard({ item }: { item: any }) {
  const id = listingId(item);
  const img = pickFirstImage(item);
  const title = titleLabel(item);
  const city = cityLabel(item);
  const service = serviceLabel(item);
  const langs = languagesLabel(item);
  const rating = ratingValue(item);

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white/70 shadow-sm hover:shadow-md transition p-3 flex gap-3">
      <div className="relative shrink-0 w-20 h-20 overflow-hidden rounded-lg bg-zinc-100">
        {img ? (
          <Image src={img} alt={title} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-zinc-400">No photo</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold truncate">{title}</h3>
          {typeof rating === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-xs px-2 py-0.5">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-amber-400"><path d="M10 15l-5.878 3.09L5.82 12.18.945 7.91l6.09-.89L10 1l2.965 6.02 6.09.89-4.875 4.27 1.698 5.91z"/></svg>
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-1 text-xs text-zinc-600 space-y-0.5">
          {city && <div><span className="font-medium text-zinc-700">City:</span> {city}</div>}
          {service && <div><span className="font-medium text-zinc-700">Service:</span> {service}</div>}
          {langs && <div><span className="font-medium text-zinc-700">Languages:</span> {langs}</div>}
        </div>

        <div className="mt-2">
          {id && (
            <Link
              href={`/listings/${id}`}
              className="inline-flex items-center justify-center rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm px-3 py-1.5"
            >
              Open
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

