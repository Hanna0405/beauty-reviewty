"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

type ReviewDoc = {
  id: string;
  masterName?: string;
  masterDisplay?: string;
  cityName?: string;
  serviceName?: string;
  rating?: number;
  text?: string;
  photos?: (string | { url: string; path?: string })[];
  createdAt?: any;
  masterRef?: {
    type: "listing" | "community";
    id: string;
    slug?: string;
  };
  masterId?: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  masterKeywords?: string[];
  masterSlug?: string;
  masterKey?: string;
  source?: string;
  masterPublic?: {
    displayName?: string;
    services?: { key: string; name: string; emoji: string }[];
    languages?: { key: string; name: string; emoji: string }[];
    city?: {
      city?: string;
      state?: string;
      stateCode?: string;
      country?: string;
      countryCode?: string;
      formatted?: string;
      lat?: number;
      lng?: number;
      placeId?: string;
      slug?: string;
    };
    cityName?: string;
    cityKey?: string;
  };
};

type MasterProfileProps = {
  params: {
    masterKey: string;
  };
};

export default function MasterProfilePage({ params }: MasterProfileProps) {
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterInfo, setMasterInfo] = useState<{
    displayName: string;
    city: string;
    services: string[];
    languages: string[];
    allPhotos: string[];
  } | null>(null);

  useEffect(() => {
    loadMasterReviews();
  }, [params.masterKey]);

  async function loadMasterReviews() {
    try {
      setLoading(true);

      // Query all reviews for this master
      const q = query(
        collection(db, "reviews"),
        where("masterKey", "==", params.masterKey),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const reviewDocs: ReviewDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          masterName: data.masterName || data.master?.name || "",
          masterDisplay: data.masterDisplay || data.master?.displayName || "",
          cityName: data.cityName || data.city?.formatted || "",
          serviceName: data.serviceName || data.service?.name || "",
          rating: data.rating ?? null,
          text: data.text || data.comment || "",
          photos: Array.isArray(data.photos)
            ? data.photos
            : Array.isArray(data.images)
            ? data.images
            : [],
          createdAt: data.createdAt || null,
          masterRef: data.masterRef,
          masterId: data.masterId,
          masterCity: data.masterCity,
          masterServices: data.masterServices,
          masterLanguages: data.masterLanguages,
          masterKeywords: data.masterKeywords,
          masterSlug: data.masterSlug,
          masterKey: data.masterKey,
          source: data.source,
          masterPublic: data.masterPublic,
        };
      });

      setReviews(reviewDocs);

      // Derive master info from the first review
      if (reviewDocs.length > 0) {
        const firstReview = reviewDocs[0];

        // Collect all unique services and languages
        const allServices = new Set<string>();
        const allLanguages = new Set<string>();
        const allPhotos: string[] = [];

        reviewDocs.forEach((review) => {
          // Add services from masterServices or masterPublic.services
          if (review.masterServices) {
            review.masterServices.forEach((s) => allServices.add(s));
          }
          if (review.masterPublic?.services) {
            review.masterPublic.services.forEach((s) => allServices.add(s.key));
          }

          // Add languages from masterLanguages or masterPublic.languages
          if (review.masterLanguages) {
            review.masterLanguages.forEach((l) => allLanguages.add(l));
          }
          if (review.masterPublic?.languages) {
            review.masterPublic.languages.forEach((l) =>
              allLanguages.add(l.key)
            );
          }

          // Collect all photos
          if (review.photos) {
            review.photos.forEach((photo) => {
              const photoUrl = typeof photo === "string" ? photo : photo.url;
              if (photoUrl) {
                allPhotos.push(photoUrl);
              }
            });
          }
        });

        setMasterInfo({
          displayName:
            firstReview.masterDisplay ||
            firstReview.masterPublic?.displayName ||
            "Unknown Master",
          city:
            firstReview.masterCity ||
            firstReview.masterPublic?.city?.formatted ||
            firstReview.cityName ||
            "Unknown City",
          services: Array.from(allServices),
          languages: Array.from(allLanguages),
          allPhotos: allPhotos.slice(0, 12), // Limit to 12 photos
        });
      }
    } catch (err) {
      console.error("[master profile] failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading master profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!masterInfo || reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Master not found</div>
            <div className="text-gray-400 text-sm mt-2">
              This master profile doesn't exist or has no reviews.
            </div>
            <Link
              href="/reviewty"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 font-medium transition-colors"
            >
              Back to Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/reviewty"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Back to Reviews
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {masterInfo.displayName}
            </h1>
            <div className="text-lg text-gray-600 mt-1">{masterInfo.city}</div>
          </div>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("reviewty:openCreate"))
            }
            className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 font-medium transition-colors"
          >
            Add review for this master
          </button>
        </header>

        {/* Master Info */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Services
              </h2>
              <div className="flex flex-wrap gap-2">
                {masterInfo.services.length > 0 ? (
                  masterInfo.services.map((service, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">
                    No services listed
                  </span>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {masterInfo.languages.length > 0 ? (
                  masterInfo.languages.map((language, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">
                    No languages listed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {masterInfo.allPhotos.length > 0 && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {masterInfo.allPhotos.map((photoUrl, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                >
                  <img
                    src={photoUrl}
                    alt={`Master photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
              >
                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">
                    {"★".repeat(Math.round(review.rating || 0))}
                  </span>
                  <span className="text-sm text-gray-600">
                    {review.rating || 0}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-gray-800 mb-3">{review.text}</p>

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.photos.slice(0, 3).map((photo, i) => {
                      const photoUrl =
                        typeof photo === "string" ? photo : photo.url;
                      const photoKey =
                        typeof photo === "string" ? i : photo.path || i;

                      return (
                        <div
                          key={photoKey}
                          className="h-16 w-16 rounded overflow-hidden bg-gray-100 border border-gray-200"
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={`Review photo ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                              No photo
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
