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
import PublicReviewCard from "@/components/reviewty/PublicReviewCard";

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
  authorName?: string;
  authorUid?: string;
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

      const q = query(collection(db, "publicCards"), ...constraints);
      const snap = await getDocs(q);

      const items: ReviewDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          slug: data.slug || "",
          masterName: data.masterName || "",
          masterDisplay: data.masterName || "",
          cityName: data.city?.formatted || data.cityName || "",
          serviceName: data.services?.[0]?.name || "",
          rating: data.rating ?? 5,
          text: data.text || "",
          photos: Array.isArray(data.photos) ? data.photos : [],
          createdAt: data.createdAt || null,
          authorName: data.authorName || "Verified client",
          authorUid: data.authorUid || null,
          masterRef: data.masterRef,
          masterId: d.id,
          masterCity: data.city?.formatted || data.cityName || "",
          masterServices:
            data.services?.map((s: any) => s.name || s.key || s) || [],
          masterLanguages: data.languages || [],
          masterKeywords: data.masterKeywords || [],
          masterSlug: data.slug || "",
          masterKey: data.masterKey,
          source: data.source || "publicCard",
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
              // Debug logging
              console.log("[Reviewty List]", {
                id: review.id,
                slug: review.slug,
                masterName: review.masterName,
              });

              return (
                <li key={review.id}>
                  <PublicReviewCard
                    id={review.id}
                    slugCandidate1={review.slug}
                    slugCandidate2={review.masterSlug}
                    slugCandidate3={review.id}
                    debugItem={review}
                    rating={review.rating}
                    masterName={review.masterName}
                    masterDisplay={review.masterDisplay}
                    cityName={review.cityName}
                    masterCity={review.masterCity}
                    text={review.text}
                    photos={review.photos}
                    masterServices={review.masterServices}
                    authorName={review.authorName}
                    createdAt={review.createdAt}
                  />
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
