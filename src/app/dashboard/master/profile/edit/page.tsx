"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { requireAuth, requireDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/Toast";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";
import { saveMyProfile, uploadAvatar } from "@/lib/db";
import ServicesSelect from '@/components/ServicesSelect';
import LanguagesSelect from '@/components/LanguagesSelect';
import type { CatalogItem } from '@/catalog/services';
import { ensureSelectedArray, deriveMirrors } from '@/lib/ensureLists';
import { MapContainer } from '@/components/map';


type MasterProfile = {
 uid: string;
 displayName: string;
 city: string;
 services: string[];
 languages: string[];
 avatarUrl: string | null;
 avatarPath: string | null;
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
 avatarPath: null,
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
 const { showToast } = useToast();

 const [form, setForm] = useState<MasterProfile>(emptyProfile(uid));
 const [city, setCity] = useState<CityNorm | null>(null);
 const [services, setServices] = useState<CatalogItem[]>([]);
 const [languages, setLanguages] = useState<CatalogItem[]>([]);

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
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");                                                                                              
      setError("Database is not available. Please check your configuration.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const db = requireDb();
      const snap = await getDoc(doc(db, "masters", uid));
 if (snap.exists()) {
 const data = snap.data() as Partial<MasterProfile>;
 const safe: MasterProfile = {
 uid,
 displayName: (data.displayName ?? "") as string,
 city: (data.city ?? "") as string,
 services: Array.isArray(data.services) ? (data.services as string[]) : [],
 languages: Array.isArray(data.languages) ? (data.languages as string[]) : [],
 avatarUrl: (data.avatarUrl ?? null) as string | null,
 avatarPath: (data.avatarPath ?? null) as string | null,
 phone: (data.phone ?? "") as string,
 socials: {
  instagram: (data.socials?.instagram ?? "") as string,
  facebook: (data.socials?.facebook ?? "") as string,
  website: (data.socials?.website ?? "") as string,
 },
 updatedAt: data.updatedAt,
 };
 if (!cancelled) {
   setForm(safe);
   // Initialize city from existing data
   setCity(data.city ? { formatted: data.city, slug: '', city: data.city } : null);
   // Initialize services and languages from existing data
   setServices(Array.isArray(data.services) ? data.services.map(s => ({ key: s, name: s })) : []);
   setLanguages(Array.isArray(data.languages) ? data.languages.map(l => ({ key: l, name: l })) : []);
 }
 } else {
 if (!cancelled) {
   setForm(emptyProfile(uid));
   setCity(null);
   setServices([]);
   setLanguages([]);
 }
 }
 } catch (e: any) {
 if (!cancelled) setError(e?.message || "Failed to load profile.");
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


 function validate(p: MasterProfile): string[] {
 const errs: string[] = [];
 if (!p.displayName.trim()) errs.push("Display name is required.");
 if (!p.city.trim()) errs.push("City is required.");
 if (!p.services.length) errs.push("Add at least one service.");
 if (!p.languages.length) errs.push("Add at least one language.");
 return errs;
 }

 async function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
 return Promise.race([
 promise,
 new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
 ]) as Promise<T>;
 }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) {
      setError("No authenticated user.");
      return;
    }
    
    const errs = validate(form);
    if (errs.length) {
      setError(errs.join(" "));
      return;
    }

    setSaving(true);
    setError(null);

    // Compute mirrors and persist
    const selServices = ensureSelectedArray(services);
    const selLanguages = ensureSelectedArray(languages);
    const svc = deriveMirrors(selServices);
    const lng = deriveMirrors(selLanguages);

    // Derive city mirrors like on masters
    const cityPayload = city ? {
      cityKey: city.slug ?? city.key ?? city.id ?? '',
      cityName: city.formatted ?? city.name ?? '',
      cityFullName: city.formatted ?? city.fullName ?? city.label ?? '',
      cityLat: city.lat ?? 0,
      cityLng: city.lng ?? 0,
      countryCode: city.countryCode ?? '',
      admin1Code: city.admin1Code ?? '',
    } : {};

    try {
      await saveMyProfile({
        displayName: form.displayName.trim(),
        city: city?.formatted ?? form.city.trim(),
        phone: form.phone?.trim() || "",
        services: selServices,
        serviceKeys: svc.keys,
        serviceNames: svc.names,
        languages: selLanguages,
        languageKeys: lng.keys,
        languageNames: lng.names,
        avatarUrl: form.avatarUrl ?? null,
        socials: {
          instagram: form.socials?.instagram?.trim() || "",
          facebook: form.socials?.facebook?.trim() || "",
          website: form.socials?.website?.trim() || "",
        },
        ...cityPayload,
      });
        
        // Show success message and redirect
        showToast("Profile updated successfully", "success");
        router.replace("/dashboard/master/profile");
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to save profile.");
      } finally {
        setSaving(false);
      }
    }


 if (!uid) {
 return (
 <MapContainer>
 <div className="mx-auto max-w-2xl p-6">
 <h1 className="mb-4 text-2xl font-semibold">Edit Profile</h1>
 <p className="text-red-600">Please sign in to edit your profile.</p>
 </div>
 </MapContainer>
 );
 }

 return (
 <MapContainer>
 <div className="mx-auto max-w-2xl p-6">
 <div className="mb-6 flex items-center justify-between">
 <h1 className="text-2xl font-semibold">Edit Profile</h1>
 <a href="/dashboard/master/profile" className="text-sm text-pink-600 hover:underline">
 ← Back to Profile
 </a>
 </div>

 {loading ? (
 <div className="rounded border p-6">Loading…</div>
 ) : (
 <form onSubmit={handleSave} className="grid gap-5 rounded border p-6 mobile-form">
 {error && (
 <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>
 )}

    {/* Avatar */}
    <div className="grid gap-1">
     <label className="text-sm font-medium">Profile Photo</label>
     <input 
      type="file" 
      accept="image/*" 
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSaving(true);
        try {
          const url = await uploadAvatar(file);
          setField("avatarUrl", url);
        } finally { 
          setSaving(false); 
        }
      }}
      className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
     />
    </div>

    {/* Display name */}
    <div className="grid gap-1">
     <label className="text-sm font-medium">Display name *</label>
     <input
      className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
      value={form.displayName}
      onChange={(e) => setField("displayName", e.target.value)}
      placeholder="e.g. Masha Beauty"
     />
    </div>

    {/* City */}
    <div className="grid gap-1">
     <label className="text-sm font-medium">City *</label>
     <CityAutocomplete
      value={city}
      onChange={setCity}
      placeholder="Start typing your city"
     />
    </div>

    {/* Phone */}
    <div className="grid gap-1">
     <label className="text-sm font-medium">Phone</label>
     <input
      className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
      value={form.phone || ""}
      onChange={(e) => setField("phone", e.target.value)}
      placeholder="+1 (555) 123-4567"
     />
    </div>

    {/* Services with new multiselect */}
    <ServicesSelect value={services} onChange={setServices} required />

    {/* Languages with new multiselect */}
    <LanguagesSelect value={languages} onChange={setLanguages} required />

    {/* Social Media */}
    <div className="space-y-3">
     <label className="text-sm font-medium">Social Media</label>
     <div className="grid gap-3">
      <input
       className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
       value={form.socials?.instagram || ""}
       onChange={(e) => setField("socials", { ...form.socials, instagram: e.target.value })}
       placeholder="Instagram username"
      />
      <input
       className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
       value={form.socials?.facebook || ""}
       onChange={(e) => setField("socials", { ...form.socials, facebook: e.target.value })}
       placeholder="Facebook page"
      />
      <input
       className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
       value={form.socials?.website || ""}
       onChange={(e) => setField("socials", { ...form.socials, website: e.target.value })}
       placeholder="Website URL"
      />
     </div>
    </div>

 <div className="sticky-save md:relative md:sticky-0 md:bg-transparent md:border-0 md:p-0 md:m-0">
  <div className="flex items-center justify-end gap-3">
   <a href="/dashboard/master/profile" className="rounded border px-4 py-2 text-sm touch-target">
    Cancel
   </a>
   <button
    type="submit"
    disabled={saving}
    className="rounded bg-pink-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60 touch-target"
   >
    {saving ? "Saving…" : "Save changes"}
   </button>
  </div>
 </div>
 </form>
 )}
 </div>
 </MapContainer>
 );
}
