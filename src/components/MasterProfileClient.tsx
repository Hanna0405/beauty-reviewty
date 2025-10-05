'use client';
import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MasterProfile, Listing } from '@/types/models';
import { Chips } from './UiChips';
import MapPreview from './MapPreview';

type Props = { id: string };

function formatCity(p?: MasterProfile['city'], cityName?: string) {
  return p?.formatted || cityName || [p?.city, p?.stateCode, p?.countryCode].filter(Boolean).join(', ');
}

export default function MasterProfileClient({ id }: Props) {
  const [loading, setLoading] = useState(true);
  const [master, setMaster] = useState<MasterProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!db) throw new Error('Firestore "db" not initialized');

        // 1) try direct doc id in 'profiles' then 'masters'
        const tryCollections = ['profiles', 'masters'];
        let found: MasterProfile | null = null;
        for (const c of tryCollections) {
          const snap = await getDoc(doc(db, c, id));
          if (snap.exists()) {
            found = { id: snap.id, ...(snap.data() as any) };
            break;
          }
        }
        // 2) fallback by uid search
        if (!found) {
          for (const c of tryCollections) {
            const q = query(collection(db, c), where('uid','==', id), limit(1));
            const qs = await getDocs(q);
            if (!qs.empty) {
              const d = qs.docs[0];
              found = { id: d.id, ...(d.data() as any) };
              break;
            }
          }
        }
        if (!found) throw new Error('Master not found');

        // listings by ownerUid/profileUid
        const uid = (found as any).uid || found.id;
        const col = collection(db, 'listings');
        let q1 = query(col, where('ownerUid','==', uid), where('status','==','active'), orderBy('createdAt','desc'));
        let snap = await getDocs(q1);
        let items: Listing[] = [];
        if (!snap.empty) {
          items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        } else {
          const q2 = query(col, where('profileUid','==', uid), orderBy('createdAt','desc'));
          const s2 = await getDocs(q2);
          items = s2.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        }

        if (!cancelled) {
          setMaster(found);
          setListings(items);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load');
          setLoading(false);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading…</div>;
  if (error) return <div className="p-6 text-sm text-red-600">Error: {error}</div>;
  if (!master) return <div className="p-6 text-sm">Master not found</div>;

  const cityLabel = formatCity(master.city, master.cityName);
  const lat = master.city?.lat;
  const lng = master.city?.lng;
  const links = (master as any).links || (master as any).socials || {};
  const about = (master as any).about || (master as any).bio || (master as any).aboutMe || (master as any).description;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <a href="/masters" className="text-sm underline">&larr; Back to Masters</a>

      <div className="mt-4 rounded-xl border p-4 bg-white/60">
        <div className="flex items-center gap-4">
          {master.photoURL ? (
            <img src={master.photoURL} alt={master.displayName || master.nickname || 'Master'} className="h-20 w-20 rounded-full object-cover" />
          ) : (<div className="h-20 w-20 rounded-full bg-gray-200" />)}
          <div>
            <h1 className="text-xl font-semibold">{master.displayName || master.nickname || 'Master'}</h1>
            {cityLabel && <div className="text-sm text-gray-600">{cityLabel}</div>}
            {!!(master.services?.length) && <Chips items={master.services} />}
            {!!(master.languages?.length) && <Chips items={master.languages} />}
          </div>
        </div>

        {/* Contact buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {links.phone && <a href={`tel:${links.phone}`} className="rounded-lg border px-3 py-1.5 text-sm">Call</a>}
          {links.email && <a href={`mailto:${links.email}`} className="rounded-lg border px-3 py-1.5 text-sm">Email</a>}
          {links.whatsapp && <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-1.5 text-sm">WhatsApp</a>}
          {links.instagram && <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-1.5 text-sm">Instagram</a>}
          {links.website && <a href={links.website} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-1.5 text-sm">Website</a>}
        </div>
      </div>

      {about ? (
        <div className="mt-4 rounded-xl border bg-white/60 p-4">
          <div className="text-base font-semibold">About the master</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">{about}</p>
        </div>
      ) : null}

      {(lat != null && lng != null) ? (
        <div className="mt-4">
          <MapPreview lat={lat} lng={lng} />
          {cityLabel && <div className="mt-2 text-sm text-gray-600">{cityLabel}</div>}
        </div>
      ) : null}

      {/* Listings */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Listings</h2>
        {listings.length === 0 ? (
          <div className="mt-2 text-sm text-gray-600">No listings yet.</div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {listings.map((l) => (
              <li key={l.id} className="rounded-lg border p-3 bg-white/60">
                <div className="flex gap-3">
                  {l.photos?.[0] ? (
                    <img src={l.photos[0]} alt={l.title || 'Listing'} className="h-20 w-20 object-cover rounded" />
                  ) : (<div className="h-20 w-20 rounded bg-gray-200" />)}
                  <div className="flex-1">
                    <div className="font-medium">{l.title || 'Listing'}</div>
                    <div className="text-sm text-gray-600">{l.city?.formatted || l.cityName || ''}</div>
                    {typeof l.price === 'number' && <div className="text-sm mt-1">${l.price}</div>}
                    <a href={`/listing/${l.id}`} className="mt-2 inline-block text-sm underline">Open</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
