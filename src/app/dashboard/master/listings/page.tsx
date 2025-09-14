"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useAuth } from "@/contexts/AuthContext";

type PhotoRef = { url: string; path: string };
type Listing = {
 id: string;
 ownerUid: string;
 title: string;
 service: string;
 city: string;
 languages: string[];
 priceFrom: number;
 photos?: PhotoRef[];
 createdAt?: any;
};

export default function ListingsIndexPage() {
 const { user } = useAuth();
 const [items, setItems] = useState<Listing[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!user) { setItems([]); setLoading(false); return; }
 if (!db) { setLoading(false); return; }
 const col = collection(db, "listings");
 // Requires composite index (ownerUid ASC, createdAt DESC)
 const q = query(col, where("ownerUid", "==", user.uid), orderBy("createdAt", "desc"));
 const unsub = onSnapshot(q, (snap) => {
 setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
 setLoading(false);
 }, () => setLoading(false));
 return () => unsub();
 }, [user]);

 return (
 <div className="mx-auto max-w-5xl px-4 py-8">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold">My listings</h1>
 <Link
 href="/dashboard/master/listings/new"
 className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
 >
 + Add listing
 </Link>
 </div>

 {loading ? (
 <p className="mt-6 text-sm text-gray-500">Loading…</p>
 ) : items.length === 0 ? (
 <p className="mt-6 text-sm text-gray-600">No listings yet. Click "Add listing".</p>
 ) : (
 <ul className="mt-6 divide-y rounded-md border">
 {items.map((l) => (
 <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2">
 <div>
 <div className="font-medium">{l.title || "(untitled)"}</div>
 <div className="text-xs text-gray-500">
 {l.service || "-"} • {l.city || "-"} • from ${Number(l.priceFrom ?? 0)}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Link
 href={`/dashboard/master/listings/${l.id}`}
 className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
 >
 View
 </Link>
 <Link
 href={`/dashboard/master/listings/edit/${l.id}`}
 className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
 >
 Edit
 </Link>
 <Link
 href={`/dashboard/master/listings/delete/${l.id}`}
 className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
 >
 Delete
 </Link>
 </div>
 </li>
 ))}
 </ul>
 )}
 </div>
 );
}