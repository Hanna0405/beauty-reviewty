"use client";

import { useEffect, useState } from "react";
import { safeGetCollection } from "@/lib/firestore/publicFetch";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import Image from 'next/image';
import SocialBar from '@/components/SocialBar';

type MasterCard = { id: string; name: string; cityId?: string; avatar?: string; rating?: number; };
type Service = { id: string; title: string; };
type City = { id: string; title: string; };

export default function HomePage() {
  const { loading: authLoading } = useAuth();
  const [masters, setMasters] = useState<MasterCard[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load ONLY public collections. DO NOT read /users here.
    async function load() {
      setLoading(true);
      const [m, s, c] = await Promise.all([
        safeGetCollection<MasterCard>("masters", (col) => col /* you can append orderBy('rating','desc'), limit(8) */),
        safeGetCollection<Service>("services"),
        safeGetCollection<City>("cities"),
      ]);
      setMasters(m); setServices(s); setCities(c);
      setLoading(false);
    }
    load();
  }, []);

  // Header should already handle 3 states; this component no longer depends on auth

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
<p className="text-3xl font-bold text-pink-600">{masters.length}</p>
<p className="text-gray-600">Masters</p>
</div>
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">{masters.filter(m => (m.rating ?? 0) >= 4).length}</p>
<p className="text-gray-600">4+ stars</p>
</div>
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">{services.length}</p>
<p className="text-gray-600">Services</p>
</div>
<div className="bg-white shadow-sm border rounded-lg p-6">
<p className="text-3xl font-bold text-pink-600">{cities.length}</p>
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
 ) : masters.length === 0 ? (
 <div className="section p-6 text-gray-500">No masters yet.</div>
 ) : (
 <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
 {masters.slice(0, 6).map(m => <MasterCard key={m.id} m={m} />)}
 </div>
 )}

 {/* Соц-иконки */}
 <SocialBar />
 </section>
 </main>
 );
}

/* ===== Вспомогательные компоненты ===== */

function MasterCard({ m }: { m: MasterCard }) {
 const [imageError, setImageError] = useState(false);
 
 const photo = imageError ? '/placeholder.jpg' : 
   m.avatar || '/placeholder.jpg';

 const rating = typeof m.rating === 'number' ? m.rating : undefined;

 const handleImageError = () => {
   setImageError(true);
 };

 return (
 <div className="section overflow-hidden">
 <div className="relative h-44 w-full">
 <Image
 src={photo}
 alt={m.name ?? 'Master'}
 fill
 className="object-cover"
 sizes="(max-width:768px) 100vw, 33vw"
 onError={handleImageError}
 />
 </div>

 <div className="p-4">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="font-medium">{m.name || 'Master'}</h3>
 {m.cityId && <p className="text-sm text-gray-500">{m.cityId}</p>}
 </div>
 </div>

 <div className="mt-2">
 {typeof rating === 'number' ? (
 <Stars rating={rating} reviews={0} />
 ) : (
 <span className="text-gray-400">No rating</span>
 )}
 </div>

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
