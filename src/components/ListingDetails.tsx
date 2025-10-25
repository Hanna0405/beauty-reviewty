"use client";

import Link from "next/link";
import { getMasterProfileId } from "@/lib/listings/getMasterProfileId";

type Props = {
  title?: string;
  city?: string; // <- ожидаем строку
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  languages?: string[]; // <- ожидаем массив строк
  onBook?: () => void;
  masterId?: string | null;
};

export default function ListingDetails({
  title = "Service",
  city,
  priceMin,
  priceMax,
  languages = [],
  onBook,
  masterId,
}: Props) {
  const price =
    priceMin != null && priceMax != null
      ? `$${priceMin} – $${priceMax}`
      : priceMin != null
      ? `$${priceMin}+`
      : undefined;

  const profileId = getMasterProfileId({ masterId });

  return (
    <aside className="rounded-xl border border-neutral-200 p-4 sm:p-5 bg-white">
      <h1 className="text-2xl font-semibold leading-tight">{title}</h1>

      <div className="mt-3 space-y-2 text-sm text-neutral-700">
        {city && (
          <div>
            <span className="font-medium">City:&nbsp;</span>
            <span>{city}</span>
          </div>
        )}
        {price && (
          <div>
            <span className="font-medium">Price:&nbsp;</span>
            <span>{price}</span>
          </div>
        )}
        {!!languages.length && (
          <div>
            <span className="font-medium">Languages:&nbsp;</span>
            <span>{languages.join(", ")}</span>
          </div>
        )}
      </div>

      <button
        onClick={onBook}
        className="mt-4 w-full rounded-md bg-pink-600 hover:bg-pink-700 text-white py-2.5 font-medium"
      >
        Book now
      </button>

      {profileId ? (
        <div className="mt-3 text-center">
          <Link
            href={`/master/${profileId}`}
            prefetch={false}
            className="text-sm text-pink-600 hover:text-pink-700 underline underline-offset-2"
            aria-label="View master profile"
          >
            View master profile →
          </Link>
        </div>
      ) : (
        masterId && (
          <div className="mt-3 text-center">
            <button
              type="button"
              className="text-sm text-gray-400 cursor-not-allowed"
              title="Profile is not available"
              aria-disabled="true"
              disabled
            >
              View master profile →
            </button>
          </div>
        )
      )}
    </aside>
  );
}
