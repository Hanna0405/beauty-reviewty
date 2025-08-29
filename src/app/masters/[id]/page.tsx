'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
 collection,
 doc,
 getDoc,
 onSnapshot,
 orderBy,
 query,
 where,
 Timestamp,
} from 'firebase/firestore';
import RatingStars from '@/components/RatingStars';

type Master = {
 id: string;
 displayName: string;
 title?: string;
 bio?: string;
 city?: string;
 services?: string[]; // если у тебя объекты услуг — можно заменить на массив объектов
 price?: number;
 currency?: string;
 photoURL?: string;
 photos?: string[];
 avgRating?: number;
 reviewsCount?: number;
};

type Review = {
 id: string;
 authorUid: string;
 authorName?: string;
 rating?: number;
 text: string;
 photos?: string[];
 createdAt?: Timestamp | { seconds: number };
};

export default function MasterProfilePage() {
 const params = useParams<{ id: string }>();
 const profileId = params?.id;

 const [master, setMaster] = useState<Master | null>(null);
 const [loading, setLoading] = useState(true);
 const [reviews, setReviews] = useState<Review[]>([]);

 // загрузка анкеты мастера
 useEffect(() => {
 if (!profileId) return;
 let alive = true;
 (async () => {
 const snap = await getDoc(doc(db, 'masters', profileId));
 if (!alive) return;
 if (snap.exists()) {
 setMaster({ id: snap.id, ...(snap.data() as any) });
 } else {
 setMaster(null);
 }
 setLoading(false);
 })();
 return () => {
 alive = false;
 };
 }, [profileId]);

 // подписка на отзывы
 useEffect(() => {
 if (!profileId) return;
 const q = query(
 collection(db, 'reviews'),
 where('profileId', '==', profileId),
 orderBy('createdAt', 'desc')
 );
 const unsub = onSnapshot(q, (snap) => {
 const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Review[];
 setReviews(rows);
 });
 return () => unsub();
 }, [profileId]);

 const mainPhoto = useMemo(() => {
 if (!master) return '';
 return master.photoURL || master.photos?.[0] || '';
 }, [master]);

 if (loading) return <div className="p-6">Loading…</div>;
 if (!master) {
 return (
 <div className="p-6">
 <h1 className="text-xl font-bold mb-2">Master not found</h1>
 <Link href="/masters" className="underline">← Back to list</Link>
 </div>
 );
 }

 return (
 <div className="max-w-6xl mx-auto p-6">
 <div className="grid lg:grid-cols-3 gap-6">
 {/* левая колонка: фото/галерея */}
 <div className="lg:col-span-1">
 {mainPhoto ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={mainPhoto} alt={master.displayName} className="w-full h-64 object-cover rounded-lg" />
 ) : (
 <div className="w-full h-64 rounded-lg bg-gray-100 grid place-items-center text-gray-400">
 No photo
 </div>
 )}

 {master.photos && master.photos.length > 1 && (
 <div className="mt-3 grid grid-cols-4 gap-2">
 {master.photos.slice(0, 8).map((p, i) => (
 // eslint-disable-next-line @next/next/no-img-element
 <img key={i} src={p} alt="" className="h-16 w-full object-cover rounded" />
 ))}
 </div>
 )}
 </div>

 {/* правая колонка: информация */}
 <div className="lg:col-span-2">
 <h1 className="text-2xl font-bold">{master.displayName || 'Master'}</h1>

 <div className="mt-1 flex items-center gap-3">
 <RatingStars value={master.avgRating || 0} count={master.reviewsCount || 0} />
 {typeof master.price === 'number' && (
 <span className="text-sm text-gray-600">from ${master.price} {master.currency || 'CAD'}</span>
 )}
 {master.city && <span className="text-sm text-gray-600">• {master.city}</span>}
 </div>

 {master.title && <div className="mt-2 text-gray-700">{master.title}</div>}
 {master.bio && (
 <p className="mt-3 whitespace-pre-line text-gray-800">
 {master.bio}
 </p>
 )}

 {master.services?.length ? (
 <div className="mt-4">
 <h2 className="font-semibold">Services</h2>
 <ul className="mt-1 list-disc list-inside text-gray-800">
 {master.services.map((s, i) => (
 <li key={i}>{s}</li>
 ))}
 </ul>
 </div>
 ) : null}

 {/* действия */}
 <div className="mt-6 flex gap-3">
 <Link
 href={`/book?profile=${master.id}`}
 className="px-4 py-2 border rounded bg-black text-white hover:opacity-90"
 >
 Book now
 </Link>
 <Link
 href={`/masters/${master.id}/review`}
 className="px-4 py-2 border rounded hover:bg-gray-50"
 >
 Write a review
 </Link>
 </div>
 </div>
 </div>

 {/* отзывы */}
 <section className="mt-10">
 <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>

 {reviews.length === 0 && (
 <p className="text-gray-500">No reviews yet. Be the first to write one.</p>
 )}

 <div className="space-y-4">
 {reviews.map((r) => {
 const created =
 (r.createdAt as any)?.seconds
 ? new Date((r.createdAt as any).seconds * 1000)
 : undefined;
 return (
 <div key={r.id} className="border rounded-md p-4">
 <div className="flex items-center justify-between">
 <div className="font-medium">{r.authorName || 'Client'}</div>
 {typeof r.rating === 'number' && (
 <RatingStars value={r.rating} count={0} />
 )}
 </div>
 <p className="mt-2 whitespace-pre-line">{r.text}</p>

 {r.photos?.length ? (
 <div className="mt-3 grid grid-cols-3 gap-2">
 {r.photos.map((p, i) => (
 // eslint-disable-next-line @next/next/no-img-element
 <img key={i} src={p} alt="" className="h-24 w-full object-cover rounded" />
 ))}
 </div>
 ) : null}

 {created && (
 <div className="mt-2 text-xs text-gray-500">
 {created.toLocaleDateString()}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </section>
 </div>
 );
}