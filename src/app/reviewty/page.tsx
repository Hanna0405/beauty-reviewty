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

// Helper function to calculate stats from reviews
function calcStats(reviews: any[]) {
  if (!reviews || reviews.length === 0) return { avg: null, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return {
    avg: sum / reviews.length,
    count: reviews.length,
  };
}

type ReviewDoc = {
  id: string;
  masterName?: string;
  masterDisplay?: string;
  cityName?: string;
  serviceName?: string;
  rating?: number;
  totalReviews?: number;
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
  computedRating?: number | null;
  computedReviewsCount?: number;
  // Additional service fields for new public cards
  serviceKeys?: string[];
  serviceNames?: string[];
  services?:
    | string[]
    | Array<{ key?: string; name?: string; [key: string]: any }>;
  // Nested publicCard structure (if present)
  publicCard?: {
    serviceKeys?: string[];
    serviceNames?: string[];
    services?:
      | string[]
      | Array<{ key?: string; name?: string; [key: string]: any }>;
  };
};

const PAGE_SIZE = 20;

// Strict service matching helpers (pure functions, NO React hooks)
type ServiceOption =
  | {
      key?: string;
      name?: string;
      value?: string;
      label?: string;
      slug?: string;
    }
  | string
  | null;

function extractServiceKey(option: ServiceOption): string | null {
  if (!option) return null;
  if (typeof option === "string") return option.toLowerCase().trim();
  const anyOpt = option as any;
  const keyLike = anyOpt.key ?? anyOpt.value ?? anyOpt.slug ?? null;
  if (keyLike) return keyLike.toString().toLowerCase().trim();
  const nameLike = anyOpt.name ?? anyOpt.label ?? null;
  return nameLike ? nameLike.toString().toLowerCase().trim() : null;
}

function collectServiceKeysFromReview(review: any): string[] {
  const result: string[] = [];
  const pushStr = (v: any) => {
    if (typeof v === "string") result.push(v.toLowerCase().trim());
  };
  const r: any = review;
  const arrays = [
    r.serviceKeys,
    r.serviceNames,
    r.services,
    r.masterServices,
    r.publicCard?.serviceKeys,
    r.publicCard?.serviceNames,
    r.publicCard?.services,
  ];
  arrays.forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((item: any) => {
        if (typeof item === "string") {
          pushStr(item);
        } else if (item && typeof item === "object") {
          if (item.key) pushStr(item.key);
          if (item.name) pushStr(item.name);
          if (item.value) pushStr(item.value);
          if (item.label) pushStr(item.label);
        }
      });
    }
  });
  return result;
}

function reviewMatchesService(
  review: any,
  selectedService: ServiceOption
): boolean {
  const filterKey = extractServiceKey(selectedService);
  if (!filterKey) return true; // no filter selected
  const serviceKeys = collectServiceKeysFromReview(review);
  return serviceKeys.includes(filterKey);
}

// Rating filter helpers (pure functions, NO React hooks)
type RatingOption =
  | number
  | string
  | { value?: number | string; label?: string; name?: string }
  | null;

function extractRatingThreshold(option: RatingOption): number | null {
  if (option === null || option === undefined) return null;

  if (typeof option === "number") {
    return option;
  }

  if (typeof option === "string") {
    // examples: "5", "5★", "5 star", "5 stars"
    const match = option.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  }

  const anyOpt = option as any;
  const raw = anyOpt.value ?? anyOpt.label ?? anyOpt.name ?? null;

  if (raw == null) return null;

  if (typeof raw === "number") return raw;

  if (typeof raw === "string") {
    const match = raw.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  }

  return null;
}

// Extract numeric rating from the review / publicCard
function getReviewRating(review: any): number | null {
  const r: any = review;

  // try several possible fields, keeping existing schema in mind
  // prefer computedRating (calculated from reviews), then rating
  if (typeof r.computedRating === "number") return r.computedRating;
  if (typeof r.rating === "number") return r.rating;
  if (typeof r.averageRating === "number") return r.averageRating;
  if (r.publicCard && typeof r.publicCard.rating === "number")
    return r.publicCard.rating;
  if (typeof r.stars === "number") return r.stars;

  return null;
}

