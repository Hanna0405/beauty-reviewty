"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import Link from "next/link";
import ReviewtyCreateModal from "./ReviewtyCreateModal";
import { fetchMastersByUids, type MinimalMaster } from "./lib/joinMasters";
import { buildPersonLabel } from "./lib/personLabel";
import { cityToDisplay } from "@/lib/city/format";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { ensureKeyObject } from "@/lib/filters/normalize";
import type { TagOption } from "@/types/tags";

function safeJoin(v: any): string {
  if (!v) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v);
}

function safeText(v: any): string {
  if (v == null) return "";
  if (typeof v === "object") {
    // Do NOT render objects; try to stringify most common cases
    if ("name" in v) return String((v as any).name ?? "");
    return "";
  }
  return String(v);
}

type ReviewDoc = {
  id: string;
  text: string;
  rating: number;
  photos?: { url: string; path: string }[];
  city?: string;
  services?: string[];
  languages?: string[];
  createdAt?: any;
  masterRef?: {
    type: "listing" | "community";
    id: string;
    slug?: string;
    listingId?: string;
  };
  masterUid?: string;
  displayName?: string;
  nickname?: string;
  contactName?: string;
  phone?: string;
  // Denormalized fields for public reviews
  masterId?: string;
  masterCity?: string;
  masterServices?: string[];
  masterLanguages?: string[];
  masterDisplay?: string;
  masterKeywords?: string[];
  masterSlug?: string;
};

const PAGE_SIZE = 12;

