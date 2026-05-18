'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deleteReview } from '@/lib/reviews';
import { uploadReviewPhotos } from '@/lib/reviews/uploadReviewPhotos';
import { probeStorageRules } from '@/lib/reviews/probeStorageRules';
import { createReviewViaApi } from '@/lib/reviews/createClient';
import { fetchReviews } from '@/lib/reviews/fetchList';
import type { ReviewDoc, ReviewSubject } from '@/lib/reviews/types';
import ReviewPhotos from '@/components/reviews/ReviewPhotos';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

function Stars({ value }: { value: number }) {
 return (
 <div className="flex items-center gap-0.5">
 {[1,2,3,4,5].map(i => (
 <span key={i} aria-hidden className={i <= value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
 ))}
 <span className="sr-only">{value} of 5</span>
 </div>
 );
}

function AddReviewForm({ subject, onCreated }: { subject: { type: 'master'|'listing'; id: string }; onCreated: () => void }) {
 const { user } = useAuth();
 const [rating, setRating] = useState<1|2|3|4|5>(5);
 const [text, setText] = useState('');
 const [files, setFiles] = useState<File[]>([]);
 const [previews, setPreviews] = useState<string[]>([]);
 const [loading, setLoading] = useState(false);
 const [successMsg, setSuccessMsg] = useState<string | null>(null);
 const [errorMsg, setErrorMsg] = useState<string | null>(null);
 const canSubmit = !!user && rating >= 1 && rating <= 5 && text.trim().length > 0;

 useEffect(() => {
   if (process.env.NODE_ENV === 'development' && user) {
     probeStorageRules();
   }
 }, [user]);

 function onPick(e: React.ChangeEvent<HTMLInputElement>) {
 const arr = Array.from(e.target.files ?? []).slice(0, 3);
 setFiles(arr);
 setPreviews(arr.map(f => URL.createObjectURL(f)));
 }

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!user) return;
 setLoading(true);
 setErrorMsg(null);
 setSuccessMsg(null);
 try {
 const photoUrls = await uploadReviewPhotos(files, { masterId: subject.id });
 
 console.debug('[Reviews] Creating review with subject →', subject);
 await createReviewViaApi({
   subject,
   rating: Number(rating),
   text: text.trim(),
   photos: photoUrls.map(url => ({ url, path: url })),
 });
 
 setText('');
 setFiles([]);
 setPreviews([]);
 setRating(5);
 setSuccessMsg('Your review was added successfully.');
 onCreated();
 } catch (err: any) {
 console.error('[Review] create failed', err);
 let msg = 'Failed to submit review';
 if (err?.message) {
   if (err.message.includes('sign in')) {
     msg = 'Please sign in to leave a review.';
   } else if (err.message.includes('Invalid subject') || err.message.includes('Text too long')) {
     msg = err.message;
   } else {
     msg = err.message;
   }
 }
 setErrorMsg(msg);
 } finally {
 setLoading(false);
 }
 }

 if (!user) return <div className="text-sm text-gray-500">Please log in to add a review.</div>;

 return (
 <form onSubmit={onSubmit} className="space-y-3 min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-sm text-gray-600">Your rating:</span>
 <select value={rating} onChange={(e)=>setRating(Number(e.target.value) as any)}
 className="rounded border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-sm">
 {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
 </select>
 <Stars value={rating} />
 </div>

 <textarea
 value={text}
 onChange={(e)=>setText(e.target.value)}
 rows={4}
 placeholder="Describe your experience..."
 className="w-full min-w-0 rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5"
 />

 <div>
 <label className="text-sm font-medium text-gray-700">Photos (up to 3)</label>
 <input type="file" accept="image/*" multiple onChange={onPick}
 className="mt-1 block w-full max-w-full text-sm" />
 {!!previews.length && (
 <div className="mt-2 flex gap-2 flex-wrap">
 {previews.map((src,i)=>(
 // eslint-disable-next-line @next/next/no-img-element
 <img key={i} src={src} alt={`preview ${i+1}`} className="h-20 w-20 object-cover rounded border" />
 ))}
 </div>
 )}
 </div>

 <button disabled={!canSubmit || loading}
 className="rounded-lg bg-pink-600 text-white px-4 py-2 hover:bg-pink-700 disabled:opacity-60">
 {loading ? 'Submitting…' : 'Add review'}
 </button>

 {successMsg && <p className="text-green-600 text-sm mt-2">{successMsg}</p>}
 {errorMsg && <p className="text-red-600 text-sm mt-2">{errorMsg}</p>}
 </form>
 );
}

