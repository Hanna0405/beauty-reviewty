'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { SafeText } from '@/lib/safeText';
import BookingButton from '@/components/booking/BookingButton';
import { ReviewsSection } from '@/components/ReviewsSection';
import { fetchProfileByUid } from '@/lib/data/profiles';

type Photo = { url: string; path?: string; width?: number; height?: number };
type Listing = {
  id: string;
  title?: string;
  photos?: Photo[];
  cityName?: string;
  city?: { formatted?: string; name?: string };
  citySlug?: string;
  serviceNames?: string[];
  services?: string[];
  languageNames?: string[];
  languages?: string[];
  rating?: number;
  reviewsCount?: number;
  ownerUid?: string;
  masterUid?: string;
  status?: string;
};
type Profile = {
  uid: string;
  displayName?: string;
  avatarUrl?: string;
  city?: string;
  cityLabel?: string;
  services?: string[];
  ratingAvg?: number;
  reviewsCount?: number;
  slug?: string;
};

export default function ListingDetail({ listing }: { listing: Listing }) {
  const [master, setMaster] = useState<Profile | null>(null);
  const [idx, setIdx] = useState(0);

  if (!listing) return null;

  // Load master profile if masterUid is available
  useEffect(() => {
    if (listing.masterUid) {
      (async () => {
        try {
          const masterProfile = await fetchProfileByUid(listing.masterUid);
          setMaster(masterProfile);
        } catch (error) {
          console.error('Error loading master profile:', error);
        }
      })();
    }
  }, [listing.masterUid]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!listing?.photos?.length) return;
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % listing.photos!.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + listing.photos!.length) % listing.photos!.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listing]);

  const photos = listing.photos ?? [];
  const active = photos[idx];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs text-sm mb-3">
        <ul>
          <li><a href="/masters">Masters</a></li>
          {listing.citySlug && <li><a href={`/masters?city=${listing.citySlug}`}><SafeText value={listing.cityName ?? listing.city} /></a></li>}
          {master?.slug && <li><a href={`/masters/${master.slug}`}>{master.displayName}</a></li>}
          <li>Listing</li>
        </ul>
      </nav>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
        {/* GALLERY */}
        <div>
          <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
            {active?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.url} alt={`${listing.title} ${idx+1}`} className="h-full w-full object-cover select-none" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">No photos yet</div>
            )}
            {photos.length > 1 && (
              <>
                <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
                  aria-label="Prev" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 hover:bg-white">
                  ←
                </button>
                <button onClick={() => setIdx((i) => (i + 1) % photos.length)}
                  aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 hover:bg-white">
                  →
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p.path ?? p.url} onClick={() => setIdx(i)}
                  className={`relative h-20 w-28 rounded-lg overflow-hidden border ${i===idx ? 'border-pink-600' : 'border-transparent'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`thumb ${i+1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <aside className="space-y-4">
          <h1 className="text-3xl font-semibold"><SafeText value={listing.title} /></h1>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {listing.status && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700"><SafeText value={listing.status} /></span>}
            {listing.city && <span className="text-gray-600"><SafeText value={listing.cityName ?? listing.city} /></span>}
          </div>

          {listing.services?.length ? (
            <div>
              <div className="font-medium mb-1">Services</div>
              <div className="flex flex-wrap gap-2">
                {listing.services.map(s => <span key={s} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"><SafeText value={s} /></span>)}
              </div>
            </div>
          ) : null}

          {listing.languages?.length ? (
            <div>
              <div className="font-medium mb-1">Languages</div>
              <div className="flex flex-wrap gap-2">
                {listing.languages.map(l => <span key={l} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"><SafeText value={l} /></span>)}
              </div>
            </div>
          ) : null}

          <BookingButton 
            listingId={listing.id}
            masterUid={listing.masterUid || ''}
            serviceKey="general"
            serviceName="General Service"
          />
        </aside>

        {/* About the Master Card */}
        {master && (
          <aside className="card bg-base-100 border p-4 mt-4">
            <div className="flex items-center gap-3">
              <img src={master.avatarUrl || '/placeholder.jpg'} alt={master.displayName} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <a href={`/masters/${master.slug || master.uid}`} className="font-medium hover:underline">{master.displayName}</a>
                <div className="text-sm opacity-70"><SafeText value={master.cityName ?? master.city} />{!master.cityName && !master.city && 'City'}</div>
                <div className="text-sm">★ {master.ratingAvg?.toFixed?.(1) ?? "—"} ({master.reviewsCount ?? 0})</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* show up to 3 service tags from the master profile */}
              {master.services?.slice(0,3).map(s => <span key={s} className="badge"><SafeText value={s} /></span>)}
            </div>
            <a href={`/masters/${master.slug || master.uid}`} className="btn btn-sm btn-outline mt-3">View profile</a>
          </aside>
        )}

        <ReviewsSection listingId={listing.id} />
      </div>
    </div>
  );
}