// ratingGte can be missing (undefined/null), in which case all cards pass the filter
function reviewMatchesRating(
  review: any,
  ratingGte?: RatingOption | null
): boolean {
  // If no rating filter is selected, all cards pass
  if (ratingGte == null) return true;

  const threshold = extractRatingThreshold(ratingGte);
  if (threshold == null) {
    // no rating filter selected => always match
    return true;
  }

  const rating = getReviewRating(review);
  if (rating == null) return false;

  // Usually UX expectation for "5★" / "4★" filters is "rating >= threshold"
  return rating >= threshold;
}

export default function ReviewtyPage() {
  const [publicCards, setPublicCards] = useState<ReviewDoc[]>([]);
  const [filteredCards, setFilteredCards] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReviewtyFilters>({
    city: null,
    services: [],
    languages: [],
    ratingGte: null,
    personQuery: "",
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<
    "listing" | "community"
  >("listing");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // mobile-only: filters sheet
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function loadReviews() {
    try {
      setLoading(true);

      // Load ALL public cards from Firestore without any filters
      const q = query(
        collection(db, "publicCards"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);

      const items: ReviewDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;

        // Read computed rating fields with fallback
        const displayedRating = data.avgRating ?? data.rating ?? 0;
        const displayedCount = data.totalReviews ?? 1;

        return {
          id: d.id,
          slug: data.slug || "",
          masterName: data.masterName || "",
          masterDisplay: data.masterName || "",
          cityName: data.city?.formatted || data.cityName || "",
          serviceName: data.services?.[0]?.name || "",
          rating: displayedRating,
          totalReviews: displayedCount,
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
          // Preserve service fields from new public cards
          serviceKeys: Array.isArray(data.serviceKeys)
            ? data.serviceKeys
            : undefined,
          serviceNames: Array.isArray(data.serviceNames)
            ? data.serviceNames
            : undefined,
          services: Array.isArray(data.services) ? data.services : undefined,
        };
      });

      // Collect all card IDs
      const cardIds = items.map((card) => card.id);

      // Query reviews collection in batches (Firestore 'in' query limit is 10)
      const reviewsByCardId = new Map<string, any[]>();

      if (cardIds.length > 0) {
        // Split into batches of 10
        const batchSize = 10;
        for (let i = 0; i < cardIds.length; i += batchSize) {
          const batch = cardIds.slice(i, i + batchSize);

          try {
            // Query publicReviews collection where publicCardSlug is in the batch
            const publicReviewsQuery = query(
              collection(db, "publicReviews"),
              where("publicCardSlug", "in", batch)
            );
            const publicReviewsSnap = await getDocs(publicReviewsQuery);

            publicReviewsSnap.docs.forEach((doc) => {
              const reviewData = doc.data();
              const cardId = reviewData.publicCardSlug;
              if (cardId) {
                if (!reviewsByCardId.has(cardId)) {
                  reviewsByCardId.set(cardId, []);
                }
                reviewsByCardId.get(cardId)!.push(reviewData);
              }
            });
          } catch (err) {
            console.error(
              "[reviewty] failed to query publicReviews batch",
              err
            );
          }

          try {
            // Also query reviews collection where publicCardId is in the batch
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("publicCardId", "in", batch)
            );
            const reviewsSnap = await getDocs(reviewsQuery);

            reviewsSnap.docs.forEach((doc) => {
              const reviewData = doc.data();
              const cardId = reviewData.publicCardId;
              if (cardId) {
                if (!reviewsByCardId.has(cardId)) {
                  reviewsByCardId.set(cardId, []);
                }
                reviewsByCardId.get(cardId)!.push(reviewData);
              }
            });
          } catch (err) {
            console.error("[reviewty] failed to query reviews batch", err);
          }
        }
      }

      // Calculate stats for each card and merge into items
      const itemsWithStats = items.map((card) => {
        const cardReviews = reviewsByCardId.get(card.id) || [];
        const stats = calcStats(cardReviews);

        return {
          ...card,
          computedRating: stats.avg ?? card.rating ?? null,
          computedReviewsCount: stats.count ?? card.totalReviews ?? 0,
        };
      });

      setPublicCards(itemsWithStats);
    } catch (err) {
      console.error("[reviewty] failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  }

  // Load all public cards once on mount
  useEffect(() => {
    loadReviews();
  }, []);

  // Apply client-side filters whenever filters or publicCards change
  useEffect(() => {
    let filtered = [...publicCards];

    const normalize = (val: any) => {
      if (!val) return "";
      return val
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
    };

    // detect city-like fields from current data
    const detectCityFields = (items: any[]) => {
      const result = new Set<string>();

      const candidates = [
        "city",
        "cityKey",
        "citySlug",
        "cityName",
        "cityFull",
        "cityDisplay",
        "location",
        "address",
        "formattedAddress",
        "addressFormatted",
      ];

      // scan first 5 items to see what they really have
      items.slice(0, 5).forEach((it) => {
        if (!it) return;
        // flat level
        Object.keys(it).forEach((k) => {
          const lk = k.toLowerCase();
          if (
            lk.includes("city") ||
            lk.includes("location") ||
            lk.includes("address")
          ) {
            result.add(k);
          }
        });
        // nested location
        if (it.location && typeof it.location === "object") {
          Object.keys(it.location).forEach((k) => {
            const lk = k.toLowerCase();
            if (
              lk.includes("city") ||
              lk.includes("slug") ||
              lk.includes("formatted") ||
              lk.includes("address")
            ) {
              result.add("location." + k);
            }
          });
        }
      });

      // always add our basic guesses
      candidates.forEach((c) => result.add(c));

      return Array.from(result);
    };

    // ---- CITY FILTER (dynamic) ----
    {
      const sel = filters?.city ?? null;

      if (sel) {
        const selectedNorms = [
          typeof sel === "string" ? sel : null,
          sel.slug,
          sel.city,
          sel.formatted,
        ]
          .filter(Boolean)
          .map(normalize);

        // if no selected value -> skip
        if (selectedNorms.length > 0) {
          // detect which fields real cards have
          const cityFields = detectCityFields(publicCards || []);

          filtered = filtered.filter((item: any) => {
            // collect all possible values from this item using detected fields
            const itemVals: string[] = [];

            cityFields.forEach((field) => {
              if (field.startsWith("location.")) {
                const sub = field.split(".")[1];
                const v = item.location?.[sub];
                if (v) itemVals.push(normalize(v));
              } else {
                const v = item?.[field];
                if (v) itemVals.push(normalize(v));
              }
            });

            if (itemVals.length === 0) return false;

            // match any-to-any
            return itemVals.some((iv) =>
              selectedNorms.some((sv) => {
                if (!iv || !sv) return false;
                return iv === sv || iv.startsWith(sv) || sv.startsWith(iv);
              })
            );
          });
        }
      }
    }
    // ---- END CITY FILTER ----

    // ---- SERVICE FILTER ----
    if (filters.services && filters.services.length > 0) {
      // Filter: card must match at least ONE of the selected services
      filtered = filtered.filter((card: ReviewDoc) => {
        return filters.services!.some((selectedService) => {
          return reviewMatchesService(card, selectedService);
        });
      });
    }

    // ---- LANGUAGE FILTER ----
    if (filters.languages && filters.languages.length > 0) {
      const selectedLangKeys = filters.languages
        .map((lng: any) => {
          if (!lng) return null;
          const raw =
            lng.key ||
            lng.value ||
            lng.langKey ||
            lng.code ||
            lng.name ||
            lng.label ||
            (typeof lng === "string" ? lng : "");

          return raw ? raw.toString().trim().toLowerCase() : null;
        })
        .filter(Boolean);

      filtered = filtered.filter((card: any) => {
        const cardLangRaw =
          card.masterLanguages ||
          card.languageKeys ||
          card.languages ||
          card.langs ||
          [];

        const cardLangArr = Array.isArray(cardLangRaw)
          ? cardLangRaw
          : [cardLangRaw];

        if (cardLangArr.length === 0) return false;

        const cardLangKeys = cardLangArr
          .map((cl: any) => {
            if (!cl) return null;
            const raw =
              (typeof cl === "string"
                ? cl
                : cl.key || cl.value || cl.code || cl.name || cl.label || "") ||
              "";
            return raw.toString().trim().toLowerCase();
          })
          .filter(Boolean);

        // card must have at least ONE selected language
        return cardLangKeys.some((cl: string) => selectedLangKeys.includes(cl));
      });
    }

    // ---- RATING FILTER ----
    filtered = filtered.filter((card: ReviewDoc) => {
      return reviewMatchesRating(card, filters.ratingGte);
    });
    // ---- END RATING FILTER ----

    // Filter by person query (search)
    if (filters.personQuery) {
      const query = filters.personQuery.toLowerCase();
      filtered = filtered.filter((card) => {
        const searchText = [
          card.masterName,
          card.masterDisplay,
          card.cityName,
          ...(card.masterKeywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchText.includes(query);
      });
    }

    setFilteredCards(filtered);
    // Reset visible count when filters change
    setVisibleCount(PAGE_SIZE);
  }, [publicCards, filters]);

  const handleResetFilters = () => {
    setFilters({
      city: null,
      services: [],
      languages: [],
      ratingGte: null,
      personQuery: "",
    });
  };

  const openCreatePublicCardModal = () => {
    setModalInitialMode("community");
    setIsReviewModalOpen(true);
  };

  const openReviewModal = () => {
    setModalInitialMode("listing");
    setIsReviewModalOpen(true);
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
            onClick={openReviewModal}
            className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 font-medium transition-colors"
          >
            Add review
          </button>
        </header>

        {/* Info banner */}
        <div className="w-full flex justify-center mb-6 px-4">
          <p className="text-center text-slate-700 text-base sm:text-lg md:text-xl font-medium leading-relaxed">
            Couldn't find your beauty master online or they blocked you? Make a{" "}
            <button
              onClick={openCreatePublicCardModal}
              className="text-pink-500 font-semibold hover:text-pink-600 mx-1 underline-offset-2 hover:underline"
            >
              public card
            </button>{" "}
            and help others learn from your real experience
          </p>
        </div>

        {/* Mobile-only: Filters button */}
        <div className="mb-4 flex items-center justify-end md:hidden">
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="w-full rounded-md border border-pink-500 bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
            Filters
          </button>
        </div>

        {/* Desktop Filters - hidden on mobile */}
        <div className="hidden bg-pink-50/60 rounded-lg p-4 border border-pink-200 md:block">
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
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No reviews yet.</div>
            <div className="text-gray-400 text-sm mt-2">
              Be the first to share your experience!
            </div>
          </div>
        ) : (
          <>
            <ul className="grid md:grid-cols-2 gap-4">
              {filteredCards.slice(0, visibleCount).map((review) => {
                // Debug logging
                console.log("[Reviewty List]", {
                  id: review.id,
                  masterName: review.masterName,
                });

                return (
                  <li key={review.id}>
                    <PublicReviewCard
                      id={review.id}
                      slugCandidate1={review.masterSlug || review.id}
                      slugCandidate2={review.masterSlug}
                      slugCandidate3={review.id}
                      debugItem={review}
                      rating={review.computedRating ?? review.rating}
                      totalReviews={
                        review.computedReviewsCount ?? review.totalReviews
                      }
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
            {filteredCards.length > visibleCount && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-pink-300 hover:bg-pink-50"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-500 opacity-70 max-w-4xl mx-auto px-4 leading-relaxed">
            All reviews, photos, and user-generated content on BeautyReviewty are posted by users and reflect their personal opinions and experiences. BeautyReviewty does not verify the accuracy or legality of user-submitted content and is not responsible for any possible consequences or claims related to such content. By publishing a review or uploading content, the user confirms that they hold the necessary rights and bear full responsibility for their submission. The platform reserves the right to remove or hide materials that violate the law, intellectual property rights, or the service rules.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">That's all</div>
        </div>

        {/* Mobile Filters Sheet */}
        {isFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsFiltersOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div 
              className="absolute inset-y-0 left-0 right-0 flex flex-col overflow-y-auto bg-pink-50 shadow-xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-pink-50 px-4 py-3">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <Filters
                  value={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                />
              </div>
              <div className="sticky bottom-0 border-t bg-pink-50 p-4">
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="w-full rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <ReviewtyCreateModal
          open={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          initialMode={modalInitialMode}
        />
      </div>
    </div>
  );
}
