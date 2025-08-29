"use client";

/// <reference types="@types/google.maps" />

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadFilesAndGetURLs } from "@/lib/auth-helpers";
import CityAutocomplete from "@/components/CityAutocomplete";

type Props = {
 initialUser?: Partial<{
 displayName: string;
 city: string;
 bio: string;
 service1: string;
 service2: string;
 price: number | string;
 photos: string[];
 lat: number;
 lng: number;
 }>;
};

export default function MasterProfileForm({ initialUser }: Props) {
 // ----- form state -----
 const [displayName, setDisplayName] = useState(initialUser?.displayName ?? "");
 const [bio, setBio] = useState(initialUser?.bio ?? "");
 const [service1, setService1] = useState(initialUser?.service1 ?? "");
 const [service2, setService2] = useState(initialUser?.service2 ?? "");
 const [price, setPrice] = useState<string>(String(initialUser?.price ?? ""));
 const [city, setCity] = useState(initialUser?.city ?? "");
 const [lat, setLat] = useState<number | null>(initialUser?.lat ?? null);
 const [lng, setLng] = useState<number | null>(initialUser?.lng ?? null);

 const [newFiles, setNewFiles] = useState<File[]>([]);
 const [existingPhotos, setExistingPhotos] = useState<string[]>(initialUser?.photos ?? []);

 const [saving, setSaving] = useState(false);

 const canSave = useMemo(() => {
 return displayName.trim().length >= 2 && city.trim().length >= 2 && !saving;
 }, [displayName, city, saving]);

 // ----- handlers -----
 async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
 if (!e.target.files) return;
 setNewFiles(Array.from(e.target.files));
 }

 async function onSubmit(e: React.FormEvent) {
   e.preventDefault();
  
   const user = auth.currentUser;
   if (!user) {
   alert("Please log in.");
   return;
   }
   const uid = user.uid;
  
   if (!canSave) return;
  
   try {
   setSaving(true);
  
   // загрузим новые фото и объединим со старыми
   let uploaded: string[] = [];
   if (newFiles.length) {
   uploaded = await uploadFilesAndGetURLs(newFiles, uid); // <- передаём uid
   }

   // оставляем совместимость: если в документе есть старое поле photoUrls — объединяем
const old = Array.isArray(existingPhotos) ? existingPhotos : [];
const photos = [...old, ...uploaded]; // итог всегда пишем в поле photos
  
   // нормализуем цену
   const priceNumber = Number(price);
   const normalizedPrice = Number.isFinite(priceNumber) ? priceNumber : null;
  
   const payload = {
   uid,
   displayName: displayName.trim(),
   bio: bio.trim(),
   service1: service1.trim(),
   service2: service2.trim(),
   price: normalizedPrice,
   city: city.trim(),
   lat: lat ?? null,
   lng: lng ?? null,
   photos,
   photoUrls: photos,
   updatedAt: serverTimestamp(),
   createdAt: serverTimestamp(),
   };
  
   await setDoc(doc(db, "masters", uid), payload, { merge: true });
  
   setNewFiles([]);
   alert("Profile saved!");
   } catch (err) {
   console.error(err);
   alert("Saving failed. See console.");
   } finally {
   setSaving(false);
   }
  }

 // ----- UI -----
 return (
 <form onSubmit={onSubmit} className="space-y-6">
 {/* Name */}
 <div className="grid gap-2">
 <label className="text-sm font-medium">Name</label>
 <input
 value={displayName}
 onChange={(e) => setDisplayName(e.target.value)}
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
 placeholder="Your name"
 />
 </div>

 {/* City w/ Google Places */}
 <div className="grid gap-2">
 <label className="text-sm font-medium">City</label>
 <CityAutocomplete
 value={city}
 onChange={setCity}
 onPlaceSelect={(p) => {
 setCity(p.description);
 if (p.lat && p.lng) {
 setLat(p.lat);
 setLng(p.lng);
 }
 }}
 placeholder="Start typing your city…"
 />
 {lat != null && lng != null && (
 <p className="text-xs text-gray-500">Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
 )}
 </div>

 {/* Services & Price */}
 <div className="grid gap-2">
 <label className="text-sm font-medium">Service 1</label>
 <input
 value={service1}
 onChange={(e) => setService1(e.target.value)}
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
 placeholder="e.g. Lash extensions"
 />
 </div>

 <div className="grid gap-2">
 <label className="text-sm font-medium">Service 2</label>
 <input
 value={service2}
 onChange={(e) => setService2(e.target.value)}
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
 placeholder="e.g. Permanent makeup"
 />
 </div>

 <div className="grid gap-2">
 <label className="text-sm font-medium">Price (CAD)</label>
 <input
 inputMode="decimal"
 value={price}
 onChange={(e) => setPrice(e.target.value)}
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
 placeholder="e.g. 120"
 />
 </div>

 {/* Bio */}
 <div className="grid gap-2">
 <label className="text-sm font-medium">About</label>
 <textarea
 value={bio}
 onChange={(e) => setBio(e.target.value)}
 rows={4}
 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
 placeholder="Short description"
 />
 </div>

 {/* Photos */}
 <div className="grid gap-2">
 <label className="text-sm font-medium">Portfolio photos</label>
 <input type="file" multiple accept="image/*" onChange={onFilesSelected} />
 {!!existingPhotos.length && (
 <div className="mt-2 grid grid-cols-3 gap-2">
 {existingPhotos.map((url, i) => (
 <div key={i} className="relative h-24 w-full overflow-hidden rounded-md border">
 <Image src={url} alt={`photo-${i}`} fill className="object-cover" />
 </div>
 ))}
 </div>
 )}
 {!!newFiles.length && (
 <p className="text-xs text-gray-500">{newFiles.length} new file(s) selected</p>
 )}
 </div>

 {/* Actions */}
 <div className="flex justify-center">
 <button
 type="submit"
 disabled={!canSave || saving}
 className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
 >
 {saving ? "Saving…" : "Save"}
 </button>
 </div>
 </form>
 );
}