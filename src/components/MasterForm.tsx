'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import CityAutocomplete from '@/components/CityAutocomplete';
import LanguagesField from '@/components/LanguagesField';
import { uploadFilesAndGetURLs } from '@/lib/services/storage';

const SERVICE_OPTIONS = [
 'Piercing',
 'Tattoo',
 'Permanent makeup',
 'Brows & Lashes',
 'Nails',
 'Hair',
 'Cosmetology',
 'Massage',
];

export default function MasterForm() {
 const router = useRouter();
 const { user } = useAuth();
 const uid = user?.uid ?? null; // <-- берём uid отдельно

 const [displayName, setDisplayName] = useState<string>(user?.displayName || '');
 const [service, setService] = useState<string>(''); // одна услуга (обязательно)
 const [city, setCity] = useState<string>(''); // CityAutocomplete -> string
 const [languages, setLanguages] = useState<string[]>([]);
 const [price, setPrice] = useState<string>(''); // опционально
 const [bio, setBio] = useState<string>('');
 const [files, setFiles] = useState<File[]>([]); // опционально

 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState<string | null>(null);

 // Дополнительная защита
 if (!user || user.role !== 'master') {
 return <div className="p-4">Only <b>master</b> can create a profile.</div>;
 }

 const canSubmit =
 !busy &&
 !!uid && // обязателен uid
 displayName.trim().length >= 2 &&
 !!service &&
 city.trim().length > 0;

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!canSubmit || !uid) return; // <-- страховка для TS

 if (!db) {
 setErr('Database is not available. Please check your configuration.');
 return;
 }

 setBusy(true);
 setErr(null);

 try {
 // загрузка фото (если выбраны)
 let photoUrls: string[] = [];
 if (files.length) {
 const result = await uploadFilesAndGetURLs(`profiles/${uid}`, files);
 photoUrls = result.urls;
 }

 const priceNum = price.trim() === '' ? null : Number(price.trim());

 // создаём анкету (источник правды — profiles)
 const docRef = await addDoc(collection(db, 'profiles'), {
 ownerId: uid,
 displayName: displayName.trim(),
 service, // одна услуга
 city: city.trim(),
 languages,
 price: Number.isFinite(priceNum as number) ? priceNum : null,
 currency: 'CAD',
 bio: bio.trim() || null,

 photoURL: photoUrls[0] || null,
 photos: photoUrls,

 avgRating: 0,
 reviewsCount: 0,

 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 });

 router.replace(`/masters/${docRef.id}`);
 } catch (e: any) {
 setErr(e.message ?? 'Failed to create profile');
 } finally {
 setBusy(false);
 }
 }

 return (
 <form onSubmit={onSubmit} className="grid gap-5 max-w-2xl">
 {/* Имя мастера */}
 <div>
 <label className="block text-sm font-medium">Display name *</label>
 <input
 className="mt-1 w-full border rounded px-3 py-2"
 value={displayName}
 onChange={(e) => setDisplayName(e.target.value)}
 placeholder="Two Jewelry"
 required
 />
 </div>

 {/* Услуга (обязательно) */}
 <div>
 <div className="flex items-center gap-2">
 <label className="block text-sm font-medium">Service *</label>
 {!service && <span className="text-xs text-red-600">choose one</span>}
 </div>
 <select
 className="mt-1 w-full border rounded px-3 py-2"
 value={service}
 onChange={(e) => setService(e.target.value)}
 >
 <option value="">— select service —</option>
 {SERVICE_OPTIONS.map((s) => (
 <option key={s} value={s}>{s}</option>
 ))}
 </select>
 </div>

 {/* Город через Google Maps */}
 <div>
 <label className="block text-sm font-medium">City *</label>
 <CityAutocomplete value={city} onChange={setCity} />
 <p className="text-xs text-gray-500 mt-1">
 Начните вводить и выберите город из выпадающего списка.
 </p>
 </div>

 {/* Языки (множественный выбор) */}
 <div>
 <label className="block text-sm font-medium">Languages</label>
 <LanguagesField value={languages} onChange={setLanguages} />
 </div>

 {/* Цена и Фото */}
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium">Starting price (CAD)</label>
 <input
 type="number"
 min={0}
 className="mt-1 w-full border rounded px-3 py-2"
 value={price}
 onChange={(e) => setPrice(e.target.value)}
 placeholder="e.g. 50"
 />
 </div>
 <div>
 <label className="block text-sm font-medium">Photos (optional)</label>
 <input
 type="file"
 accept="image/*"
 multiple
 onChange={(e) => setFiles(Array.from(e.target.files || []))}
 />
 {files.length > 0 && (
 <div className="text-xs text-gray-600 mt-1">
 Selected: {files.length} file(s)
 </div>
 )}
 </div>
 </div>

 {/* О себе */}
 <div>
 <label className="block text-sm font-medium">Bio</label>
 <textarea
 className="mt-1 w-full border rounded px-3 py-2 min-h-[120px]"
 value={bio}
 onChange={(e) => setBio(e.target.value)}
 placeholder="Short description about you and your experience…"
 />
 </div>

 {err && <p className="text-red-600 text-sm">{err}</p>}

 <div className="flex gap-3">
 <button
 type="submit"
 disabled={!canSubmit}
 className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60"
 >
 {busy ? 'Saving…' : 'Create profile'}
 </button>
 <button
 type="button"
 onClick={() => history.back()}
 className="px-4 py-2 border rounded"
 >
 Cancel
 </button>
 </div>
 </form>
 );
}