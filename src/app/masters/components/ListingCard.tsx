"use client";
import Link from "next/link";
import Image from "next/image";
import Stars from "./Stars";
import {
  pickFirstImage,
  titleLabel,
  cityLabel,
  serviceLabel,
  languagesLabel,
  ratingValue,
  reviewsCountValue,
  masterId,
} from "@/lib/listings/presenters";

export default function ListingCard({ item }: { item: any }) {
  const id = item?.id || item?._id;
  const img = pickFirstImage(item);
  const title = titleLabel(item);
  const city = cityLabel(item);
  const service = serviceLabel(item);
  const langs = languagesLabel(item);
  const rating = ratingValue(item);
  const reviews = reviewsCountValue(item);
  const mId = masterId(item);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition">
      {/* Top photo */}
      <div className="relative w-full h-44 bg-zinc-100">
        {img ? (
          <Image
            src={img}
            alt={title || "Listing photo"}
            fill
            sizes="400px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-zinc-400">
            No photo
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="text-base font-semibold text-zinc-900 truncate">
          {title || service || "Untitled Listing"}
        </h3>

        {city && (
          <p className="mt-0.5 text-sm text-zinc-600 truncate">{city}</p>
        )}

        {typeof rating === "number" && (
          <div className="mt-2">
            <Stars value={rating} count={reviews} />
          </div>
        )}

        {langs && (
          <p className="mt-1 text-xs text-zinc-500 truncate">{langs}</p>
        )}

        {/* Buttons */}
        <div className="mt-4 flex flex-col gap-1">
          <Link
            href={`/masters/${id}`}
            className="block text-center rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium px-3 py-2"
          >
            Open
          </Link>

          {mId && (
            <Link
              href={`/masters/${mId}`}
              className="text-xs text-zinc-500 hover:text-pink-600 text-center underline underline-offset-2 transition"
            >
              View master profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

