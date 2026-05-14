"use client";

import Image from "next/image";
import Link from "next/link";
import { getListingCoverUrl } from "@/lib/listingCover";
import { safeImageSrc } from "@/lib/safeImage";
import ShareIconButton from "@/components/ShareIconButton";

export default function PublicListingCard({ listing }: { listing: any }) {
  const rawCover = getListingCoverUrl(listing);
  const coverSrc = safeImageSrc(
    typeof rawCover === "string" ? rawCover : "",
    "public listing card cover"
  );

  const title = listing.title || listing.name || "Untitled listing";

  const cityLabel = listing.cityName || listing.city || "";

  const listingId =
    listing.id || listing.listingId || listing.listingID || listing.slug || "";

  const viewListingHref = listingId ? `/masters/${listingId}` : "#";

  return (
    <div
      id={listingId ? `listing-${listingId}` : undefined}
      className="relative rounded-lg border border-pink-200 bg-white/70 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {listingId ? (
        <div className="absolute top-2 right-2 z-10">
          <ShareIconButton
            title={title}
            text={cityLabel ? `${title} — ${cityLabel}` : title}
            getUrl={() => {
              const base = window.location.href.split("#")[0];
              return `${base}#listing-${listingId}`;
            }}
            aria-label="Share listing"
          />
        </div>
      ) : null}

      <Link href={viewListingHref} className="block" prefetch={false}>
        <div className="relative w-full aspect-square bg-gray-50 border-b border-pink-100">
          {coverSrc ? (
            <Image src={coverSrc} alt={title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 border border-dashed border-gray-300 bg-gray-100">
              No image
            </div>
          )}
        </div>

        <div className="p-3 text-sm text-gray-800">
          <div className="font-medium text-gray-900 leading-snug line-clamp-1">
            {title}
          </div>
          {cityLabel && (
            <div className="text-xs text-gray-500 leading-tight">{cityLabel}</div>
          )}
        </div>
      </Link>
    </div>
  );
}
