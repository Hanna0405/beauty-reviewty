'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useAuthUser } from '@/lib/useAuthUser';
import { SafeText } from '@/lib/safeText';

type Listing = {
 id: string;
 title: string;
 city?: string;
 cityName?: string;
 services?: string[];
 serviceNames?: string[];
 languages?: string[];
 languageNames?: string[];
 priceFrom?: number | null;
 priceMin?: number | null;
 priceMax?: number | null;
 status?: 'active' | 'draft';
 photos?: { url: string; path: string }[];
};

export default function MyListingsPage() {
 const { user } = useAuthUser();
 const [items, setItems] = useState<Listing[]>([]);

 useEffect(() => {
 if (!user) return;
 const q = query(
 collection(db, 'listings'),
 where('ownerId', '==', user.uid),
 orderBy('updatedAt', 'desc')
 );
 return onSnapshot(q, (snap) => {
 setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
 });
 }, [user]);

 return (
 <div className="max-w-5xl mx-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-semibold">My listings</h1>
 <Link href="/dashboard/master/listings/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition">
 + Add listing
 </Link>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {items.map((it) => (
 <div key={it.id} className="rounded-xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
 <div className="aspect-[4/3] bg-gray-100">
 {it.photos?.[0]?.url ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={it.photos[0].url} alt={it.title} className="h-full w-full object-cover" />
 ) : (
 <div className="h-full w-full flex items-center justify-center text-gray-400">No photo</div>
 )}
 </div>
 <div className="p-4 space-y-2">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold truncate">{it.title || 'Untitled'}</h2>
 <span className={`text-xs px-2 py-1 rounded-full ${it.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
 {it.status ?? 'draft'}
 </span>
 </div>
 <div className="text-sm text-gray-600 truncate">
   — <SafeText value={it.cityName ?? it.city} /> • from {it.priceFrom ?? it.priceMin ?? '—'}
 </div>
 <div className="flex gap-2 pt-2">
        <Link href={`/masters/${String(it.id)}`} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">View</Link>
 <Link href={`/dashboard/master/listings/${it.id}/edit`} className="px-3 py-1.5 rounded-lg bg-pink-600 text-white hover:bg-pink-700">Edit</Link>
 <Link href={`/api/listings/${it.id}/delete`} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Delete</Link>
 </div>
 </div>
 </div>
 ))}
 </div>

 {items.length === 0 && (
 <div className="mt-16 text-center text-gray-500">No listings yet — create your first one!</div>
 )}
 </div>
 );
}