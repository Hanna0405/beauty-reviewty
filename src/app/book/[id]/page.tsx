'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { requireAuth, requireDb } from '@/lib/firebase';

export default function BookPage() {
const params = useParams<{ id: string }>(); // profileId
const id = params?.id;
const router = useRouter();
const [date, setDate] = useState('');
const [loading, setLoading] = useState(false);

async function handleBook() {
const auth = requireAuth();
const db = requireDb();
if (!auth.currentUser) { alert('Please login first'); return; }
if (!date) { alert('Select date'); return; }

setLoading(true);
try {
await addDoc(collection(db, 'bookings'), {
profileId: String(id),
clientId: auth.currentUser.uid,
date,
status: 'pending',
createdAt: serverTimestamp(),
});
alert('Booking sent! Wait for confirmation.');
router.push('/dashboard');
} catch (e) {
console.error(e);
alert('Booking failed');
} finally {
setLoading(false);
}
}

return (
<div className="mx-auto max-w-md p-6">
<h1 className="mb-4 text-xl font-bold">Book this Master</h1>
<label className="block">
<span className="mb-1 block text-sm">Choose date</span>
<input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded border px-3 py-2" />
</label>
<button
onClick={handleBook}
disabled={loading}
className="mt-4 rounded bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
>
{loading ? 'Booking…' : 'Confirm Booking'}
</button>
</div>
);
}
