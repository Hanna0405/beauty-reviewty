'use client';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { pruneUndefinedDeep, emptyStringsToNullDeep } from '@/lib/objectClean';

export async function saveProfile(raw: any) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in');

  const city = raw.city ?? raw.cityObj ?? null;
  const safeCity = city ? {
    city: city.city ?? city.cityName ?? undefined,
    cityName: city.cityName ?? city.city ?? undefined,
    cityKey: city.cityKey ?? undefined,
    state: city.state ?? undefined,
    stateCode: city.stateCode ?? undefined,
    country: city.country ?? undefined,
    countryCode: city.countryCode ?? undefined,
    formatted: city.formatted ?? city.displayName ?? undefined,
    lat: typeof city.lat === 'string' ? parseFloat(city.lat) : city.lat,
    lng: typeof city.lng === 'string' ? parseFloat(city.lng) : city.lng,
    slug: city.slug ?? undefined,
  } : null;

  const links = raw.links ?? raw.socials ?? {};
  const safeLinks = {
    instagram: links.instagram ?? null,
    tiktok: links.tiktok ?? null,
    website: links.website ?? null,
    whatsapp: links.whatsapp ?? null,
    telegram: links.telegram ?? null,
    phone: links.phone ?? null,
    email: links.email ?? null,
    other: links.other ?? null,
  };

  const base = {
    uid: u.uid,
    displayName: raw.displayName ?? raw.name ?? undefined,
    role: raw.role ?? undefined, // Firestore rules restrict to ['client','master']
    services: raw.services ?? undefined,
    languages: raw.languages ?? undefined,
    city: safeCity,
    links: safeLinks,
    photoURL: raw.photoURL ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  // clean payload to avoid Firestore 400
  const payload = emptyStringsToNullDeep(pruneUndefinedDeep(base));

  const ref = doc(db, 'profiles', u.uid);
  console.groupCollapsed('[Profile Save]');
  console.log('docPath:', `profiles/${u.uid}`);
  console.log('payload:', payload);
  console.groupEnd();

  await setDoc(ref, payload, { merge: true });
}
