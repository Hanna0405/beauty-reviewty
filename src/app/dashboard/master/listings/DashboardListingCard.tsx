"use client";

import Image from "next/image";
import { safeImageSrc } from "@/lib/safeImage";
import { getListingCoverUrl } from "@/lib/listingCover";

export interface DashboardListingCardProps {
  listing: any; // we can refine later
  onDelete?: (id: string) => void;
}

export default function DashboardListingCard({
  listing,
  onDelete,
}: DashboardListingCardProps) {
  const rawCover = getListingCoverUrl(listing);
  const coverSrc = safeImageSrc(
    typeof rawCover === "string" ? rawCover : "",
    "dashboard listing card preview"
  );

  const title = listing.title || listing.name || "Untitled listing";

  const cityLabel = listing.cityName || listing.city || listing.location || "";

  const listingId =
    listing.id || listing.listingId || listing.listingID || listing.slug || "";

  // public listing route pattern is /masters/[listingId]
  const viewHref = listingId ? `/masters/${listingId}` : "#";

  const editHref = listingId
    ? `/dashboard/master/listings/${listingId}/edit`
    : "#";

  return (
    <div className="rounded-lg border border-pink-200 bg-white/60 shadow-sm flex flex-col overflow-hidden">
      {/* image block */}
      <div className="relative w-full aspect-square bg-gray-50 border-b border-pink-100">
        {coverSrc ? (
          <Image src={coverSrc} alt={title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 border border-dashed border-gray-300 bg-gray-100">
            no image
          </div>
        )}
      </div>

      {/* text + meta */}
      <div className="flex-1 p-3 flex flex-col gap-1 text-sm text-gray-800">
        <div className="font-medium text-gray-900 leading-snug line-clamp-1">
          {title}
        </div>
        {cityLabel && (
          <div className="text-xs text-gray-500 leading-tight">{cityLabel}</div>
        )}
      </div>

      {/* actions */}
      <div className="border-t border-pink-100 bg-pink-50/60 px-3 py-2 flex items-center justify-between text-xs font-medium text-pink-700">
        <div className="flex items-center gap-3 flex-wrap">
          <a href={viewHref} className="hover:underline">
            View
          </a>
          <a href={editHref} className="hover:underline">
            Edit
          </a>
          <button
            type="button"
            className="text-red-600 hover:underline"
            onClick={() => {
              if (!onDelete || !listingId) return;
              if (confirm("Delete this listing?")) {
                onDelete(listingId);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
