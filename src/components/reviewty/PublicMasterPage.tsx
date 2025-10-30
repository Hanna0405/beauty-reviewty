"use client";

import React, { useState } from "react";
// Define types locally since reviewty.ts is now client-safe
type PublicMasterData = {
  slug: string;
  name: string;
  cityName?: string;
  serviceNames?: string[];
  languageNames?: string[];
  avgRating: number;
  totalReviews: number;
  photosGallery: string[];
};

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
import PhotoCarousel from "./PhotoCarousel";
import ReviewsList from "./ReviewsList";
import WriteReviewForm from "./WriteReviewForm";

type Props = {
  master: PublicMasterData;
  reviews: PublicReview[];
  masterId?: string;
};

export default function PublicMasterPage({
  master: initialMaster,
  reviews: initialReviews,
  masterId,
}: Props) {
  const [master, setMaster] = useState<PublicMasterData>(initialMaster);
  const [reviews, setReviews] = useState<PublicReview[]>(initialReviews);

  function handleNewReview(newReview: PublicReview) {
    // prepend new review
    setReviews((prev) => [newReview, ...prev]);

    // recompute rating + count
    setMaster((prev) => {
      const newCount = (prev.totalReviews || 0) + 1;
      const newAvg =
        (prev.avgRating * prev.totalReviews + newReview.rating) / newCount;

      // merge photos
      const mergedPhotos = Array.from(
        new Set([...(prev.photosGallery || []), ...(newReview.photos || [])])
      );

      return {
        ...prev,
        totalReviews: newCount,
        avgRating: newAvg,
        photosGallery: mergedPhotos,
      };
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER SECTION */}
      <section className="bg-white border rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="text-xl font-semibold text-gray-900">
              {master.name}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mt-1">
              {/* rating */}
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                <span className="font-medium">
                  {master.avgRating.toFixed(1)}
                </span>
              </div>

              <div className="text-gray-400">·</div>

              {/* total reviews */}
              <div className="text-gray-700">
                {master.totalReviews} review
                {master.totalReviews === 1 ? "" : "s"}
              </div>

              {master.cityName && (
                <>
                  <div className="text-gray-400">·</div>
                  <div className="text-gray-700">{master.cityName}</div>
                </>
              )}
            </div>

            {/* services chips */}
            {master.serviceNames && master.serviceNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {master.serviceNames.map((srv, i) => (
                  <span
                    key={i}
                    className="bg-pink-50 text-pink-700 border border-pink-200 rounded-full px-2 py-1"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            )}

            {/* languages chips */}
            {master.languageNames && master.languageNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {master.languageNames.map((lng, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-2 py-1"
                  >
                    {lng}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PHOTOS GALLERY */}
      {master.photosGallery && master.photosGallery.length > 0 && (
        <section className="bg-white border rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Work photos
          </h2>
          <PhotoCarousel photos={master.photosGallery} />
        </section>
      )}

      {/* WRITE REVIEW FORM */}
      <section className="bg-white border rounded-lg shadow-sm p-4">
        <WriteReviewForm
          masterSlug={master.slug}
          masterName={master.name}
          masterId={masterId}
          cityName={master.cityName}
          serviceNames={master.serviceNames}
          languageNames={master.languageNames}
          onSubmitted={handleNewReview}
        />
      </section>

      {/* REVIEWS LIST */}
      <section className="bg-white border rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Client reviews
        </h2>
        <ReviewsList reviews={reviews} />
      </section>
    </div>
  );
}
