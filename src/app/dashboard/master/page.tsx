'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // или '@/context/AuthProvider' — как у тебя
import { RequireRole } from '@/components/guards';

type Profile = {
 id: string;
 service?: string | null;
 city?: string | null;
 displayName?: string | null;
};

export default function MasterDashboardPage() {
 return (
 <RequireRole role="master">
 <Content />
 </RequireRole>
 );
}

function Content() {
 const { user } = useAuth();
 const [items, setItems] = useState<Profile[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!user) return;
 // все анкеты Мастера (коллекция 'profiles', где ownerId == uid)
 const q = query(
 collection(db, 'profiles'),
 where('ownerId', '==', user.uid),
 orderBy('createdAt', 'desc')
 );
 const unsub = onSnapshot(q, (snap) => {
 setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
 setLoading(false);
 });
 return () => unsub();
 }, [user]);

 return (
 <div className="p-6">
 <div className="flex items-center justify-between mb-4">
 <h1 className="text-xl font-bold">My profiles</h1>
 <Link href="/dashboard/master/profile/new" className="underline">
 + Add profile
 </Link>
 </div>

 {loading && <div>Loading…</div>}

 {!loading && items.length === 0 && (
 <div className="text-gray-600">
 Пока нет анкет. Нажми <Link href="/dashboard/master/profile/new" className="underline">+ Add profile</Link> чтобы создать первую.
 </div>
 )}

 <div className="grid gap-3">
 {items.map(p => (
 <div key={p.id} className="border rounded p-3 flex items-baseline justify-between">
 <div>
 <div className="font-medium">{p.displayName || 'Unnamed master'}</div>
 <div className="text-sm text-gray-600">
 {p.service || '— service —'} {p.city ? `· ${p.city}` : ''}
 </div>
 </div>
 <div className="flex gap-3 text-sm">
 <Link href={`/masters/${p.id}`} className="underline">View</Link>
 <Link href={`/profile/${p.id}/edit`} className="underline">Edit</Link>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}