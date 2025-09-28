'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase.client';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import RatingStars from './RatingStars';

type Master = {
 id: string;
 name?: string;
 city?: string;
 services?: string[];
 photoUrls?: string[];
 ratingAvg?: number;
 reviewsCount?: number;
};

export default function PopularMasters() {
 const [items, setItems] = useState<Master[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function load() {
 if (!db) {
 if (process.env.NODE_ENV !== "production") {
 console.warn("Firestore is not initialized. Returning empty masters list.");
 }
 setItems([]);
 setLoading(false);
 return;
 }
 
 try {
 // сортируем по числу отзывов (проще, не требует композитного индекса)
 const q = query(collection(db, 'masters'), orderBy('reviewsCount', 'desc'), limit(8));
 const snap = await getDocs(q);
 const list: Master[] = snap.docs.map(d => {
 const x = d.data() as any;
 return {
 id: d.id,
 name: x.name ?? 'Master',
 city: x.city ?? '',
 services: Array.isArray(x.services) ? x.services : [],
 photoUrls: Array.isArray(x.photoUrls) ? x.photoUrls : [],
 ratingAvg: typeof x.ratingAvg === 'number' ? x.ratingAvg : 0,
 reviewsCount: typeof x.reviewsCount === 'number' ? x.reviewsCount : 0,
 };
 });
 setItems(list);
 } catch (e) {
 console.warn('Popular masters load failed:', e);
 setItems([]);
 } finally {
 setLoading(false);
 }
 }
 load();
 }, []);

 if (loading) {
 return (
 <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
 {Array.from({ length: 8 }).map((_, i) => (
 <div key={i} className="animate-pulse rounded-lg border p-3">
 <div className="h-28 w-full rounded bg-gray-200" />
 <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
 <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
 </div>
 ))}
 </div>
 );
 }

 if (!items.length) return <p className="text-gray-500">No masters yet.</p>;

 return (
 <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
 {items.map(m => {
 const img = m.photoUrls?.[0] || '/placeholder.png'; // добавь файл в /public
 const services = (m.services ?? []).slice(0, 2).join(', ');
 return (
 <Link
 key={m.id}
  href={`/masters/${String(m.id)}`}
 className="group rounded-lg border p-3 transition hover:shadow-md"
 >
 <div className="aspect-[4/3] w-full overflow-hidden rounded bg-gray-100">
 {/* обычный <img>, чтобы не трогать next/image конфиг */}
 <img src={img} alt={m.name ?? 'Master'} className="h-full w-full object-cover" />
 </div>
 <div className="mt-3">
 <div className="flex items-start justify-between gap-2">
 <h3 className="line-clamp-1 font-medium">{m.name}</h3>
 <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
 {m.reviewsCount ?? 0}★
 </span>
 </div>
 <p className="mt-1 line-clamp-1 text-sm text-gray-500">
 {m.city || '—'}{services ? ` • ${services}` : ''}
 </p>
 <RatingStars value={m.ratingAvg ?? 0} className="mt-2" />
 </div>
 </Link>
 );
 })}
 </div>
 );
}
