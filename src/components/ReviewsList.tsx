'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
 collection, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import Image from 'next/image';

type Review = {
 id: string;
 uid: string;
 userName: string;
 rating: number;
 text: string | null;
 photoUrl?: string | null; // ← добавили фото
 createdAt?: any; // Firestore Timestamp
 masterId?: string; // если хранишь masterId
 profileId?: string; // если хранишь profileId
};

export default function ReviewsList({ masterId }: { masterId: string }) {
 const [items, setItems] = useState<Review[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!db) {
 if (process.env.NODE_ENV !== "production") {
 console.warn("Firestore is not initialized. Returning empty reviews list.");
 }
 setItems([]);
 setLoading(false);
 return;
 }
 
 // Если в БД поле называется profileId — замени masterId → profileId в where ниже.
 const q = query(
 collection(db, 'reviews'),
 where('masterId', '==', masterId), // ← или where('profileId','==', masterId)
 orderBy('createdAt', 'desc')
 );

 const unsub = onSnapshot(q, (snap) => {
 const rows: Review[] = [];
 snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
 setItems(rows);
 setLoading(false);
 }, () => setLoading(false));

 return () => unsub();
 }, [db, masterId]);

 if (loading) return <p className="text-sm text-gray-500">Loading reviews…</p>;
 if (!items.length) return <p className="text-sm text-gray-500">No reviews yet.</p>;

 return (
 <div className="space-y-4">
 {items.map((r) => (
 <div key={r.id} className="rounded-xl border p-4 bg-white/70">
 <div className="flex items-center justify-between mb-2">
 <div className="font-medium">{r.userName || 'Client'}</div>

 {/* Звёзды как у тебя */}
 <div className="flex items-center gap-1">
 <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
 <span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
 </div>
 </div>

 {r.text && <div className="text-gray-800">{r.text}</div>}

 {/* Фото из отзыва */}
 {r.photoUrl && (
 <div className="mt-3">
 <Image
 src={r.photoUrl}
 alt="review photo"
 width={560}
 height={560}
 className="rounded-lg"
 />
 </div>
 )}

 {r.createdAt?.toDate && (
 <div className="mt-1 text-xs text-gray-400">
 {r.createdAt.toDate().toLocaleDateString()}
 </div>
 )}
 </div>
 ))}
 </div>
 );
}