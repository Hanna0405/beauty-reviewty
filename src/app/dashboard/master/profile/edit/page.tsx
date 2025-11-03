"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAuth, requireDb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { ensureSelectedArray, deriveMirrors } from "@/lib/ensureLists";
import MasterAvatarInput from "@/components/MasterAvatarInput";
import type { TagOption } from "@/types/tags";

type MasterProfile = {
 uid: string;
 displayName: string;
 city: string;
 services: string[];
 languages: string[];
 avatarUrl: string | null;
 phone?: string;
 socials?: {
  instagram?: string;
  facebook?: string;
  website?: string;
 };
 updatedAt?: unknown;
};

const emptyProfile = (uid: string): MasterProfile => ({
 uid,
 displayName: "",
 city: "",
 services: [],
 languages: [],
 avatarUrl: null,
 phone: "",
 socials: {
  instagram: "",
  facebook: "",
  website: "",
 },
});

export default function EditProfilePage() {
 const router = useRouter();
 const auth = requireAuth();
 const user = auth.currentUser;
 const uid = useMemo(() => user?.uid ?? "", [user]);

 const [form, setForm] = useState<MasterProfile>(emptyProfile(uid));
 const [city, setCity] = useState<CityNorm | null>(null);
 const [services, setServices] = useState<TagOption[]>([]);
 const [languages, setLanguages] = useState<TagOption[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 let cancelled = false;

 async function load() {
 if (!uid) {
 setLoading(false);
 return;
 }

 try {
 const db = requireDb();
 const snap = await getDoc(doc(db, "profiles", uid));
 if (snap.exists()) {
 const data = snap.data() as any;
 if (cancelled) return;

 const safe: MasterProfile = {
 uid,
 displayName: data.displayName ?? "",
 city: data.city ?? "",
 services: Array.isArray(data.services) ? data.services : [],
 languages: Array.isArray(data.languages) ? data.languages : [],
 avatarUrl: data.avatarUrl ?? null,
 phone: data.phone ?? "",
 socials: {
 instagram: data.socials?.instagram ?? "",
 facebook: data.socials?.facebook ?? "",
 website: data.socials?.website ?? "",
 },
 updatedAt: data.updatedAt,
 };

 setForm(safe);

 // init city
 setCity(
 safe.city
 ? {
 formatted: safe.city,
 city: safe.city,
 slug: "",
 state: "",
 stateCode: "",
 country: "",
 countryCode: "",
 lat: 0,
 lng: 0,
 placeId: "",
 }
 : null
 );

 // init services/languages for our new selects
 setServices(
 Array.isArray(safe.services)
 ? safe.services.map((s: any) => 
 typeof s === 'string' 
 ? { key: s, name: s } 
 : { key: s.key || s, name: s.name || s, emoji: s.emoji }
 )
 : []
 );
 setLanguages(
 Array.isArray(safe.languages)
 ? safe.languages.map((l: any) => 
 typeof l === 'string' 
 ? { key: l, name: l } 
 : { key: l.key || l, name: l.name || l, emoji: l.emoji }
 )
 : []
 );
 } else {
 if (cancelled) return;
 setForm(emptyProfile(uid));
 setCity(null);
 setServices([]);
 setLanguages([]);
 }
 } catch (e: any) {
 if (!cancelled) setError(e?.message || "Failed to load profile");
 } finally {
 if (!cancelled) setLoading(false);
 }
 }

 load();
 return () => {
 cancelled = true;
 };
 }, [uid]);

 function setField<K extends keyof MasterProfile>(key: K, val: MasterProfile[K]) {
 setForm((p) => ({ ...p, [key]: val }));
 }

 function validate(p: MasterProfile, cityObj: CityNorm | null, svc: TagOption[], lng: TagOption[]) {
 const errs: string[] = [];
 if (!p.displayName.trim()) errs.push("Display name is required.");
 if (!(cityObj?.formatted || p.city.trim())) errs.push("City is required.");
 if (!ensureSelectedArray(svc).length) errs.push("Add at least one service.");
 if (!ensureSelectedArray(lng).length) errs.push("Add at least one language.");
 return errs;
 }

 async function handleSave(e: React.FormEvent) {
 e.preventDefault();
 if (!uid) {
 setError("No authenticated user.");
 return;
 }

 const errs = validate(form, city, services, languages);
 if (errs.length) {
 setError(errs.join(" "));
 return;
 }

 setSaving(true);
 setError(null);

 const selServices = ensureSelectedArray(services);
 const selLanguages = ensureSelectedArray(languages);
 const svcMirrors = deriveMirrors(selServices);
 const lngMirrors = deriveMirrors(selLanguages);

 // Build raw data with city info
 const rawDataProfiles: any = {
 displayName: form.displayName.trim(),
 phone: form.phone?.trim() || "",
 avatarUrl: form.avatarUrl || null,
 socials: {
 instagram: form.socials?.instagram?.trim() || "",
 facebook: form.socials?.facebook?.trim() || "",
 website: form.socials?.website?.trim() || "",
 },
 services: selServices,
 serviceKeys: svcMirrors.keys,
 serviceNames: svcMirrors.names,
 languages: selLanguages,
 languageKeys: lngMirrors.keys,
 languageNames: lngMirrors.names,
 updatedAt: new Date().toISOString(),
 };

 const rawDataMasters: any = {
 uid,
 name: form.displayName.trim(),
 displayName: form.displayName.trim(),
 avatarUrl: form.avatarUrl || null,
 role: "master",
 isMaster: true,
 services: selServices,
 serviceKeys: svcMirrors.keys,
 serviceNames: svcMirrors.names,
 languages: selLanguages,
 languageKeys: lngMirrors.keys,
 languageNames: lngMirrors.names,
 socials: {
 instagram: form.socials?.instagram?.trim() || "",
 facebook: form.socials?.facebook?.trim() || "",
 website: form.socials?.website?.trim() || "",
 },
 updatedAt: new Date().toISOString(),
 };

 // Add city fields if selected
 if (city && city.formatted) {
 rawDataProfiles.city = city.formatted;
 rawDataProfiles.cityKey = city.slug || "";
 rawDataProfiles.cityName = city.formatted;
 rawDataProfiles.cityLat = city.lat || 0;
 rawDataProfiles.cityLng = city.lng || 0;
 rawDataProfiles.countryCode = city.countryCode || "";
 rawDataProfiles.admin1Code = city.stateCode || "";
 rawDataMasters.city = city.formatted;
 rawDataMasters.cityKey = city.slug || "";
 rawDataMasters.cityName = city.formatted;
 rawDataMasters.cityLat = city.lat || 0;
 rawDataMasters.cityLng = city.lng || 0;
 rawDataMasters.countryCode = city.countryCode || "";
 rawDataMasters.admin1Code = city.stateCode || "";
 } else if (form.city && form.city.trim()) {
 rawDataProfiles.city = form.city.trim();
 rawDataMasters.city = form.city.trim();
 }

 // Remove undefined values from payload
 function cleanPayload(data: any): any {
 const payload: any = {};
 Object.entries(data).forEach(([key, value]) => {
 if (value !== undefined && value !== null) {
 // Recursively clean nested objects
 if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
 const cleaned = cleanPayload(value);
 // Only add if the cleaned object has at least one key
 if (Object.keys(cleaned).length > 0) {
 payload[key] = cleaned;
 }
 } else {
 payload[key] = value;
 }
 }
 });
 return payload;
 }

 const payloadProfiles = cleanPayload(rawDataProfiles);
 const payloadMasters = cleanPayload(rawDataMasters);

 try {
 const db = requireDb();

 console.log('[Profile Edit] Saving to masters collection with payload:', payloadMasters);

 // 1) save in profiles
 await setDoc(doc(db, "profiles", uid), payloadProfiles, { merge: true });

 // 2) also save in masters so /masters shows it immediately
 // NOTE: /masters page queries collection("masters") with:
 // - where("role", "==", "master") OR where("isMaster", "==", true)
 // - filters by serviceKeys, languageKeys, city fields
 // - this payload includes all required fields
 await setDoc(doc(db, "masters", uid), payloadMasters, { merge: true });

 alert("Profile updated successfully");
 router.replace("/dashboard/master/profile");
 } catch (err: any) {
 console.error(err);
 setError(err?.message || "Failed to save profile");
 } finally {
 setSaving(false);
 }
 }

 if (!uid) {
 return (
 <div className="max-w-3xl mx-auto py-10 px-4">
 <div className="bg-white rounded-xl shadow-sm border border-pink-50 p-6">
 <h1 className="text-2xl font-semibold mb-2">Edit Profile</h1>
 <p className="text-red-600 text-sm">Please sign in to edit your profile.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto py-10 px-4">
 {loading ? (
 <div className="bg-white rounded-xl shadow-sm border border-pink-50 p-6">
 Loading…
 </div>
 ) : (
 <div className="bg-white rounded-xl shadow-sm border border-pink-50 p-6 space-y-6">
 {/* Title row */}
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-semibold">Edit Profile</h1>
 <a
 href="/dashboard/master/profile"
 className="text-sm text-pink-500 hover:text-pink-600"
 >
 ← Back to Profile
 </a>
 </div>

 <form onSubmit={handleSave} className="space-y-6">
 {error ? (
 <div className="rounded-md bg-red-50 border border-red-200 text-sm text-red-700 p-3">
 {error}
 </div>
 ) : null}

 {/* Avatar section */}
 <MasterAvatarInput
 uid={uid}
 currentUrl={form.avatarUrl}
 onUploaded={(url) => setField("avatarUrl", url)}
 />

 {/* display name */}
 <div className="space-y-1">
 <label className="text-sm font-medium">Display name *</label>
 <input
 value={form.displayName}
 onChange={(e) => setField("displayName", e.target.value)}
 className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
 placeholder="e.g. Masha Beauty"
 />
 </div>

 {/* city */}
 <div className="space-y-1">
 <label className="text-sm font-medium">City *</label>
 <CityAutocomplete
 value={city}
 onChange={setCity}
 placeholder="Start typing your city"
 />
 </div>

 {/* services */}
 <div className="space-y-1">
 <MultiSelectAutocompleteV2
 label="Services *"
 options={SERVICE_OPTIONS}
 value={services}
 onChange={setServices}
 placeholder="Search services…"
 />
 </div>

 {/* languages */}
 <div className="space-y-1">
 <MultiSelectAutocompleteV2
 label="Languages *"
 options={LANGUAGE_OPTIONS}
 value={languages}
 onChange={setLanguages}
 placeholder="Search languages…"
 />
 </div>

 {/* phone */}
 <div className="space-y-1">
 <label className="text-sm font-medium">Phone</label>
 <input
 value={form.phone ?? ""}
 onChange={(e) => setField("phone", e.target.value)}
 className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
 placeholder="+1 ..."
 />
 </div>

 {/* socials */}
 <div className="space-y-2">
 <label className="text-sm font-medium">Social links</label>
 <input
 value={form.socials?.instagram ?? ""}
 onChange={(e) =>
 setField("socials", {
 ...form.socials,
 instagram: e.target.value,
 })
 }
 placeholder="https://instagram.com/..."
 className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
 />
 <input
 value={form.socials?.facebook ?? ""}
 onChange={(e) =>
 setField("socials", {
 ...form.socials,
 facebook: e.target.value,
 })
 }
 placeholder="https://facebook.com/..."
 className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
 />
 <input
 value={form.socials?.website ?? ""}
 onChange={(e) =>
 setField("socials", {
 ...form.socials,
 website: e.target.value,
 })
 }
 placeholder="https://yourwebsite.com"
 className="w-full rounded-md border border-gray-200 bg-pink-50/40 px-3 py-2 focus:border-pink-400 focus:outline-none"
 />
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t">
 <a
 href="/dashboard/master/profile"
 className="px-4 py-2 rounded-md border text-sm text-slate-600 hover:bg-slate-50"
 >
 Cancel
 </a>
 <button
 type="submit"
 disabled={saving}
 className="px-4 py-2 rounded-md bg-pink-500 text-white text-sm hover:bg-pink-600 disabled:opacity-60"
 >
 {saving ? "Saving…" : "Save profile"}
 </button>
 </div>
 </form>
 </div>
 )}
 </div>
 );
}
