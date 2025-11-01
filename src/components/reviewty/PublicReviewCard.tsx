"use client";
import Link from "next/link";
import React from "react";
import PhotoThumbs from "./PhotoThumbs";
import { normalizePhotos } from "./getPhotoUrl";

type PublicReviewCardProps = {
  id: string;
  slugCandidate1?: string;
  slugCandidate2?: string;
  slugCandidate3?: string;
  debugItem?: any;
  rating?: number;
  totalReviews?: number;
  masterName?: string;
  masterDisplay?: string;
  cityName?: string;
  masterCity?: string;
  text?: string;
  photos?: (string | { url: string; path?: string })[];
  masterServices?: string[];
  authorName?: string;
  createdAt?: any;
};

export default function PublicReviewCard({
  id,
  slugCandidate1,
  slugCandidate2,
  slugCandidate3,
  debugItem,
  rating,
  totalReviews,
  masterName,
  masterDisplay,
  cityName,
  masterCity,
  text,
  photos,
  masterServices,
  authorName,
  createdAt,
}: PublicReviewCardProps) {
  // Compute final slug from candidates
  const finalSlug = slugCandidate1 || slugCandidate2 || slugCandidate3 || "";

  const href = finalSlug ? `/reviewty/${finalSlug}` : null;
  const cardContent = (
    <>
      {/* Rating and Location */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">
            {"★".repeat(Math.round(rating || 0))}
          </span>
          <span className="text-sm text-gray-600 ml-1">
            {typeof rating === "number" ? rating.toFixed(1) : "0.0"} · {totalReviews ?? 1} review{(totalReviews ?? 1) === 1 ? "" : "s"}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {cityName || masterCity || "—"}
        </div>
      </div>

      {/* Author info */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
        <span>{authorName || "Verified client"}</span>
        {createdAt && <span>· {createdAt.toDate().toLocaleDateString()}</span>}
      </div>

      {/* Master Name */}
      <div className="font-medium text-gray-900">
        {masterDisplay || masterName || "Unknown master"}
      </div>

      {/* Review Text */}
      <p className="text-gray-800 line-clamp-4">{text}</p>

      {/* Preview photos (up to 3) */}
      <PhotoThumbs photos={photos} />

      {/* Services */}
      {masterServices && masterServices.length > 0 && (
        <div className="text-xs text-gray-500">
          Services: {masterServices.join(", ")}
        </div>
      )}
    </>
  );

  // Build the inner visual card markup ONCE
  const CardBody = (
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      {cardContent}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block no-underline text-inherit cursor-pointer"
      >
        {CardBody}
      </Link>
    );
  }

  return CardBody;
}
