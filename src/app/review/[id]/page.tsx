'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { requireDb } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { uploadFilesAndGetURLs } from '@/lib/services/storage';

export default function ReviewPage() {
 // id — это id анкеты мастера (profile/master)
 const params = useParams<{ id: string }>();
 const id = params?.id;
 const router = useRouter();
 const { user, loading } = useAuth();

 const [masterName, setMasterName] = useState<string>('');
 const [rating, setRating] = useState<number | ''>('');
 const [text, setText] = useState('');
 const [files, setFiles] = useState<File[]>([]);
 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState<string | null>(null);

 // безопасные значения из user (TS-friendly)
 const uid = user?.uid ?? null;
 const authorName = user?.displayName || user?.email || 'Client';

 // подгружаем имя мастера для заголовка (замени 'masters' на 'profiles', если у тебя так)
 useEffect(() => {
 if (!id) return;
 (async () => {
 const db = requireDb();
 const snap = await getDoc(doc(db, 'masters', id));
 if (snap.exists()) setMasterName((snap.data() as any).displayName || 'Master');
 })();
 }, [id]);

 const canSubmit = useMemo(() => !!text.trim() && !busy, [text, busy]);

 if (loading) return <div className="p-6">Loading…</div>;
 if (!user) return <div className="p-6">Please log in to write a review.</div>;
 if (user?.role !== 'client') return <div className="p-6">Only clients can write reviews.</div>;

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!uid) return; // дополнительная страховка для TS
 setBusy(true);
 setErr(null);
 try {
 let photoURLs: string[] = [];
 if (files.length) {
 const result = await uploadFilesAndGetURLs(`reviews/${uid}`, files);
 photoURLs = result.urls;
 }

 const db = requireDb();
 await addDoc(collection(db, 'reviews'), {
 profileId: id, // к какой анкете относится
 authorUid: uid, // безопасно: строка
 authorName,
 rating: rating === '' ? null : Number(rating),
 text: text.trim(),
 photos: photoURLs,
 visible: true,
 createdAt: serverTimestamp(),
 });

 router.push(`/masters/${id}`); // назад на анкету
 } catch (e: any) {
 setErr(e.message ?? 'Failed to submit review');
 } finally {
 setBusy(false);
 }
 }

 return (
 <div className="max-w-2xl mx-auto p-6">
 <h1 className="text-xl font-bold mb-4">Write a review for “{masterName || '…'}”</h1>

 <form onSubmit={onSubmit} className="grid gap-4">
 <div>
 <div className="text-sm text-gray-600 mb-1">Rate your experience (optional): 1 = bad, 5 = great</div>
 <select
 className="w-full border rounded px-3 py-2"
 value={rating}
 onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
 >
 <option value="">— no stars —</option>
 {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium">Your comment (required)</label>
 <textarea
 className="mt-1 w-full border rounded px-3 py-2 min-h-[120px]"
 value={text}
 onChange={(e) => setText(e.target.value)}
 placeholder="Share your experience…"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium">Photos (optional)</label>
 <input
 type="file"
 multiple
 accept="image/*"
 onChange={(e) => setFiles(Array.from(e.target.files || []))}
 />
 </div>

 {err && <p className="text-red-600 text-sm">{err}</p>}

 <div className="flex gap-3">
 <button
 type="submit"
 disabled={!canSubmit}
 className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60"
 >
 {busy ? 'Submitting…' : 'Submit review'}
 </button>
 <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded">
 Cancel
 </button>
 </div>
 </form>
 </div>
 );
}