function ReviewListBlock({
  loading,
  visibleReviews,
  uniqueReviews,
  canShowMore,
  expandButtonLabel,
  sortedCount,
  onShowMore,
  onReload,
  user,
}: {
  loading: boolean;
  visibleReviews: ReviewDoc[];
  uniqueReviews: ReviewDoc[];
  canShowMore: boolean;
  expandButtonLabel: string;
  sortedCount: number;
  onShowMore: () => void;
  onReload: () => void;
  user: ReturnType<typeof useAuth>['user'];
}) {
  const buttonLabel =
    expandButtonLabel === 'Show all reviews'
      ? `${expandButtonLabel} (${sortedCount})`
      : expandButtonLabel;

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">Loading reviews...</div>
    );
  }
  if (uniqueReviews.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 rounded border">No reviews yet</div>
    );
  }
  return (
    <div className="space-y-3 min-w-0">
      {visibleReviews.map((r) => (
        <div key={r.id} className="rv-fade-in border rounded-lg p-4 bg-white shadow-sm min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <ProfileAvatar user={r.author} size={36} className="border border-gray-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{r.author?.name || 'User'}</div>
              <div className="text-xs text-gray-500">
                {r.createdAtISO
                  ? new Date(r.createdAtISO).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : ''}
              </div>
            </div>
            {user?.uid === r.authorUid && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Delete this review?')) {
                    await deleteReview(r.id);
                    onReload();
                  }
                }}
                className="text-red-600 hover:underline text-sm shrink-0"
              >
                Delete
              </button>
            )}
          </div>
          <div className="mb-2">
            <Stars value={r.rating} />
          </div>
          {r.text && (
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">{r.text}</p>
          )}
          <ReviewPhotos review={r} />
        </div>
      ))}
      {canShowMore ? (
        <button
          type="button"
          onClick={onShowMore}
          className="w-full rounded-lg border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-100"
        >
          {buttonLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ReviewsSection({
 listingId,
 subjectType = 'listing',
 initialItems,
 alternateSubjectId,
 initialVisibleCount,
 layout = 'default',
 hideHeaderSummary = false,
 expandButtonLabel = 'Show all reviews',
 leadingSections,
}: {
 listingId: string;
 subjectType?: 'master' | 'listing';
 initialItems?: ReviewDoc[];
 alternateSubjectId?: string;
 initialVisibleCount?: number;
 layout?: 'default' | 'split';
 hideHeaderSummary?: boolean;
 expandButtonLabel?: string;
 /** Rendered before split form/list blocks (master profile listings). */
 leadingSections?: ReactNode;
}) {
 const { user } = useAuth();
 const [items, setItems] = useState<ReviewDoc[]>(initialItems ?? []);
 const [loading, setLoading] = useState(!(initialItems && initialItems.length > 0));
 const [showAllReviews, setShowAllReviews] = useState(false);

 const listingIdStr = String(listingId);
 const subject: ReviewSubject = { type: subjectType, id: listingIdStr };

 async function loadReviews() {
   try {
     setLoading(true);
     console.debug('[Reviews] subject →', subject);
     let reviews = await fetchReviews(subject);
     if (
       !reviews.length &&
       alternateSubjectId &&
       alternateSubjectId !== listingIdStr
     ) {
       reviews = await fetchReviews({ type: subjectType, id: alternateSubjectId });
     }
     setItems(reviews.length ? reviews : (initialItems ?? []));
   } catch (e: any) {
     console.error('[ReviewsSection] load failed:', e);
   } finally {
     setLoading(false);
   }
 }

 useEffect(() => {
   if (initialItems?.length) {
     setItems(initialItems);
   }
   loadReviews();
 }, [listingId, subjectType, alternateSubjectId]);

 const uniqueReviews = useMemo(() => {
   const unique: ReviewDoc[] = [];
   const seen = new Set<string>();
   for (const r of items) {
     if (!r.id) {
       unique.push(r);
       continue;
     }
     if (!seen.has(r.id)) {
       seen.add(r.id);
       unique.push(r);
     }
   }
   return unique;
 }, [items]);

 const avg = useMemo(() => {
 if (!uniqueReviews.length) return 0;
 return Math.round((uniqueReviews.reduce((s,r)=>s+r.rating,0)/uniqueReviews.length)*10)/10;
 }, [uniqueReviews]);

 const sortedReviews = useMemo(() => {
   return [...uniqueReviews].sort((a, b) => {
     const au = a.createdAtISO ? new Date(a.createdAtISO).getTime() : 0;
     const bu = b.createdAtISO ? new Date(b.createdAtISO).getTime() : 0;
     return bu - au;
   });
 }, [uniqueReviews]);

 const visibleReviews = useMemo(() => {
   if (!initialVisibleCount || showAllReviews) return sortedReviews;
   return sortedReviews.slice(0, initialVisibleCount);
 }, [sortedReviews, initialVisibleCount, showAllReviews]);

 const canShowMore =
   typeof initialVisibleCount === "number" &&
   sortedReviews.length > initialVisibleCount &&
   !showAllReviews;

 const listBlock = (
   <ReviewListBlock
     loading={loading}
     visibleReviews={visibleReviews}
     uniqueReviews={uniqueReviews}
     canShowMore={canShowMore}
     expandButtonLabel={expandButtonLabel}
     sortedCount={sortedReviews.length}
     onShowMore={() => setShowAllReviews(true)}
     onReload={loadReviews}
     user={user}
   />
 );

 if (layout === 'split') {
   return (
     <>
       {leadingSections}
       <section className="mt-8 min-w-0 space-y-4">
         <h2 className="text-lg font-semibold">Add review</h2>
         <AddReviewForm subject={subject} onCreated={loadReviews} />
       </section>
       <section className="mt-8 min-w-0 space-y-4">
         <h2 className="text-lg font-semibold">Reviews</h2>
         {listBlock}
       </section>
     </>
   );
 }

 return (
 <section className="mt-10 min-w-0 space-y-6">
 {!hideHeaderSummary && (
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-xl font-semibold">Reviews</h2>
 <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
 <Stars value={Math.round(avg)} /> <span>{avg || '—'} / 5</span>
 <span>• {uniqueReviews.length} review(s)</span>
 </div>
 </div>
 )}

 <AddReviewForm subject={subject} onCreated={loadReviews} />
 {listBlock}
 </section>
 );
}
