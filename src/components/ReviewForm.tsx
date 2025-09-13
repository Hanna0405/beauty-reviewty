'use client';
import { useEffect, useState } from 'react';
import { requireDb } from '@/lib/firebase';
import {
 addDoc, collection, serverTimestamp,
 getDocs, query, where
} from 'firebase/firestore';
import { uploadImage } from '@/lib/upload-image';
import Image from 'next/image';

type Props = {
 profileId: string; // profiles/{pid}
 clientId: string; // currentUser.uid
 clientName?: string | null;
};

export default function ReviewForm({ profileId, clientId, clientName }: Props) {

 const [rating, setRating] = useState<number>(5);
 const [text, setText] = useState('');
 const [file, setFile] = useState<File | null>(null);
 const [preview, setPreview] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [msg, setMsg] = useState<string | null>(null);
 const [eligible, setEligible] = useState<{ ok: boolean; bookingId?: string }>({ ok: false });

 // проверяем: есть ли у клиента завершённая бронь ('done') по этой анкете
 useEffect(() => {
 (async () => {
 const db = requireDb();
 const q1 = query(
 collection(db, 'bookings'),
 where('clientId', '==', clientId),
 where('profileId', '==', profileId),
 where('status', '==', 'done')
 );
 const snap = await getDocs(q1);
 if (!snap.empty) {
 setEligible({ ok: true, bookingId: snap.docs[0].id });
 } else {
 setEligible({ ok: false });
 }
 })();
 }, [clientId, profileId]);

 const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
 const f = e.target.files?.[0] || null;
 setFile(f || null);
 setPreview(f ? URL.createObjectURL(f) : null);
 };

 const uploadReviewImage = async (file: File) => {
 const id = crypto.randomUUID();
 const path = `reviews/${id}/${file.name}`;
 const { url } = await uploadImage(file, path);
 return url;
 };

 const submit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!eligible.ok || !eligible.bookingId) {
 setMsg('You can leave a review after your booking is completed.');
 return;
 }
 
 try {
   const db = requireDb();
 } catch (error) {
   setMsg('Database is not available. Please check your configuration.');
   return;
 }
 
 setLoading(true);
 setMsg(null);
 try {
 let photoUrl: string | null = null;
 if (file) photoUrl = await uploadReviewImage(file);

 const db = requireDb();
 await addDoc(collection(db, 'reviews'), {
 profileId,
 bookingId: eligible.bookingId,
 clientId,
 clientName: clientName || null,
 rating,
 text,
 photoUrl,
 createdAt: serverTimestamp(),
 });

 setText('');
 setFile(null);
 setPreview(null);
 setMsg('Thank you! Your review was submitted.');
 } catch (err: any) {
 setMsg(err?.message || 'Failed to submit review. Make sure your booking is completed.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <form onSubmit={submit} className="rounded-xl border p-4 bg-white/70">
 <h3 className="text-lg font-semibold mb-2">Leave a review</h3>

 <label className="block text-sm mb-1">Rating</label>
 <select
 value={rating}
 onChange={(e) => setRating(parseInt(e.target.value))}
 className="mb-3 rounded border px-3 py-2"
 >
 {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
 </select>

 <label className="block text-sm mb-1">Your feedback</label>
 <textarea
 value={text}
 onChange={(e) => setText(e.target.value)}
 placeholder="How was the service?"
 className="w-full rounded border px-3 py-2 mb-3"
 rows={4}
 />

 <label className="block text-sm mb-1">Photo (optional)</label>
 <input type="file" accept="image/*" onChange={handleFile} className="mb-3" />
 {preview && (
 <div className="mb-3">
 <Image src={preview} alt="preview" width={240} height={240} className="rounded-lg"/>
 </div>
 )}

 <button
 disabled={loading || !eligible.ok}
 className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-60"
 title={!eligible.ok ? 'Available after a completed booking' : ''}
 >
 {loading ? 'Saving…' : 'Submit review'}
 </button>

 {msg && <div className="mt-3 text-sm">{msg}</div>}
 </form>
 );
}