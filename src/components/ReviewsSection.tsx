'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuthUser } from '@/lib/useAuthUser';
import { listenPublicReviews, createReview, deleteReview, uploadReviewPhoto } from '@/lib/reviews';
import type { Review, ReviewPhoto } from '@/types/reviews';

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

function AddReviewForm({ listingId, onCreated }:{ listingId: string; onCreated: () => void }) {
 const { user } = useAuthUser();
 const [rating, setRating] = useState<1|2|3|4|5>(5);
 const [text, setText] = useState('');
 const [files, setFiles] = useState<File[]>([]);
 const [previews, setPreviews] = useState<string[]>([]);
 const [loading, setLoading] = useState(false);
 const canSubmit = !!user && rating >= 1 && rating <= 5 && text.trim().length > 0;

 function onPick(e: React.ChangeEvent<HTMLInputElement>) {
 const arr = Array.from(e.target.files ?? []).slice(0, 3);
 setFiles(arr);
 setPreviews(arr.map(f => URL.createObjectURL(f)));
 }

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!user) return;
 setLoading(true);
 try {
 const photos: ReviewPhoto[] = [];
 for (const f of files) {
 const up = await uploadReviewPhoto(f);
 photos.push({ url: up.url, path: up.path });
 }
 await createReview({
 listingId,
 authorId: user.uid, // IMPORTANT: Must match auth.uid
 rating,
 text: text.trim(),
 photos,
 });
 setText('');
 setFiles([]);
 setPreviews([]);
 setRating(5);
 onCreated();
 } catch (err) {
 console.error('[Review] create failed', err);
 alert('Failed to submit review');
 } finally {
 setLoading(false);
 }
 }

 if (!user) return <div className="text-sm text-gray-500">Please log in to add a review.</div>;

 return (
 <form onSubmit={onSubmit} className="space-y-3">
 <div className="flex items-center gap-2">
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
 className="w-full rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5"
 />

 <div>
 <label className="text-sm font-medium text-gray-700">Photos (up to 3)</label>
 <input type="file" accept="image/*" multiple onChange={onPick}
 className="mt-1 block w-full text-sm" />
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
 </form>
 );
}

export function ReviewsSection({ listingId }:{ listingId: string }) {
 const { user } = useAuthUser();
 const [items, setItems] = useState<Review[]>([]);
 useEffect(() => {
 return listenPublicReviews(listingId, setItems);
 }, [listingId]);

 const avg = useMemo(() => {
 if (!items.length) return 0;
 return Math.round((items.reduce((s,r)=>s+r.rating,0)/items.length)*10)/10;
 }, [items]);

 return (
 <section className="mt-10 space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-semibold">Reviews</h2>
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Stars value={Math.round(avg)} /> <span>{avg || '—'} / 5</span>
 <span>• {items.length} review(s)</span>
 </div>
 </div>

 <AddReviewForm listingId={listingId} onCreated={()=>{ /* no-op; realtime updates */ }} />

 <ul className="divide-y rounded border">
 {items.map((r)=>(
 <li key={r.id} className="p-4 space-y-2">
 <div className="flex items-center justify-between">
 <Stars value={r.rating} />
 {user?.uid === r.authorId && (
 <div className="flex gap-2">
 <button onClick={()=>deleteReview(r.id!)} className="text-red-600 hover:underline text-sm">Delete</button>
 {/* For minimal scope, edit flow can be added later; keep delete only now */}
 </div>
 )}
 </div>
 <p className="text-gray-800 whitespace-pre-wrap">{r.text}</p>
 {!!r.photos?.length && (
 <div className="flex gap-2 flex-wrap">
 {r.photos.map((p,i)=>(
 // eslint-disable-next-line @next/next/no-img-element
 <img key={p.path ?? p.url ?? i} src={p.url} alt={`review photo ${i+1}`} className="h-24 w-24 object-cover rounded border" />
 ))}
 </div>
 )}
 </li>
 ))}
 {!items.length && <li className="p-6 text-center text-gray-500">No reviews yet</li>}
 </ul>
 </section>
 );
}
