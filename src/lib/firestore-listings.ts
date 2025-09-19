// src/lib/firestore-listings.ts
'use client';
import { addDoc, setDoc, doc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { User } from 'firebase/auth';

export type Photo = { url: string; path: string; width?: number | null; height?: number | null };
export type CityObj = { name: string; placeId?: string } | null;

export type NewListing = {
  title: string;
  city: string | CityObj | any; // Allow NormalizedCity or other city objects
  services: any[]; // Allow CatalogItem[] or string[]
  languages: any[]; // Allow CatalogItem[] or string[]
  priceMin?: number | null;
  priceMax?: number | null;
  description?: string;
  photos: Photo[];
  // String mirrors for safe rendering
  cityName?: string;
  cityKey?: string;
  serviceKeys?: string[];
  serviceNames?: string[];
  languageKeys?: string[];
  languageNames?: string[];
};

type AppUser = { uid: string; email: string | null };

// Normalize city data before saving to Firestore
function normalizeCity(c: string | CityObj | any): CityObj {
  if (!c) return null;
  if (typeof c === 'string') return { name: c };
  if (c.formatted) return { name: c.formatted, placeId: c.placeId }; // NormalizedCity
  return c; // already object {name, placeId?}
}

export async function createListing(user: User | AppUser, data: NewListing) {
  const payload = {
    title: (data.title ?? '').trim(),
    city: normalizeCity(data.city),
    services: data.services ?? [],
    languages: data.languages ?? [],
    priceMin: data.priceMin ?? null,
    priceMax: data.priceMax ?? null,
    description: (data.description ?? '').trim(),
    photos: data.photos ?? [],
    // String mirrors for safe rendering
    cityName: data.cityName || '',
    cityKey: data.cityKey || '',
    serviceKeys: data.serviceKeys || [],
    serviceNames: data.serviceNames || [],
    languageKeys: data.languageKeys || [],
    languageNames: data.languageNames || [],
    ownerId: user.uid, // required by rules
    ownerUid: user.uid, // extra safety (some rules check this)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  console.info('[BR][CreateListing] payload:', payload);
  return await addDoc(collection(db, 'listings'), payload);
}

export async function updateListing(user: User | AppUser, id: string, data: Partial<NewListing>) {
  // Ensure we never change owner on update
  const ref = doc(db, 'listings', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Listing not found');
  const existing = snap.data() as any;
  const payload = {
    title: data.title?.trim(),
    city: data.city ? normalizeCity(data.city) : undefined,
    services: data.services,
    languages: data.languages,
    priceMin: data.priceMin,
    priceMax: data.priceMax,
    description: data.description?.trim(),
    photos: data.photos,
    // String mirrors for safe rendering
    cityName: data.cityName,
    cityKey: data.cityKey,
    serviceKeys: data.serviceKeys,
    serviceNames: data.serviceNames,
    languageKeys: data.languageKeys,
    languageNames: data.languageNames,
    updatedAt: serverTimestamp(),
    ownerId: existing.ownerId, // keep owner
    ownerUid: existing.ownerUid, // keep owner
  };
  console.info('[BR][UpdateListing] payload:', payload);
  await setDoc(ref, payload, { merge: true });
}

// Legacy compatibility functions
export async function createListingInBoth(user: User | AppUser, data: NewListing) {
 console.warn('[BR][Deprecated] createListingInBoth is deprecated, use createListing instead');
 return await createListing(user, data);
}

export async function patchListingPhotos(user: User | AppUser, id: string, photos: Photo[]) {
 console.warn('[BR][Deprecated] patchListingPhotos is deprecated, use updateListing instead');
 return await updateListing(user, id, { photos });
}