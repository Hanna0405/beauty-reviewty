'use client';

import { useMemo, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { uploadImage } from "@/lib/upload-image";

type Service = { id: string; name: string; price: number };

const CATALOG = [
 { id: 'nails', name: 'Nails' },
 { id: 'haircut', name: 'Haircut' },
 { id: 'makeup', name: 'Makeup' },
 { id: 'brows', name: 'Brows & Lashes' },
 { id: 'massage', name: 'Massage' }
];

// Базовый список городов для подсказок (можно вводить ЛЮБОЙ свой):
const CITY_SUGGESTIONS = [
 'Toronto','Vancouver','Montreal','Calgary','Edmonton','Ottawa','Winnipeg',
 'Mississauga','Brampton','Hamilton','Kitchener','London','Quebec City',
 'Surrey','Halifax','Victoria','Saskatoon','Regina','Barrie','Bradford'
];

export default function OnboardingPage() {
  // TODO: mount your real onboarding component here, e.g. <Onboarding />
  return (
    <div style={{ padding: 16 }}>
      <h1>Onboarding</h1>
      <p>Welcome! Complete your profile to continue.</p>
    </div>
  );
}

function MasterProfileForm({ initialUser }: { initialUser?: any }) {
 const [displayName, setDisplayName] = useState(initialUser?.displayName ?? '');
 const [city, setCity] = useState(initialUser?.city ?? '');
 const [about, setAbout] = useState(initialUser?.about ?? '');
 const [services, setServices] = useState<Service[]>(initialUser?.services ?? []);
 const [selectedCatalogId, setSelectedCatalogId] = useState('');
 const [customServiceName, setCustomServiceName] = useState('');
 const [customPrice, setCustomPrice] = useState<string>('');
 const [files, setFiles] = useState<FileList | null>(null);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const canSave = useMemo(
 () => displayName.trim().length > 1 && city.trim().length > 1 && services.length > 0 && !saving,
 [displayName, city, services.length, saving]
 );

 function addServiceFromCatalog() {
 const item = CATALOG.find(c => c.id === selectedCatalogId);
 if (!item || services.some(s => s.id === item.id)) return;
 setServices(prev => [...prev, { id: item.id, name: item.name, price: 0 }]);
 setSelectedCatalogId('');
 }

 function addCustomService() {
 const name = customServiceName.trim();
 if (!name) return;
 const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}`;
 if (services.some(s => s.id === id)) return;
 const priceNum = Number(customPrice) || 0;
 setServices(prev => [...prev, { id, name, price: priceNum }]);
 setCustomServiceName('');
 setCustomPrice('');
 }

 function updatePrice(id: string, price: number) {
 setServices(prev => prev.map(s => (s.id === id ? { ...s, price } : s)));
 }
 function removeService(id: string) {
 setServices(prev => prev.filter(s => s.id !== id));
 }

 async function handleSave() {
 setSaving(true);
 setError(null);
 try {
 const uid = auth?.currentUser?.uid;
 if (!uid) throw new Error('Not authenticated');

 if (!db) {
 throw new Error('Database is not available. Check Firebase configuration.');
 }

 const userRef = doc(db, 'users', uid);

 // 1) Сохранить профиль (без фото) — обязательно, чтобы не «висло»
 await setDoc(
 userRef,
 {
 uid,
 role: 'master',
 displayName: displayName.trim(),
 city: city.trim(),
 about: about.trim(),
 services
 },
 { merge: true }
 );

 // 2) Фото — необязательно. Если нет файлов, завершаем.
 if (!files || files.length === 0) {
 alert('Saved ');
 return;
 }

 // 3) Безопасная загрузка фото (тип/размер + allSettled)
 const allowed = Array.from(files).filter(f => /^image\//.test(f.type) && f.size <= 10 * 1024 * 1024);
 if (allowed.length === 0) {
 alert('Профиль сохранён. Фото не загружены (тип или размер >10MB).');
 return;
 }

 const tasks = allowed.map(async f => {
 const path = `users/${uid}/photos/${Date.now()}-${f.name}`;
 const { url } = await uploadImage(f, path);
 return url;
 });

 const results = await Promise.allSettled(tasks);
 const urls = results.filter(r => r.status === 'fulfilled').map(r => (r as any).value);

 if (urls.length) {
 await setDoc(userRef, { photos: (initialUser?.photos ?? []).concat(urls) }, { merge: true });
 }

 const failed = results.filter(r => r.status === 'rejected').length;
 alert(`Saved ${failed ? ' (часть фото не загрузилась)' : ''}`);
 } catch (e: any) {
 console.error(e);
 setError(e.message || 'Save failed');
 } finally {
 setSaving(false);
 }
 }

 // Универсальные классы ввода/кнопок — аккуратный вид
 const clsInput =
 'w-full rounded-lg border border-gray-300 px-3 py-2 text-[15px] outline-none focus:border-transparent focus:ring-2 focus:ring-pink-500';
 const clsBtnPrimary =
 'inline-flex items-center justify-center rounded-lg bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed';
 const clsBtnGhost = 'rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100';

 return (
 <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
 <h2 className="mb-4 text-xl font-semibold">Master Profile</h2>

 <div className="space-y-5">
 <label className="block">
 <div className="mb-1 text-sm font-medium">Display name</div>
 <input className={clsInput} value={displayName} onChange={e => setDisplayName(e.target.value)} />
 </label>

 {/* Город: datalist — можно выбрать из подсказок или ввести ЛЮБОЙ */}
 <label className="block">
 <div className="mb-1 text-sm font-medium">City</div>
 <input
 className={clsInput}
 list="city-list"
 value={city}
 onChange={e => setCity(e.target.value)}
 placeholder="Начни вводить и выбери из списка или введи свой"
 />
 <datalist id="city-list">
 {CITY_SUGGESTIONS.map(c => (
 <option key={c} value={c} />
 ))}
 </datalist>
 </label>

 <label className="block">
 <div className="mb-1 text-sm font-medium">About</div>
 <textarea className={clsInput} rows={3} value={about} onChange={e => setAbout(e.target.value)} />
 </label>

 {/* Услуги — обязателен ≥1 */}
 <div>
 <div className="mb-2 text-sm font-semibold">Services (обязательно ≥ 1)</div>

 <div className="mb-2 flex gap-2">
 <select
 value={selectedCatalogId}
 onChange={e => setSelectedCatalogId(e.target.value)}
 className={clsInput + ' w-1/2'}
 >
 <option value="">— выбрать из каталога —</option>
 {CATALOG.map(c => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 <button type="button" className={clsBtnPrimary} onClick={addServiceFromCatalog} disabled={!selectedCatalogId}>
 Add
 </button>
 </div>

 <div className="mb-3 flex gap-2">
 <input
 className={clsInput + ' flex-1'}
 placeholder="Своя услуга (например, Balayage)"
 value={customServiceName}
 onChange={e => setCustomServiceName(e.target.value)}
 />
 <input
 className={clsInput + ' w-32'}
 placeholder="Цена"
 inputMode="numeric"
 value={customPrice}
 onChange={e => setCustomPrice(e.target.value)}
 />
 <button className={clsBtnPrimary} type="button" onClick={addCustomService} disabled={!customServiceName.trim()}>
 Add
 </button>
 </div>

 {services.length === 0 && <div className="text-sm text-red-600">Добавьте хотя бы одну услугу.</div>}

 <ul className="divide-y rounded-lg border">
 {services.map(s => (
 <li key={s.id} className="flex items-center gap-3 p-2">
 <div className="flex-1 font-medium">{s.name}</div>
 <input
 className={clsInput + ' w-28'}
 value={s.price}
 inputMode="numeric"
 onChange={e => updatePrice(s.id, Number(e.target.value || 0))}
 />
 <span className="w-10 text-right text-sm text-gray-600">CAD</span>
 <button className={clsBtnGhost} type="button" onClick={() => removeService(s.id)}>
 ✕
 </button>
 </li>
 ))}
 </ul>
 </div>

 {/* Фото — необязательно */}
 <div>
 <div className="mb-2 text-sm font-medium">Portfolio photos (необязательно)</div>
 <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setFiles(e.target.files)} />
 <div className="mt-1 text-xs text-gray-500">Можно выбрать несколько фото (до 10 МБ каждое).</div>
 </div>

 {error && <div className="text-sm text-red-600">{error}</div>}

 <div className="pt-2">
 <button className={clsBtnPrimary} onClick={handleSave} disabled={!canSave}>
 {saving ? 'Saving…' : 'Save'}
 </button>
 </div>
 </div>
 </div>
 );
}