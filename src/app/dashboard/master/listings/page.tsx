'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthReady } from '@/lib/hooks/useAuthReady';
import { SafeText } from '@/lib/safeText';
import DeleteButton from '@/components/listings/DeleteButton';

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
 const { user } = useAuth();
 const { initialized, uid } = useAuthReady();
 const [items, setItems] = useState<Listing[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let cancelled = false;

 async function loadListings() {
 if (!uid) return;
 setLoading(true);
 try {
 const q = query(
 collection(db, 'listings'),
 where('ownerId', '==', uid),
 orderBy('updatedAt', 'desc')
 );
 const unsubscribe = onSnapshot(q, (snap) => {
 if (cancelled) return;
 setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
 setLoading(false);
 });
 return () => unsubscribe();
 } catch (err: any) {
 if (!cancelled) {
 console.error('Failed to load listings:', err);
 setLoading(false);
 }
 }
 }

 if (initialized && uid) {
 const unsubscribe = loadListings();
 return () => {
 cancelled = true;
 unsubscribe?.then(unsub => unsub?.());
 };
 } else if (initialized && !uid) {
 setItems([]);
 setLoading(false);
 }

 return () => {
 cancelled = true;
 };
 }, [initialized, uid]);

 if (!initialized) {
 return (
 <div className="max-w-5xl mx-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-semibold">My listings</h1>
 </div>
 <p className="mt-2 text-sm opacity-80">Loading your account…</p>
 </div>
 );
 }

 if (!uid) {
 return (
 <div className="max-w-5xl mx-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-semibold">My listings</h1>
 </div>
 <p className="mt-2 text-sm opacity-80">Please sign in to view your listings.</p>
 </div>
 );
 }

 return (
 <div className="max-w-5xl mx-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-semibold">My listings</h1>
 <Link href="/dashboard/master/listings/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition">
 + Add listing
 </Link>
 </div>

 {loading && (
 <p className="mt-2 text-sm opacity-80">Loading your listings…</p>
 )}

 {!loading && items.length === 0 && (
 <p className="mt-2 text-sm opacity-80">You don't have any listings yet.</p>
 )}

 {!loading && items.length > 0 && (
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
 <DeleteButton id={it.id} />
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 </div>
 );
}