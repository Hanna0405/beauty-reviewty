"use client";
import Link from "next/link";
import Image from "next/image";
import Stars from "./Stars";
import {
  pickFirstImage, cityLabel, serviceLabel, languagesLabel,
  titleLabel, ratingValue, listingId, masterId, reviewsCountValue
} from "@/lib/listings/presenters";

export default function ListingCard({ item }: { item: any }) {
  const id = listingId(item);
  const img = pickFirstImage(item);
  const title = titleLabel(item);
  const city = cityLabel(item);
  const service = serviceLabel(item);
  const langs = languagesLabel(item);
  const rating = ratingValue(item);
  const reviews = reviewsCountValue(item);
  const mId = masterId(item);

  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition p-4 flex gap-4">
      <div className="relative shrink-0 w-28 h-28 overflow-hidden rounded-xl bg-zinc-100">
        {img ? (
          <Image src={img} alt={title} fill className="object-cover" sizes="112px" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-zinc-400">No photo</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold truncate">{title}</h3>
          {typeof rating === "number" && <Stars value={rating} count={reviews} />}
        </div>

        <div className="mt-1 text-[13px] text-zinc-700 space-y-1">
          {city && <div><span className="font-medium text-zinc-800">City:</span> {city}</div>}
          {service && <div><span className="font-medium text-zinc-800">Service:</span> {service}</div>}
          {langs && <div><span className="font-medium text-zinc-800">Languages:</span> {langs}</div>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {id && (
            <Link
              href={`/masters/${id}`}
              className="inline-flex items-center justify-center rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm px-3.5 py-1.5"
            >
              Open
            </Link>
          )}
          {mId && (
            <Link
              href={`/masters/${mId}`}
              className="text-sm text-pink-600 hover:text-pink-700 underline underline-offset-2"
            >
              Master profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

