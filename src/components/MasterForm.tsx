'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createListing } from '@/lib/firestore-listings';
import CityAutocomplete from '@/components/CityAutocomplete';
import AutocompleteMulti from '@/components/AutocompleteMulti';
import { SERVICES_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/options';
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

type CityField = string | { name?: string; placeId?: string } | null | undefined;

export default function MasterForm() {
 const router = useRouter();
 const { user, profile, role } = useAuth();
 const uid = user?.uid ?? null; // <-- берём uid отдельно

 const [title, setTitle] = useState<string>(profile?.displayName || '');
 const [services, setServices] = useState<string[]>([]); // массив услуг

 const c0 = (profile?.city as CityField);

 const [city, setCity] = useState<string | undefined>(
   !c0 ? undefined : (typeof c0 === 'string' ? c0 : c0.name)
 );

 const [cityPlaceId, setCityPlaceId] = useState<string | undefined>(
   (c0 && typeof c0 === 'object') ? c0.placeId : undefined
 );
 const [languages, setLanguages] = useState<string[]>([]);
 const [priceMin, setPriceMin] = useState<string>(''); // опционально
 const [priceMax, setPriceMax] = useState<string>(''); // опционально
 const [description, setDescription] = useState<string>('');
 const [files, setFiles] = useState<File[]>([]); // опционально

 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState<string | null>(null);

 // Дополнительная защита
 if (!user || role !== 'master') {
 return <div className="p-4">Only <b>master</b> can create a profile.</div>;
 }

 const canSubmit =
 !busy &&
 !!user && // обязателен user
 title.trim().length >= 2 &&
 services.length > 0 &&
 city.trim().length > 0;

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!canSubmit || !user) return; // <-- страховка для TS

 setBusy(true);
 setErr(null);

 try {
 // загрузка фото (если выбраны)
 let photos: { url: string; path: string; width: null; height: null }[] = [];
 if (files.length) {
 const result = await uploadFilesAndGetURLs(`listings/${user.uid}`, files);
 photos = result.urls.map(url => ({ url, path: '', width: null, height: null }));
 }

 const cityObj: { name: string; placeId?: string } | null =
   city ? { name: city, placeId: cityPlaceId } : null;

 const docRef = await createListing(user, {
   title,
   city: cityObj,
   services,
   languages,
   priceMin: priceMin.trim() === '' ? null : Number(priceMin.trim()),
   priceMax: priceMax.trim() === '' ? null : Number(priceMax.trim()),
   description,
   photos,
 });

 console.info('[BR][MasterForm] Created listing:', docRef.id);
 router.replace('/dashboard/master/listings');
 } catch (e: any) {
 console.error('[BR][MasterForm] Failed to create listing:', e);
 setErr(e.message ?? 'Failed to create listing');
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
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Two Jewelry"
 required
 />
 </div>

 {/* Услуга (обязательно) */}
 <div>
 <label className="block text-sm font-medium mb-2">Services *</label>
 <AutocompleteMulti
 value={services}
 onChange={setServices}
 options={SERVICES_OPTIONS}
 placeholder="Select services..."
 />
 {services.length === 0 && <span className="text-xs text-red-600">choose at least one</span>}
 </div>

 {/* Город через Google Maps */}
 <div>
 <label className="block text-sm font-medium">City *</label>
 <CityAutocomplete
   value={city}
   onChange={(label, meta) => {
     setCity(label); // string | undefined is OK
     setCityPlaceId(meta?.placeId); // keep placeId in state
   }}
 />
 <p className="text-xs text-gray-500 mt-1">
 Начните вводить и выберите город из выпадающего списка.
 </p>
 </div>

 {/* Языки (множественный выбор) */}
 <div>
 <label className="block text-sm font-medium">Languages</label>
 <AutocompleteMulti
 value={languages}
 onChange={setLanguages}
 options={LANGUAGE_OPTIONS}
 placeholder="Add languages..."
 />
 </div>

 {/* Цена и Фото */}
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium">Starting price (CAD)</label>
 <input
 type="number"
 min={0}
 className="mt-1 w-full border rounded px-3 py-2"
 value={priceMin}
 onChange={(e) => setPriceMin(e.target.value)}
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
 value={description}
 onChange={(e) => setDescription(e.target.value)}
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
 {busy ? 'Creating...' : 'Create Listing'}
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