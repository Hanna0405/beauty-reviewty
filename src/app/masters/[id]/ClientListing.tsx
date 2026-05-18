'use client';

import React, { useEffect, useState } from 'react';
import ListingGallery from '@/components/ListingGallery';
import ListingDetails from '@/components/ListingDetails';
import { ReviewsSection } from '@/components/ReviewsSection';
import Modal from '@/components/ui/Modal';
import BookingForm from '@/components/booking/BookingForm';
import {
 normalizePhotos,
 normalizeCity,
 normalizeLanguages,
 toNumberSafe,
 toStringSafe,
} from "@/lib/normalize";
import { masterId } from "@/lib/listings/presenters";
import type { ClientListingInitialData } from "./types";
import type { ListingReview } from "./loadListingReviews";

import {
 collection,
 doc,
 getDocs,
 getDoc,
 query,
 where,
 orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

function reviewDateLabel(createdAt: unknown): string | null {
  if (!createdAt || typeof createdAt !== "object") return null;
  const value = createdAt as { toDate?: () => Date; _seconds?: number };
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  if (typeof value._seconds === "number") {
    return new Date(value._seconds * 1000).toLocaleDateString();
  }
  return null;
}

type Props = {
  id: string;
  initial?: ClientListingInitialData | null;
};

export default function ClientListing({ id, initial = null }: Props) {
  const hasInitial = Boolean(initial?.listing);
  const [listing, setListing] = useState<any | null>(initial?.listing ?? null);
  const [open, setOpen] = useState(false);
  const [allReviews, setAllReviews] = useState<ListingReview[]>(
    initial?.reviews ?? []
  );
  const [avgRating, setAvgRating] = useState(initial?.avgRating ?? 0);
  const [totalReviews, setTotalReviews] = useState(initial?.totalReviews ?? 0);
  const [masterProfileData, setMasterProfileData] = useState<any>(
    initial?.profile ?? null
  );

  useEffect(() => {
    if (hasInitial) return;

    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (!alive) return;
        const listingData = { id, ...(snap.data() || {}) };
        setListing(listingData);

        const masterReviewsRef = collection(db, "masters", id, "reviews");
        let masterReviews: ListingReview[] = [];
        try {
          const masterReviewsSnap = await getDocs(
            query(masterReviewsRef, orderBy("createdAt", "desc"))
          );
          masterReviews = masterReviewsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ListingReview[];
        } catch (e) {
          console.warn("Failed to load master subcollection reviews", e);
        }

        let rootReviews: ListingReview[] = [];
        try {
          const rootReviewsRef = collection(db, "reviews");
          const rootReviewsSnap = await getDocs(
            query(
              rootReviewsRef,
              where("type", "==", "listing"),
              where("listingId", "==", id)
            )
          );
          rootReviews = rootReviewsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ListingReview[];
        } catch (e) {
          console.warn("Failed to load root reviews", e);
        }

        const mergedReviews = [...rootReviews, ...masterReviews];
        const uniqueReviews: ListingReview[] = [];
        const seen = new Set<string>();
        for (const r of mergedReviews) {
          if (!r.id) {
            uniqueReviews.push(r);
            continue;
          }
          if (!seen.has(r.id)) {
            seen.add(r.id);
            uniqueReviews.push(r);
          }
        }

        const reviewTotal = uniqueReviews.length;
        const reviewAvg =
          reviewTotal > 0
            ? uniqueReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) /
              reviewTotal
            : 0;

        const sortedReviews = [...uniqueReviews].sort((a, b) => {
          const ta =
            (a.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
          const tb =
            (b.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
          return tb - ta;
        });

        if (!alive) return;
        setAllReviews(sortedReviews);
        setAvgRating(reviewAvg);
        setTotalReviews(reviewTotal);

        const mId = masterId(listingData);
        if (mId) {
          try {
            const profileSnap = await getDoc(doc(db, 'profiles', mId));
            if (profileSnap.exists() && alive) {
              setMasterProfileData(profileSnap.data());
            }
          } catch (profileError) {
            console.error('Failed to load master profile data:', profileError);
          }
        }
      } catch (e) {
        console.error('Failed to load listing', e);
      }
    })();
    return () => { alive = false; };
  }, [id, hasInitial]);

  if (!listing) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  const photos: string[] = normalizePhotos(listing?.photos ?? listing?.images ?? []);
  const title = toStringSafe(listing?.title ?? listing?.name, "Service");
  const city = normalizeCity(listing?.city ?? listing?.cityName);
  const priceMin = toNumberSafe(listing?.priceMin ?? listing?.minPrice);
  const priceMax = toNumberSafe(listing?.priceMax ?? listing?.maxPrice);
  const languages = normalizeLanguages(listing?.languages ?? listing?.langs ?? []);
  const mId = masterId(listing);

  const handleBook = () => setOpen(true);

  return (
    <div
      id={listing?.id ? `listing-${listing.id}` : undefined}
      className="container mx-auto px-4 py-5 lg:py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ListingGallery photos={photos} title={title} />
        </div>

        <div className="lg:col-span-5">
          <ListingDetails
            title={title}
            city={city}
            priceMin={priceMin}
            priceMax={priceMax}
            languages={languages}
            onBook={handleBook}
            masterId={mId}
            listingId={listing.id}
          />
        </div>
      </div>

      <section className="mt-8 lg:mt-12">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>★ {avgRating.toFixed(1)} / 5</span>
          <span>· {totalReviews} review{totalReviews === 1 ? "" : "s"}</span>
        </div>

        <ReviewsSection listingId={listing.id} subjectType="listing" />

        <div className="mt-4 space-y-3">
          {allReviews.map((r) => (
            <div key={String(r.id)} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-yellow-400">
                  {'★'.repeat(Math.round(Number(r.rating) || 0))}
                  {'☆'.repeat(5 - Math.round(Number(r.rating) || 0))}
                </div>
                <span className="text-sm font-medium">
                  {String(r.authorName || 'Verified client')}
                </span>
                {reviewDateLabel(r.createdAt) ? (
                  <span className="text-xs text-gray-500">
                    · {reviewDateLabel(r.createdAt)}
                  </span>
                ) : null}
              </div>
              {r.text ? (
                <p className="text-gray-800 text-sm mb-2">{String(r.text)}</p>
              ) : null}
              {Array.isArray(r.photos) && r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {r.photos.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Modal open={open} onClose={()=>setOpen(false)} title="Request booking">
        <BookingForm
          listingId={String(listing.id || '')}
          masterUid={String(mId || listing.masterUid || listing.ownerId || listing.ownerUid || '')}
          onSuccess={()=>{ setOpen(false); }}
          workingHours={masterProfileData?.workingHours}
        />
      </Modal>
    </div>
  );
}
