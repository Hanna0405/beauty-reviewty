'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import type { Master } from '@/types';
import SocialBar from '@/components/SocialBar';

export default function HomePage() {
 const [masters, setMasters] = useState<Master[]>([]);
 const [loading, setLoading] = useState(true);

 // Загружаем немного анкет для главной
 useEffect(() => {
 let alive = true;
 (async () => {
 try {
 const snap = await getDocs(query(collection(db, 'profiles'), limit(50)));
 if (!alive) return;
 const list: Master[] = snap.docs.map(d => {
 const x = d.data() as any;
 return {
 id: d.id,
 name: x.name ?? x.displayName ?? '',
 displayName: x.displayName ?? x.name ?? '',
 city: x.city ?? '',
 bio: x.bio ?? '',
 services: Array.isArray(x.services) ? x.services : [],
 ratingAvg: typeof x.ratingAvg === 'number' ? x.ratingAvg : undefined,
 reviewsCount: typeof x.reviewsCount === 'number' ? x.reviewsCount : undefined,
 photoUrls: Array.isArray(x.photoUrls) ? x.photoUrls : (x.photoUrl ? [x.photoUrl] : []),
 };
 });
 setMasters(list);
 } finally {
 setLoading(false);
 }
 })();
 return () => { alive = false; };
 }, []);

 // Статистика
 const stats = useMemo(() => {
 const total = masters.length;
 const fivePlus = masters.filter(m => (m.reviewsCount ?? 0) >= 5).length;
 const services = new Set(masters.flatMap(m => m.services ?? []));
 const cities = new Set(masters.map(m => m.city).filter(Boolean));
 return { total, fivePlus, services: services.size, cities: cities.size };
 }, [masters]);

 // Популярные
 const popular = useMemo(() => {
 const withRank = [...masters].sort((a, b) => {
 const ra = a.ratingAvg ?? 0, rb = b.ratingAvg ?? 0;
 if (rb !== ra) return rb - ra;
 const ca = a.reviewsCount ?? 0, cb = b.reviewsCount ?? 0;
 return cb - ca;
 });
 return withRank.slice(0, 6);
 }, [masters]);

 return (
 <main>
 {/* HERO / Баннер */}
 <section className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white py-20">
<div className="max-w-5xl mx-auto text-center px-4">
<h1 className="text-4xl md:text-5xl font-bold mb-4">
Find Your Perfect Beauty Master
</h1>
<p className="text-lg md:text-xl mb-8 opacity-90">
Discover talented beauty professionals near you. Compare by location, reviews, and price — book with confidence.
</p>
<div className="flex justify-center gap-4">
<a
href="/masters"
className="bg-white text-pink-600 font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-100 transition"
>
Find your master
</a>
<a
href="/auth/login"
className="bg-pink-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-pink-800 transition"
>
Log in
</a>
</div>
</div>
</section>

 {/* Statistics */}
<section className="py-10">
<div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">2</p>
<p className="text-gray-600">Masters</p>
</div>
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">0</p>
<p className="text-gray-600">5+ reviews</p>
</div>
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">2</p>
<p className="text-gray-600">Services</p>
</div>
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">2</p>
<p className="text-gray-600">Cities</p>
</div>
</div>
</section>


 {/* Popular masters */}
 <section className="container-page mt-10">
 <div className="mb-4 flex items-center justify-between">
 <h2 className="font-medium">Popular masters</h2>
 <Link
 href="/masters"
 className="inline-flex items-center rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 shadow-sm"
 >
 View all
 </Link>
 </div>

 {loading ? (
 <div className="section p-6 text-gray-500">Loading…</div>
 ) : popular.length === 0 ? (
 <div className="section p-6 text-gray-500">No masters yet.</div>
 ) : (
 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
 {popular.map(m => <MasterCard key={m.id} m={m} />)}
 </div>
 )}

 {/* Соц-иконки */}
 <SocialBar />
 </section>
 </main>
 );
}

/* ===== Вспомогательные компоненты ===== */

function StatCard({
 label,
 value,
 rightLink,
}: {
 label: string;
 value: number | string;
 rightLink?: { href: string; text: string };
}) {
 return (
 <div className="section flex items-center justify-between p-4">
 <div>
 <div className="text-2xl font-semibold">{value}</div>
 <div className="text-sm text-gray-500">{label}</div>
 </div>
 {rightLink && (
 <Link href={rightLink.href} className="text-sm text-pink-600 hover:underline">
 {rightLink.text}
 </Link>
 )}
 </div>
 );
}

function MasterCard({ m }: { m: Master }) {
 const photo =
 (m.photoUrls && m.photoUrls[0]) ? m.photoUrls[0] : '/placeholder.jpg';

 const rating = typeof m.ratingAvg === 'number' ? m.ratingAvg : undefined;
 const reviews = typeof m.reviewsCount === 'number' ? m.reviewsCount : 0;
 const services = (m.services ?? []).slice(0, 2);

 return (
 <div className="section overflow-hidden">
 <div className="relative h-44 w-full">
 <Image
 src={photo}
 alt={m.displayName ?? m.name ?? 'Master'}
 fill
 className="object-cover"
 sizes="(max-width:768px) 100vw, 33vw"
 />
 </div>

 <div className="p-4">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="font-medium">{m.displayName || m.name || 'Master'}</h3>
 {m.city && <p className="text-sm text-gray-500">{m.city}</p>}
 </div>
 </div>

 <div className="mt-2">
 {typeof rating === 'number' ? (
 <Stars rating={rating} reviews={reviews} />
 ) : (
 <span className="text-gray-400">No rating</span>
 )}
 </div>

 {services.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-2">
 {services.map(s => (
 <span key={s} className="chip">{s}</span>
 ))}
 </div>
 )}

 <Link href={`/masters/${m.id}`} className="btn-pink mt-4 w-full text-center">
 View profile
 </Link>
 </div>
 </div>
 );
}

function Stars({ rating, reviews }: { rating: number; reviews: number }) {
 const full = Math.round(rating);
 return (
 <div className="inline-flex items-center gap-2">
 <span className="leading-none text-amber-500">{'★'.repeat(full)}</span>
 <span className="leading-none text-gray-300">{'★'.repeat(5 - full)}</span>
 <span className="text-sm text-gray-600">{rating.toFixed(1)} · {reviews}</span>
 </div>
 );
}
