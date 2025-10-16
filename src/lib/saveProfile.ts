'use client';

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { pruneUndefinedDeep, emptyStringsToNullDeep } from '@/lib/objectClean';

const pick = <T = any>(v: T | undefined | null) =>
  v === '' || v === undefined || v === null ? undefined : (v as T);

export async function saveProfile(raw: any) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in');

  const ref = doc(db, 'profiles', u.uid);
  const snap = await getDoc(ref);
  const existing: any = snap.exists() ? snap.data() : {};

  const city = raw.city || raw.cityObj || null;
  const safeCity = city
    ? {
        city: pick(city.city) ?? pick(city.cityName),
        cityKey: pick(city.cityKey),
        state: pick(city.state),
        stateCode: pick(city.stateCode),
        country: pick(city.country),
        countryCode: pick(city.countryCode),
        formatted: pick(city.formatted) ?? pick(city.displayName),
        lat: typeof city.lat === 'string' ? parseFloat(city.lat) : city.lat,
        lng: typeof city.lng === 'string' ? parseFloat(city.lng) : city.lng,
        placeId: pick(city.placeId),
        slug: pick(city.slug),
      }
    : null;

  const links = raw.links || raw.socials || {};
  const safeLinks = {
    instagram: pick(links.instagram) ?? null,
    tiktok: pick(links.tiktok) ?? null,
    website: pick(links.website) ?? null,
    whatsapp: pick(links.whatsapp) ?? null,
    telegram: pick(links.telegram) ?? null,
    phone: pick(links.phone) ?? null,
    email: pick(links.email) ?? null,
    other: pick(links.other) ?? null,
  };

  const incomingPhotoURL =
    pick(raw.photoURL) || pick(raw.avatarUrl) || pick(raw.avatar?.url);

  // ✅ fallback: copy avatar.url into photoURL/avatarUrl if missing
  if (!raw?.photoURL && raw?.avatar?.url) raw.photoURL = raw.avatar.url;
  if (!raw?.avatarUrl && raw?.avatar?.url) raw.avatarUrl = raw.avatar.url;
  if (!raw?.avatarPath && raw?.avatar?.path) raw.avatarPath = raw.avatar.path;

  const incomingAvatarPath =
    pick(raw.avatarPath) || pick(raw.avatar?.path) || (incomingPhotoURL ? `profiles/${u.uid}/avatar.jpg` : undefined);

  // merge with existing, avoid overwriting with empty
  const photoURL =
    incomingPhotoURL ??
    existing.photoURL ??
    existing.avatarUrl ??
    existing?.avatar?.url ??
    undefined;

  const avatarPath =
    incomingAvatarPath ??
    existing.avatarPath ??
    existing?.avatar?.path ??
    undefined;

  const base = {
    uid: u.uid,
    displayName: pick(raw.displayName) ?? existing.displayName,
    role: pick(raw.role) ?? existing.role,
    services: pick(raw.services) ?? existing.services,
    languages: pick(raw.languages) ?? existing.languages,
    city: pick(raw.city) ?? existing.city ?? null,
    links: pick(raw.links) ?? existing.links ?? {},

    // keep all expected forms for avatar
    photoURL,
    avatarUrl: photoURL,
    avatarPath,
    avatar: {
      url: photoURL,
      path: avatarPath,
    },

    updatedAt: new Date().toISOString(),
  };

  // Normalize & write
  const payload = emptyStringsToNullDeep(pruneUndefinedDeep(base));
  
  console.log('[SaveProfile Input]', {
    photoURL: raw.photoURL,
    avatarUrl: raw.avatarUrl,
    avatar: raw.avatar,
  });
  
  await setDoc(ref, payload, { merge: true });

  console.log('[Profile Save] Avatar persisted:', { photoURL, avatarPath });
}
