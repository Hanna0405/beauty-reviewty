'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { resolvePublicUrl, resolveReviewImages } from '@/lib/media/resolvePublicUrl';
import Image from 'next/image';

type Review = {
  id: string;
  text?: string;
  rating?: number;
  userName?: string;
  masterId?: string;
  masterName?: string;
  photos?: string[];
  createdAt?: any;
};

function Stars({ rating = 0 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div aria-label={`${r} out of 5`} className="text-rose-500">
      {'★★★★★'.slice(0, r)}<span className="text-rose-200">{'★★★★★'.slice(r)}</span>
    </div>
  );
}

function ReviewCard({ rev }: { rev: Review }) {
  return (
    <article className="snap-start shrink-0 w-[280px] md:w-[320px] rounded-2xl border border-rose-100 bg-white shadow-sm p-4 mr-4 last:mr-0">
      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-gray-100">
        {(rev as any)._images?.length ? (
          <Image
            src={(rev as any)._images[0]}
            alt={rev.title ?? "review photo"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs opacity-60">
            No photo
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <h4 className="font-semibold text-rose-900 text-sm md:text-base line-clamp-1">
          {rev.masterName || 'Beauty master'}
        </h4>
        <Stars rating={rev.rating ?? 0} />
      </div>
      <p className="mt-2 text-rose-700/90 text-sm line-clamp-4">{rev.text || ''}</p>
      <p className="mt-3 text-xs text-rose-500/80">by {rev.userName || 'Client'}</p>
    </article>
  );
}

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Fetch latest real reviews
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(12));
        const snap = await getDocs(q);
        if (!mounted) return;
        const raw = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        const reviewsWithImages = await resolveReviewImages(raw);
        if (!mounted) return;
        setReviews(reviewsWithImages);
      } catch (e: any) {
        setError(e?.message || 'Failed to load reviews');
        setReviews([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const scrollBy = useCallback((dx: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: 'smooth' });
  }, []);

  if (error) {
    return null; // fail silent to avoid page break; we can log error if needed
  }

  const isLoading = reviews === null;

  return (
    <section className="container mx-auto px-4 my-6 md:my-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-rose-900 font-semibold text-base md:text-lg">Latest reviews</h3>
        <div className="hidden md:flex gap-2">
          <button onClick={()=>scrollBy(-360)} className="px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50">‹</button>
          <button onClick={()=>scrollBy(360)} className="px-3 py-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50">›</button>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({length: 4}).map((_,i)=>(
            <div key={i} className="snap-start shrink-0 w-[280px] md:w-[320px] rounded-2xl border border-rose-100 bg-white shadow-sm p-4 mr-4">
              <div className="w-full aspect-[16/9] rounded-xl bg-rose-100/70 skeleton-shimmer mb-3" />
              <div className="h-4 w-1/2 bg-rose-100/80 rounded-md skeleton-shimmer" />
              <div className="h-3 w-4/5 bg-rose-100/70 rounded-md skeleton-shimmer mt-2" />
              <div className="h-3 w-3/5 bg-rose-100/60 rounded-md skeleton-shimmer mt-2" />
            </div>
          ))}
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="relative">
          <div
            ref={trackRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-p-4 pr-4 -mr-4 pb-2"
          >
            {reviews.map((rev)=>(<ReviewCard key={rev.id} rev={rev} />))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
