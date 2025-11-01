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
};

const PAGE_SIZE = 20;

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

  async function loadReviews() {
    try {
      setLoading(true);

      // Load ALL public cards from Firestore without any filters
      const q = query(collection(db, "publicCards"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const items: ReviewDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;
        
        // Read computed rating fields with fallback
        const displayedRating = data.avgRating ?? (data.rating ?? 0);
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
        };
      });

      setPublicCards(items);
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
          if (lk.includes("city") || lk.includes("location") || lk.includes("address")) {
            result.add(k);
          }
        });
        // nested location
        if (it.location && typeof it.location === "object") {
          Object.keys(it.location).forEach((k) => {
            const lk = k.toLowerCase();
            if (lk.includes("city") || lk.includes("slug") || lk.includes("formatted") || lk.includes("address")) {
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
      const sel =
        filters?.city ||
        filters?.cityObj ||
        filters?.selectedCity ||
        null;

      if (sel) {
        const selectedNorms = [
          typeof sel === "string" ? sel : null,
          sel.slug,
          sel.cityKey,
          sel.city,
          sel.formatted,
          sel.label,
          sel.value,
          sel.name,
          sel.displayName,
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
      // user can select 1 or many services, they can be objects or strings
      const selectedServiceKeys = filters.services
        .map((svc: any) => {
          if (!svc) return null;
          // try to take key/value/name/label in this order
          const raw =
            svc.key ||
            svc.value ||
            svc.serviceKey ||
            svc.name ||
            svc.label ||
            (typeof svc === 'string' ? svc : '');

          return raw ? raw.toString().trim().toLowerCase() : null;
        })
        .filter(Boolean);

      filtered = filtered.filter((card: any) => {
        // card can store services in different fields
        const cardServicesRaw =
          card.masterServices ||
          card.serviceKeys ||
          card.services ||
          card.serviceNames ||
          [];

        // normalize to array
        const cardServicesArr = Array.isArray(cardServicesRaw)
          ? cardServicesRaw
          : [cardServicesRaw];

        if (cardServicesArr.length === 0) return false;

        // bring card services to lowercase keys
        const cardServiceKeys = cardServicesArr
          .map((cs: any) => {
            if (!cs) return null;
            const raw =
              (typeof cs === 'string'
                ? cs
                : cs.key || cs.value || cs.name || cs.label || '') || '';
            return raw.toString().trim().toLowerCase();
          })
          .filter(Boolean);

        // check intersection: card must have at least ONE of selected services
        return cardServiceKeys.some((cs: string) =>
          selectedServiceKeys.includes(cs)
        );
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
            (typeof lng === 'string' ? lng : '');

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
              (typeof cl === 'string'
                ? cl
                : cl.key || cl.value || cl.code || cl.name || cl.label || '') || '';
            return raw.toString().trim().toLowerCase();
          })
          .filter(Boolean);

        // card must have at least ONE selected language
        return cardLangKeys.some((cl: string) => selectedLangKeys.includes(cl));
      });
    }

    // Filter by rating minimum
    if (filters.ratingGte) {
      filtered = filtered.filter((card) => (card.rating || 0) >= filters.ratingGte);
    }

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
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No reviews yet.</div>
            <div className="text-gray-400 text-sm mt-2">
              Be the first to share your experience!
            </div>
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {filteredCards.map((review) => {
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
                    totalReviews={review.totalReviews}
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
