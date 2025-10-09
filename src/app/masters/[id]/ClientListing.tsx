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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

export default function ClientListing({ id }: { id: string }) {
  const [listing, setListing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (!alive) return;
        setListing({ id, ...(snap.data() || {}) });
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
        <ReviewsSection listingId={listing.id} subjectType="listing" />
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