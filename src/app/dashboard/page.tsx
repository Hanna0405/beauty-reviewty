'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { requireAuth, requireDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
collection,
query,
where,
onSnapshot,
deleteDoc,
doc,
type DocumentData,
type QueryDocumentSnapshot,
type QuerySnapshot,
} from 'firebase/firestore';

type ProfileRow = {
id: string;
displayName: string;
city?: string;
service?: string;
price?: number;
thumb?: string;
};

export default function DashboardPage() {
const [uid, setUid] = useState<string | null>(null);
const [rows, setRows] = useState<ProfileRow[]>([]);
const [loading, setLoading] = useState(true);

// следим за авторизацией
useEffect(() => {
try {
  const auth = requireAuth();
  const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  return () => unsub();
} catch (error) {
  setUid(null);
  return;
}
}, []);

// live-подписка на профили текущего пользователя
useEffect(() => {
if (!uid) {
setRows([]);
setLoading(false);
return;
}
setLoading(true);

const db = requireDb();
const q = query(collection(db, 'profiles'), where('uid', '==', uid));
const unsub = onSnapshot(
q,
(snap: QuerySnapshot<DocumentData>) => {
const list: ProfileRow[] = snap.docs.map(
(d: QueryDocumentSnapshot<DocumentData>) => {
const data = d.data();
return {
id: d.id,
displayName:
(data.displayName as string) ||
(data.name as string) ||
'Master',
city: (data.city as string) || '',
service:
(data.service as string) ||
(Array.isArray(data.services) ? data.services[0] : ''),
price: (data.price as number) ?? undefined,
thumb:
(data.photoUrl as string) ||
((data.photos?.[0] as string) ?? '/placeholder.png'),
};
}
);
setRows(list);
setLoading(false);
},
() => setLoading(false)
);

return () => unsub();
}, [uid]);

async function removeProfile(id: string) {
if (!confirm('Delete this profile?')) return;
try {
const db = requireDb();
await deleteDoc(doc(db, 'profiles', id));
} catch (e) {
console.error(e);
alert('Failed to delete profile');
}
}

if (!uid) {
return (
<div className="mx-auto max-w-5xl p-6">
<div className="mb-6 flex items-center justify-between gap-3">
<h1 className="text-2xl font-semibold shrink-0">My profile</h1>
<div className="min-w-0 flex-1" />
<Link
href="/login"
className="shrink-0 rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
>
Log in
</Link>
</div>
<p className="text-gray-600">
Please log in to create and manage your profile.
</p>
</div>
);
}

return (
<div className="mx-auto max-w-5xl p-6">
{/* Header */}
<div className="mb-6 flex items-center justify-between gap-3">
<h1 className="text-2xl font-semibold shrink-0">My profile</h1>
<div className="min-w-0 flex-1" />
 <Link
 href="/dashboard/master/profile"
 className="shrink-0 rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
 >
 + Add profile
 </Link>
</div>

{/* List */}
{loading ? (
<div className="space-y-3">
{[...Array(2)].map((_, i) => (
<div key={i} className="flex items-center gap-4 rounded-lg border p-3">
<div className="h-16 w-16 rounded-md bg-gray-200" />
<div className="h-4 w-40 rounded bg-gray-200" />
</div>
))}
</div>
) : rows.length === 0 ? (
<div className="rounded-lg border p-6 text-gray-600">
You have no profiles yet.
 <Link href="/dashboard/master/profile" className="ml-2 text-pink-600 underline">
 Create one
 </Link>
.
</div>
) : (
<div className="space-y-3">
{rows.map((p) => (
<div key={p.id} className="flex items-center gap-4 rounded-lg border p-3">
{/* квадратное превью */}
<div className="relative aspect-square w-16 overflow-hidden rounded-md">
<Image
src={p.thumb || '/placeholder.png'}
alt=""
fill
className="object-cover"
sizes="64px"
/>
</div>

{/* инфо */}
<div className="min-w-0 flex-1">
<div className="truncate font-medium">{p.displayName}</div>
<div className="truncate text-sm text-gray-600">
{p.city}
{p.service ? ` • ${p.service}` : ''}
{typeof p.price === 'number' ? ` • $${p.price} CAD` : ''}
</div>
</div>

{/* действия */}
<div className="flex gap-2">
 <Link
 href="/dashboard/master/profile"
 className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
 >
 Edit
 </Link>

{/* ←← ВОТ ТА ССЫЛКА VIEW */}
<Link
href={`/masters/${String(p.id)}`}
className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
>
View
</Link>

<button
onClick={() => removeProfile(p.id)}
className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
title="Delete profile"
>
Delete
</button>
</div>
</div>
))}
</div>
)}
</div>
);
}