"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useAuth } from "@/contexts/AuthContext";
import CityAutocompleteNew from "@/components/CityAutocompleteNew";
import ServiceAutocomplete from "@/components/ServiceAutocomplete";
import LanguagesAutocomplete from "@/components/LanguagesAutocomplete";

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

export default function ProfileEditPage() {
 const { user } = useAuth();
 const [form, setForm] = useState<ProfileForm>({
 displayName: "",
 city: "",
 services: [],
 languages: [],
 socials: {}
 });
 const [saving, setSaving] = useState(false);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!user) return;
 if (!db) return;
 (async () => {
 const snap = await getDoc(doc(db, "users", user.uid));
 const data = snap.exists() ? (snap.data() as any) : {};
 setForm({
 displayName: data.displayName || "",
 city: data.city || "",
 services: data.services || [],
 languages: data.languages || [],
 socials: data.socials || {}
 });
 setLoading(false);
 })();
 }, [user]);

 async function onSave(e: React.FormEvent) {
 e.preventDefault();
 if (!user) return;
 if (!db) return;
 setSaving(true);
 await updateDoc(doc(db, "users", user.uid), {
 displayName: form.displayName || null,
 city: form.city || null,
 services: form.services || [],
 languages: form.languages || [],
 socials: form.socials || {},
 updatedAt: serverTimestamp()
 });
 setSaving(false);
 }

 if (loading) return <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-gray-500">Loading…</div>;

 return (
 <div className="mx-auto max-w-2xl px-4 py-8">
 <h1 className="mb-6 text-2xl font-bold">Edit Profile</h1>
 <form onSubmit={onSave} className="space-y-5">
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
 <input
 value={form.displayName}
 onChange={(e) => setForm({ ...form, displayName: e.target.value })}
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-600"
 placeholder="Your name"
 />
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
 <CityAutocompleteNew
 value={form.city}
 onChange={(v: string) => setForm({ ...form, city: v })}
 />
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Services</label>
 <ServiceAutocomplete
 value={form.services}
 onChange={(v: string[]) => setForm({ ...form, services: v })}
 options={["Tattoo - Brows", "Brow Lamination", "Hair Braids", "Nails", "Makeup", "Hair Stylist", "Lashes", "Cosmetologist", "Botox", "Lip augmentation", "Filler", "Biorevitalization", "Chemical peel", "Microneedling", "PRP", "Facial cleansing", "Haircut", "Coloring", "Balayage", "Keratin treatment", "Extensions", "Styling", "Manicure", "Pedicure", "Gel polish", "Acrylic", "Nail extensions", "Nail art", "Brow shaping", "Brow tint", "Lamination", "Lash lift", "Lash extensions", "Day makeup", "Evening makeup", "Wedding makeup", "Photoshoot makeup"]}
 />
 </div>

 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Languages</label>
 <LanguagesAutocomplete
 onAdd={(lang: string) => {
 if (!form.languages.includes(lang)) {
 setForm({ ...form, languages: [...form.languages, lang] });
 }
 }}
 options={["English", "Ukrainian", "Russian", "Polish", "French", "Spanish", "German", "Italian", "Portuguese", "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Turkish"]}
 />
 {form.languages.length > 0 && (
 <div className="mt-2 flex flex-wrap gap-1">
 {form.languages.map((lang) => (
 <span key={lang} className="inline-flex items-center rounded-full bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-200">
 {lang}
 <button
 type="button"
 onClick={() => setForm({ ...form, languages: form.languages.filter(l => l !== lang) })}
 className="ml-1 text-pink-500 hover:text-pink-700"
 >
 ×
 </button>
 </span>
 ))}
 </div>
 )}
 </div>

 <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">Instagram</label>
 <input
 value={form.socials?.instagram || ""}
 onChange={(e) => setForm({ ...form, socials: { ...form.socials, instagram: e.target.value } })}
 placeholder="@username"
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-600"
 />
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-gray-700">TikTok</label>
 <input
 value={form.socials?.tiktok || ""}
 onChange={(e) => setForm({ ...form, socials: { ...form.socials, tiktok: e.target.value } })}
 placeholder="@username"
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-600"
 />
 </div>
 <div className="sm:col-span-2">
 <label className="mb-1 block text-sm font-medium text-gray-700">Website</label>
 <input
 value={form.socials?.website || ""}
 onChange={(e) => setForm({ ...form, socials: { ...form.socials, website: e.target.value } })}
 placeholder="https://..."
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-600"
 />
 </div>
 </fieldset>

 <div className="flex items-center gap-3">
 <button
 type="submit"
 disabled={saving}
 className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60"
 >
 {saving ? "Saving..." : "Save Profile"}
 </button>
 <a href="/dashboard/master" className="text-sm text-gray-600 hover:underline">
 Cancel
 </a>
 </div>
 </form>
 </div>
 );
}