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

// Используй ту же инициализацию Firestore, что у тебя уже есть.
// В твоём проекте судя по импорту — '@/lib/firebase-client' экспортирует db.
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

export default function ClientListing({ id }: { id: string }) {
  const [listing, setListing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (!alive) return;
        const listingData = { id, ...(snap.data() || {}) };
        setListing(listingData);

        // load reviews from subcollection (old source)
        const masterReviewsRef = collection(db, "masters", id, "reviews");
        let masterReviews: any[] = [];
        try {
          const masterReviewsSnap = await getDocs(
            query(masterReviewsRef, orderBy("createdAt", "desc"))
          );
          masterReviews = masterReviewsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        } catch (e) {
          console.warn("Failed to load master subcollection reviews", e);
        }

        // load reviews from root collection (new source from "Existing master")
        let rootReviews: any[] = [];
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
          }));
        } catch (e) {
          console.warn("Failed to load root reviews", e);
        }

        // merge reviews
        const allReviews = [...rootReviews, ...masterReviews];
        
        // Deduplicate reviews by id
        const uniqueReviews: any[] = [];
        const seen = new Set<string>();
        for (const r of allReviews) {
          if (!r.id) {
            // Reviews without id are allowed (shouldn't happen, but safe fallback)
            uniqueReviews.push(r);
            continue;
          }
          if (!seen.has(r.id)) {
            seen.add(r.id);
            uniqueReviews.push(r);
          }
        }
        
        // calculate unified stats
        const totalReviews = uniqueReviews.length;
        const avgRating =
          totalReviews > 0
            ? uniqueReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalReviews
            : 0;
        
        // sort by creation date (new first)
        const sortedReviews = [...uniqueReviews].sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        
        if (!alive) return;
        setAllReviews(sortedReviews);
        setAvgRating(avgRating);
        setTotalReviews(totalReviews);
      } catch (e) {
        console.error('Failed to load listing', e);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (!listing) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  // Extract data for components with normalization
  const photos: string[] = normalizePhotos(listing?.photos ?? listing?.images ?? []);
  const title = toStringSafe(listing?.title ?? listing?.name, "Service");
  const city = normalizeCity(listing?.city ?? listing?.cityName);
  const priceMin = toNumberSafe(listing?.priceMin ?? listing?.minPrice);
  const priceMax = toNumberSafe(listing?.priceMax ?? listing?.maxPrice);
  const languages = normalizeLanguages(listing?.languages ?? listing?.langs ?? []);
  const mId = masterId(listing);
  
  const handleBook = () => setOpen(true);

  return (
    <div className="container mx-auto px-4 py-5 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: gallery */}
        <div className="lg:col-span-7">
          <ListingGallery photos={photos} title={title} />
        </div>

        {/* Right: details */}
        <div className="lg:col-span-5">
          <ListingDetails
            title={title}
            city={city}
            priceMin={priceMin}
            priceMax={priceMax}
            languages={languages}
            onBook={handleBook}
            masterId={mId}
          />
        </div>
      </div>

      {/* Reviews below */}
      <section className="mt-8 lg:mt-12">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        
        {/* header */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>★ {avgRating.toFixed(1)} / 5</span>
          <span>· {totalReviews} review{totalReviews === 1 ? "" : "s"}</span>
        </div>

        {/* Add review form */}
        <ReviewsSection listingId={listing.id} subjectType="listing" />

        {/* list */}
        <div className="mt-4 space-y-3">
          {allReviews.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-yellow-400">
                  {'★'.repeat(Math.round(r.rating || 0))}
                  {'☆'.repeat(5 - Math.round(r.rating || 0))}
                </div>
                <span className="text-sm font-medium">{r.authorName || 'Verified client'}</span>
                {r.createdAt?.toDate && (
                  <span className="text-xs text-gray-500">
                    · {r.createdAt.toDate().toLocaleDateString()}
                  </span>
                )}
              </div>
              {r.text && <p className="text-gray-800 text-sm mb-2">{r.text}</p>}
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
          masterUid={String(listing.masterUid || listing.ownerId || listing.ownerUid || '')}
          onSuccess={()=>{ setOpen(false); }}
        />
      </Modal>
    </div>
  );
}