"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import ReviewtyCreateModal from "./ReviewtyCreateModal";
import Filters, { type ReviewtyFilters } from "./Filters";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";

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
};

const PAGE_SIZE = 20;

export default function ReviewtyPage() {
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReviewtyFilters>({
    city: null,
    services: [],
    languages: [],
    ratingGte: null,
    personQuery: "",
  });

  async function loadReviews() {
    try {
      setLoading(true);

      // Build query constraints
      const constraints: any[] = [
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      ];

      // Add filters
      if (filters.city) {
        constraints.unshift(where("masterCity", "==", filters.city.formatted));
      }
      if (filters.ratingGte) {
        constraints.unshift(where("rating", ">=", filters.ratingGte));
      }
      if (filters.services.length > 0) {
        constraints.unshift(
          where("masterServices", "array-contains", filters.services[0].value)
        );
      }

      const q = query(collection(db, "reviews"), ...constraints);
      const snap = await getDocs(q);

      const items: ReviewDoc[] = snap.docs.map((d) => {
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
        };
      });

      // Apply client-side filters
      let filtered = items;

      // Filter by languages (if not already applied in query)
      if (filters.languages.length > 0) {
        filtered = filtered.filter((review) => {
          if (!Array.isArray(review.masterLanguages)) return false;
          return filters.languages.some((lang) =>
            review.masterLanguages?.includes(lang.value)
          );
        });
      }

      // Filter by person query
      if (filters.personQuery) {
        const query = filters.personQuery.toLowerCase();
        filtered = filtered.filter((review) => {
          const searchText = [
            review.masterName,
            review.masterDisplay,
            review.cityName,
            ...(review.masterKeywords || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return searchText.includes(query);
        });
      }

      setReviews(filtered);
    } catch (err) {
      console.error("[reviewty] failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [filters.city, filters.services, filters.languages, filters.ratingGte]);

  const handleResetFilters = () => {
    setFilters({
      city: null,
      services: [],
      languages: [],
      ratingGte: null,
      personQuery: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">
            People's Reviews
          </h1>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("reviewty:openCreate"))
            }
            className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 font-medium transition-colors"
          >
            Add review
          </button>
        </header>

        {/* Filters */}
        <div className="bg-pink-50/60 rounded-lg p-4 border border-pink-200">
          <Filters
            value={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading reviews...</div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No reviews yet.</div>
            <div className="text-gray-400 text-sm mt-2">
              Be the first to share your experience!
            </div>
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {reviews.map((review) => {
              const cardContent = (
                <>
                  {/* Rating and Location */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">
                        {"★".repeat(Math.round(review.rating || 0))}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">
                        {review.rating || 0}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {review.cityName || review.masterCity || "—"}
                    </div>
                  </div>

                  {/* Master Name */}
                  <div className="font-medium text-gray-900">
                    {review.masterDisplay ||
                      review.masterName ||
                      "Unknown master"}
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-800 line-clamp-4">{review.text}</p>

                  {/* Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex gap-2">
                      {review.photos.slice(0, 3).map((photo, i) => {
                        // Handle both formats: string URLs or objects with url property
                        const photoUrl =
                          typeof photo === "string" ? photo : photo.url;
                        const photoKey =
                          typeof photo === "string" ? i : photo.path || i;

                        return (
                          <div
                            key={photoKey}
                            className="h-20 w-20 rounded overflow-hidden bg-gray-100 border border-gray-200"
                          >
                            {photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoUrl}
                                alt={`Photo ${i + 1}`}
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

                  {/* Services */}
                  {review.masterServices &&
                    review.masterServices.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Services: {review.masterServices.join(", ")}
                      </div>
                    )}
                </>
              );

              return (
                <li key={review.id}>
                  {review.source === "public-card" && review.masterKey ? (
                    <Link
                      href={`/reviewty/${review.masterKey}`}
                      className="block rounded-xl border bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                      {cardContent}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">That's all</div>
        </div>

        {/* Modal */}
        <ReviewtyCreateModal />
      </div>
    </div>
  );
}
