"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useAuth } from "@/contexts/AuthContext";
import CityAutocomplete from "@/components/CityAutocomplete";
import { NormalizedCity } from "@/lib/cityNormalize";
import { ensureSelectedCity } from "@/lib/ensureCity";
import ServicesSelect from "@/components/ServicesSelect";
import LanguagesSelect from "@/components/LanguagesSelect";
import type { CatalogItem } from "@/catalog/services";
import { ensureSelectedArray, deriveMirrors } from "@/lib/ensureLists";
import { useRouter } from "next/navigation";

type ProfileForm = {
 displayName: string;
 city: string;
 services: string[];
 languages: string[];
 socials?: {
 instagram?: string;
 tiktok?: string;
 website?: string;
 };
};

async function uploadAvatar(file: File) {
 const fd = new FormData();
 fd.append('file', file);
 const res = await fetch('/api/upload?folder=avatars', { method: 'POST', body: fd });
 if (!res.ok) throw new Error('Upload failed');
 return res.json() as Promise<{ url: string; path: string }>;
}

export default function ProfileEditPage() {
 const { user, profile } = useAuth();
 const router = useRouter();
 const [form, setForm] = useState<ProfileForm>({
 displayName: "",
 city: "",
 services: [],
 languages: [],
 socials: {}
 });
 const [city, setCity] = useState<NormalizedCity | null>(null);
 const [services, setServices] = useState<CatalogItem[]>([]);
 const [languages, setLanguages] = useState<CatalogItem[]>([]);
 const [localAvatarFile, setLocalAvatarFile] = useState<File | null>(null);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
 const [currentAvatarPath, setCurrentAvatarPath] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!user) return;
 if (!db) return;
 (async () => {
 try {
 const snap = await getDoc(doc(db, "profiles", user.uid));
 const data = snap.exists() ? (snap.data() as any) : {};
 setForm({
 displayName: data.displayName || "",
 city: data.city || "",
 services: data.services || [],
 languages: data.languages || [],
 socials: {
 instagram: data.instagram || "",
 tiktok: data.tiktok || "",
 website: data.website || ""
 }
 });
 setAvatarPreview(data.avatarUrl || null);
 setCurrentAvatarPath(data.avatarPath || null);
 } catch (e) {
 console.error('Error loading profile:', e);
 } finally {
 setLoading(false);
 }
 })();
 }, [user]);

 const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 setLocalAvatarFile(file);
 const reader = new FileReader();
 reader.onload = (e) => {
 setAvatarPreview(e.target?.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const onSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;
 if (!db) return;

 setSaving(true);
 setError(null);

 try {
 let avatarUrl = avatarPreview;
 let avatarPath = currentAvatarPath;

 if (localAvatarFile) {
 const up = await uploadAvatar(localAvatarFile);
 avatarUrl = up.url;
 avatarPath = up.path;
 }

 // Enforce city selection from autocomplete
 const selected = ensureSelectedCity(city);

 // Enforce services and languages selection
 const selServices = ensureSelectedArray(services);
 const selLanguages = ensureSelectedArray(languages);
 const svc = deriveMirrors(selServices);
 const lng = deriveMirrors(selLanguages);

 await setDoc(doc(db, "profiles", user.uid), {
 uid: user.uid,
 displayName: form.displayName?.trim() || '',
 city: selected, // full normalized object
 cityKey: selected.slug, // for queries/filters
 cityName: selected.formatted, // for UI display
 services: selServices,
 serviceKeys: svc.keys,
 serviceNames: svc.names,
 languages: selLanguages,
 languageKeys: lng.keys,
 languageNames: lng.names,
 instagram: form.socials?.instagram ?? null,
 tiktok: form.socials?.tiktok ?? null,
 website: form.socials?.website ?? null,
 avatarUrl,
 avatarPath,
 updatedAt: serverTimestamp(),
 }, { merge: true });

 router.push('/profile');
 } catch (e) {
 setError(e instanceof Error ? e.message : 'Save failed');
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return <div className="max-w-2xl mx-auto p-6"><div className="text-center text-gray-500">Loading...</div></div>;
 }

 return (
 <div className="max-w-2xl mx-auto p-6">
 <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>
 
 <form onSubmit={onSubmit} className="space-y-6">
 {/* Avatar Upload */}
 <div>
 <label className="block text-sm font-medium mb-2">Avatar</label>
 <div className="flex items-center space-x-4">
 <div className="h-20 w-20 rounded-full bg-pink-500 text-white flex items-center justify-center text-2xl font-semibold overflow-hidden">
 {avatarPreview ? (
 <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 form.displayName?.[0]?.toUpperCase() ?? 'U'
 )}
 </div>
 <input
 type="file"
 accept="image/*"
 onChange={handleAvatarChange}
 className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
 />
 </div>
 </div>

 {/* Display Name */}
 <div>
 <label className="block text-sm font-medium mb-2">Display Name</label>
 <input
 type="text"
 value={form.displayName}
 onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
 className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
 placeholder="Your display name"
 />
 </div>

 {/* City */}
 <div>
 <label className="block text-sm font-medium mb-2">City</label>
 <CityAutocomplete
 apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
 label="City"
 value={city}
 onChange={(selectedCity) => {
   setCity(selectedCity);
   setForm(f => ({ ...f, city: selectedCity?.formatted || '' }));
 }}
 placeholder="Select your city"
 region="CA"
 />
 </div>

 {/* Services */}
 <div>
 <ServicesSelect value={services} onChange={setServices} />
 </div>

 {/* Languages */}
 <div>
 <LanguagesSelect value={languages} onChange={setLanguages} />
 </div>

 {/* Social Links */}
 <div className="space-y-4">
 <h3 className="text-lg font-medium">Social Links</h3>
 
 <div>
 <label className="block text-sm font-medium mb-2">Instagram</label>
 <input
 type="url"
 value={form.socials?.instagram || ''}
 onChange={(e) => setForm(f => ({ 
 ...f, 
 socials: { ...f.socials, instagram: e.target.value }
 }))}
 className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
 placeholder="https://instagram.com/yourusername"
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-2">TikTok</label>
 <input
 type="url"
 value={form.socials?.tiktok || ''}
 onChange={(e) => setForm(f => ({ 
 ...f, 
 socials: { ...f.socials, tiktok: e.target.value }
 }))}
 className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
 placeholder="https://tiktok.com/@yourusername"
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-2">Website</label>
 <input
 type="url"
 value={form.socials?.website || ''}
 onChange={(e) => setForm(f => ({ 
 ...f, 
 socials: { ...f.socials, website: e.target.value }
 }))}
 className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
 placeholder="https://yourwebsite.com"
 />
 </div>
 </div>

 {error && (
 <div className="text-red-600 text-sm">{error}</div>
 )}

 <button
 type="submit"
 disabled={saving}
 className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {saving ? 'Saving...' : 'Save Profile'}
 </button>
 </form>
 </div>
 );
}