export default function ReviewtyPage() {
  // State for filters (matching Masters page pattern)
  const [city, setCity] = useState<any | null>(null);
  const [services, setServices] = useState<TagOption[]>([]);
  const [languages, setLanguages] = useState<TagOption[]>([]);
  const [ratingGte, setRatingGte] = useState<number | undefined>(undefined);
  const [personQuery, setPersonQuery] = useState<string>("");

  const [items, setItems] = useState<ReviewDoc[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mastersMap, setMastersMap] = useState<Record<string, MinimalMaster>>(
    {}
  );

  const queryParams = useMemo(() => {
    const params: any = {};
    if (city?.formatted) {
      params.city = city.formatted;
    }
    if (services.length) {
      params.services = services.map((s) => s.key);
    }
    if (languages.length) {
      params.languages = languages.map((l) => l.key);
    }
    if (ratingGte != null) {
      params.ratingGte = ratingGte;
    }
    return params;
  }, [city, services, languages, ratingGte]);

  async function fetchPage(reset = false) {
    if (loading || (done && !reset)) return;
    setLoading(true);
    try {
      // Build Firestore query with proper ordering and filters
      const baseConstraints: any[] = [
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      ];

      // exact match filters (safe to stack)
      if (queryParams.city) {
        baseConstraints.unshift(where("masterCity", "==", queryParams.city));
      }
      if (queryParams.ratingGte != null) {
        baseConstraints.unshift(where("rating", ">=", queryParams.ratingGte));
      }

      // we are only allowed ONE array-contains.
      // Priority order: services first, then languages.
      // We'll record whichever one we used; the other one will be applied client-side.
      let usedArrayContains: null | { field: string; value: string } = null;

      if (queryParams.services?.length) {
        baseConstraints.unshift(
          where("masterServices", "array-contains", queryParams.services[0])
        );
        usedArrayContains = {
          field: "masterServices",
          value: queryParams.services[0],
        };
      } else if (queryParams.languages?.length) {
        baseConstraints.unshift(
          where("masterLanguages", "array-contains", queryParams.languages[0])
        );
        usedArrayContains = {
          field: "masterLanguages",
          value: queryParams.languages[0],
        };
      }

      if (personQuery?.trim()) {
        const keyword = personQuery.trim().toLowerCase();
        const phoneDigits = keyword.replace(/\D+/g, "");
        const term = phoneDigits.length >= 6 ? phoneDigits : keyword;
        if (term)
          baseConstraints.unshift(
            where("masterKeywords", "array-contains", term)
          );
      }

      const q = query(collection(db, "publicReviews"), ...baseConstraints);

      const snap = await getDocs(
        reset
          ? query(q, limit(PAGE_SIZE))
          : cursor
          ? query(q, startAfter(cursor))
          : q
      );

      // Normalize data before setState
      const raw = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          rating: Number(data.rating ?? 0),
          text: safeText(data.text),
          photos: Array.isArray(data.photos) ? data.photos : [],
          city: data.city, // keep as-is, render via cityName()
          services: data.services, // can be string[] or string
          languages: data.languages,
          listingId: data.listingId,
          createdAt: data.createdAt,
          author: data.author ?? data.authorMasked ?? null,
          masterRef: data.masterRef,
          masterUid: data.masterUid,
          displayName: data.displayName,
          nickname: data.nickname,
          contactName: data.contactName,
          phone: data.phone,
          masterId: data.masterId,
          masterCity: data.masterCity,
          masterServices: data.masterServices,
          masterLanguages: data.masterLanguages,
          masterDisplay: data.masterDisplay,
          masterKeywords: data.masterKeywords,
          masterSlug: data.masterSlug,
        };
      }) as ReviewDoc[];

      // Now do post-filter on the client side
      let filtered = raw;

      // If we *didn't* use services filter in Firestore,
      // but services filter is set, filter locally:
      if (
        queryParams.services?.length &&
        (!usedArrayContains || usedArrayContains.field !== "masterServices")
      ) {
        filtered = filtered.filter((rev) => {
          if (!Array.isArray(rev.masterServices)) return false;
          return queryParams.services.some((service: string) =>
            rev.masterServices?.includes(service)
          );
        });
      }

      // If we *didn't* use languages filter in Firestore,
      // but languages filter is set, filter locally:
      if (
        queryParams.languages?.length &&
        (!usedArrayContains || usedArrayContains.field !== "masterLanguages")
      ) {
        filtered = filtered.filter((rev) => {
          if (!Array.isArray(rev.masterLanguages)) return false;
          return queryParams.languages.some((language: string) =>
            rev.masterLanguages?.includes(language)
          );
        });
      }

      const last = snap.docs[snap.docs.length - 1] ?? null;

      console.log("[reviewty] loaded", filtered.length);

      setItems(reset ? filtered : [...items, ...filtered]);
      setCursor(last);
      setDone(snap.size < PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  // Fetch master data when items change
  const masterUids = useMemo(
    () =>
      Array.from(new Set(items.map((r: any) => r.masterUid).filter(Boolean))),
    [items]
  );

  useEffect(() => {
    if (masterUids.length > 0) {
      fetchMastersByUids(masterUids).then(setMastersMap);
    }
  }, [masterUids]);

  // Apply person query filter
  const filteredItems = useMemo(() => {
    if (!personQuery?.trim()) return items;

    const q = personQuery.trim().toLowerCase();
    return items.filter((r: any) => {
      const m = mastersMap[r.masterUid];
      const label = buildPersonLabel(r, m)?.toLowerCase() ?? "";
      const extra = [
        r.displayName,
        r.nickname,
        r.contactName,
        r.phone,
        m?.displayName,
        m?.nickname,
        m?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return label.includes(q) || extra.includes(q);
    });
  }, [items, mastersMap, personQuery]);

  useEffect(() => {
    // refetch when filters change (except personQuery which is client-side)
    setCursor(null);
    setDone(false);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, services, languages, ratingGte]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">People's Reviews</h1>
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("reviewty:openCreate"))
          }
          className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
        >
          Add review
        </button>
      </header>

      {/* Filters */}
      <form
        className="flex w-full flex-wrap items-start gap-2 md:flex-nowrap md:items-end bg-pink-50/60 rounded-md p-3 border border-pink-200"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* City */}
        <div className="flex-1 min-w-[140px]">
          <CityAutocomplete
            value={city}
            onChange={(val: any) => {
              // val could be string or object depending on component,
              // normalize to string city name for our filter state
              if (typeof val === "string") {
                setCity({ formatted: val });
              } else if (val && typeof val.label === "string") {
                setCity({ formatted: val.label });
              } else if (val && typeof val.cityName === "string") {
                setCity({ formatted: val.cityName });
              } else if (val && val.formatted) {
                setCity(val);
              } else {
                setCity(null);
              }
            }}
            placeholder="City"
          />
        </div>

        {/* Service */}
        <div className="flex-1 min-w-[160px]">
          <MultiSelectAutocompleteV2
            label=""
            options={SERVICE_OPTIONS}
            value={services}
            onChange={(vals) => {
              const normalized = vals
                .map((v) => ensureKeyObject<TagOption>(v))
                .filter(Boolean) as TagOption[];
              setServices(normalized);
            }}
            placeholder="Service (e.g., hair-braids)"
          />
        </div>

        {/* Languages */}
        <div className="flex-1 min-w-[140px]">
          <MultiSelectAutocompleteV2
            label=""
            options={LANGUAGE_OPTIONS}
            value={languages}
            onChange={(vals) => {
              const normalized = vals
                .map((v) => ensureKeyObject<TagOption>(v))
                .filter(Boolean) as TagOption[];
              setLanguages(normalized);
            }}
            placeholder="Languages"
          />
        </div>

        {/* Rating */}
        <div className="w-[90px]">
          <select
            className="block w-full rounded-md border border-pink-300 bg-white px-2 py-2 text-sm text-gray-800 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            value={ratingGte ?? ""}
            onChange={(e) =>
              setRatingGte(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Rating</option>
            <option value="5">5★</option>
            <option value="4">4★+</option>
            <option value="3">3★+</option>
            <option value="2">2★+</option>
            <option value="1">1★+</option>
          </select>
        </div>

        {/* Name / nickname / phone */}
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            className="block w-full rounded-md border border-pink-300 bg-white px-2 py-2 text-sm text-gray-800 shadow-sm placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
            placeholder="Name / nickname / phone"
            value={personQuery}
            onChange={(e) => setPersonQuery(e.target.value)}
          />
        </div>

        {/* Reset */}
        <div className="flex-none">
          <button
            type="button"
            onClick={() => {
              setCity(null);
              setServices([]);
              setLanguages([]);
              setRatingGte(undefined);
              setPersonQuery("");
            }}
            className="inline-flex items-center rounded-md border border-pink-300 bg-white px-3 py-2 text-xs font-medium text-pink-700 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Feed */}
      <ul className="grid md:grid-cols-2 gap-4">
        {filteredItems.map((r) => {
          const master = mastersMap[r.masterUid || ""];
          const personLabel = buildPersonLabel(r, master);

          return (
            <li key={r.id} className="rounded-xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {"★".repeat(Math.round(r.rating || 0))}
                </div>
                <div className="text-sm text-gray-500">
                  {safeText(r.masterCity) || cityToDisplay(r.city) || "—"}
                </div>
              </div>
              <p className="text-gray-800 line-clamp-4">{safeText(r.text)}</p>
              {!!r.photos?.length && (
                <div className="flex gap-2">
                  {r.photos.slice(0, 3).map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.path ?? i}
                      src={p.url}
                      alt={`photo ${i + 1}`}
                      className="h-24 w-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              {/* Master info and link */}
              <div className="mt-2 text-sm text-zinc-600">
                <span className="font-medium">
                  {safeText(r.masterCity) || "—"}
                </span>
              </div>
              <div className="mt-1">
                {/* Link to master */}
                {r.masterRef?.type === "listing" && r.masterRef.id && (
                  <Link
                    href={`/masters/${String(r.masterRef.id)}`}
                    className="text-pink-600 underline"
                  >
                    Master card —{" "}
                    {safeText(r.masterDisplay) ||
                      safeText(personLabel) ||
                      "Unknown"}
                  </Link>
                )}
                {r.masterRef?.type === "community" && r.masterRef.slug && (
                  <Link
                    href={`/reviewty/m/${r.masterRef.slug}`}
                    className="text-pink-600 underline"
                  >
                    Master card —{" "}
                    {safeText(r.masterDisplay) ||
                      safeText(personLabel) ||
                      "Unknown"}
                  </Link>
                )}
                {!r.masterRef && r.masterId && (
                  <Link
                    href={`/reviewty/m/${r.masterSlug || r.masterId}`}
                    className="text-pink-600 underline"
                  >
                    Master card — {safeText(r.masterDisplay) || "Unknown"}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 flex justify-center">
        {!done && !personQuery ? (
          <button
            onClick={() => fetchPage()}
            disabled={loading}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Show more"}
          </button>
        ) : (
          <div className="text-gray-500">That's all</div>
        )}
      </div>

      {/* Creation modal is handled below */}
      <ReviewtyCreateModal />
    </div>
  );
}
