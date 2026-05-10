"use client";

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ratingValue,
  reviewsCountValue,
  type ListingLike,
} from "@/lib/listings/presenters";

/** Same shape as FeaturedMastersRow cards + hero badge fields */
export type TopRatedListingRow = {
  id: string;
  title: string;
  displayName: string;
  city: string;
  services: { name?: string; key?: string }[];
  /** Resolved preview URL (http/https), same logic as listing cards */
  image: string | null;
  ratingAvg: number;
  reviewCount: number;
  ratingAvgNullable: number | null;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export const TOP_RATED_LISTINGS_LIMIT = 3;

function readTimestampMs(data: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = data[key];
    if (v == null) continue;
    if (
      typeof v === "object" &&
      v !== null &&
      "toMillis" in v &&
      typeof (v as { toMillis: () => number }).toMillis === "function"
    ) {
      return (v as { toMillis: () => number }).toMillis();
    }
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function firstArrayImage(entry: unknown): string | null {
  if (entry == null) return null;
  if (typeof entry === "string") return entry.startsWith("http") ? entry : null;
  if (typeof entry === "object" && entry !== null) {
    const o = entry as Record<string, unknown>;
    const u =
      (typeof o.url === "string" && o.url) ||
      (typeof o.downloadURL === "string" && o.downloadURL) ||
      (typeof o.src === "string" && o.src) ||
      null;
    return typeof u === "string" && u.startsWith("http") ? u : null;
  }
  return null;
}

/** Same resolution chain as Top rated listing cards, plus common alternate fields */
export function resolveListingCardImage(data: DocumentData): string | null {
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.photos) && d.photos.length > 0) {
    const u = firstArrayImage(d.photos[0]);
    if (u) return u;
  }
  if (Array.isArray(d.images) && d.images.length > 0) {
    const u = firstArrayImage(d.images[0]);
    if (u) return u;
  }
  if (Array.isArray(d.gallery) && d.gallery.length > 0) {
    const u = firstArrayImage(d.gallery[0]);
    if (u) return u;
  }

  const scalarCandidates = [
    d.coverUrl,
    d.imageUrl,
    d.photoUrl,
    d.photoURL,
    d.coverImage,
    d.coverImageUrl,
  ];
  for (const c of scalarCandidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  return null;
}

function mapListingDocToTopRatedRow(
  doc: QueryDocumentSnapshot
): TopRatedListingRow {
  const data = doc.data();
  const raw = data as ListingLike;
  const plain = data as Record<string, unknown>;

  const image = resolveListingCardImage(data);

  const createdAtMs = readTimestampMs(plain, ["createdAt", "created_at"]);
  const updatedAtMs = readTimestampMs(plain, ["updatedAt", "updated_at"]);

  const reviewCount = reviewsCountValue(raw);
  const ratingAvgNullable = ratingValue(raw);

  return {
    id: doc.id,
    title: data.title || data.name || data.displayName || "Listing",
    displayName: data.displayName || data.title || data.name || "Listing",
    city:
      data.cityName ||
      data.city?.formatted ||
      data.city?.name ||
      data.city ||
      "",
    services: data.services || [],
    image,
    ratingAvg: data.ratingAvg || data.rating || 0,
    reviewCount,
    ratingAvgNullable,
    createdAtMs,
    updatedAtMs,
  };
}

export async function fetchTopRatedMastersRows(): Promise<TopRatedListingRow[]> {
  const qy = query(
    collection(db, "listings"),
    orderBy("createdAt", "desc"),
    limit(TOP_RATED_LISTINGS_LIMIT)
  );
  const snap = await getDocs(qy);
  return snap.docs.map(mapListingDocToTopRatedRow);
}

function isUsableHttp(url: string | null | undefined): url is string {
  return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
}

/** Sort: createdAt desc, then updatedAt desc, then stable id */
export function sortTopRatedRows(rows: TopRatedListingRow[]): TopRatedListingRow[] {
  return [...rows].sort((a, b) => {
    const ca = a.createdAtMs;
    const cb = b.createdAtMs;
    if (ca != null && cb != null && ca !== cb) return cb - ca;
    if (ca != null && cb == null) return -1;
    if (ca == null && cb != null) return 1;
    const ua = a.updatedAtMs;
    const ub = b.updatedAtMs;
    if (ua != null && ub != null && ua !== ub) return ub - ua;
    if (ua != null && ub == null) return -1;
    if (ua == null && ub != null) return 1;
    return a.id.localeCompare(b.id);
  });
}

export function pickHeroFromTopRatedRows(
  rows: TopRatedListingRow[]
): { listing: TopRatedListingRow | null; heroImageUrl: string | null } {
  const sorted = sortTopRatedRows(rows);
  for (const row of sorted) {
    if (isUsableHttp(row.image)) {
      return { listing: row, heroImageUrl: row.image };
    }
  }
  return { listing: null, heroImageUrl: null };
}
