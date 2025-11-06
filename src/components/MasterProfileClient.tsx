"use client";
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { db } from "@/lib/firebase";
import type { MasterProfile, Listing } from "@/types/models";
import { Chips } from "./UiChips";
import MapPreview from "./MapPreview";
import PublicListingCard from "@/app/master/PublicListingCard";

type Props = { id: string };

type Profile = {
  id: string;
  userId?: string;
  uid?: string;
  ownerId?: string;
  userUID?: string;
  // ...other profile fields you already render
};

function formatCity(p?: MasterProfile["city"], cityName?: string) {
  return (
    p?.formatted ||
    cityName ||
    [p?.city, p?.stateCode, p?.countryCode].filter(Boolean).join(", ")
  );
}

// Try multiple common fields to find a cover
function pickRawCover(candidate: any): string | null {
  if (!candidate) return null;

  // Direct string
  if (typeof candidate === "string" && candidate.length > 0) return candidate;

  // Common objects / arrays in this codebase
  const fromFields = [
    candidate.coverUrl,
    candidate.cover?.url,
    candidate.imageUrl,
    candidate.image?.url,
    candidate.photoUrl,
    candidate.photo?.url,
    Array.isArray(candidate.imageUrls) && candidate.imageUrls[0],
    Array.isArray(candidate.images) && candidate.images[0]?.url,
    Array.isArray(candidate.photos) &&
      (typeof candidate.photos[0] === "string"
        ? candidate.photos[0]
        : candidate.photos[0]?.url),
    Array.isArray(candidate.gallery) && candidate.gallery[0]?.url,
  ].filter(Boolean) as string[];

  return fromFields.length ? fromFields[0] : null;
}

/**
 * Resolves a public https URL for a listing cover:
 * - If it already looks like a public URL (http/https), return as-is.
 * - If it looks like a Firebase Storage path (gs:// or no protocol), use getDownloadURL.
 * - Otherwise return null.
 */
async function resolveCoverUrl(listing: any): Promise<string | null> {
  const raw = pickRawCover(listing);
  if (!raw) return null;

  // already a public URL
  if (typeof raw === "string" && /^https?:\/\//i.test(raw)) return raw;

  // Firebase Storage ref (gs://bucket/path or plain path)
  try {
    const storage = getStorage();
    const storageRef = raw.startsWith("gs://")
      ? ref(storage, raw)
      : ref(storage, raw);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch {
    return null;
  }
}

async function fetchListingsForMaster(
  masterUidOrNull: string | null,
  profileId: string
) {
  // Try several linkage keys commonly used in this codebase.
  const linkKeys = ["ownerId", "userId", "uid", "userUID"] as const;

  // If we already have a uid, try those keys first.
  if (masterUidOrNull) {
    for (const key of linkKeys) {
      try {
        const q1 = query(
          collection(db, "listings"),
          where(key as any, "==", masterUidOrNull)
        );
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          return snap1.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Listing[];
        }
      } catch {
        // ignore and keep trying the next key
      }
    }
  }

  // Fallback: some projects store a reverse link to the profile document id.
  try {
    const q2 = query(
      collection(db, "listings"),
      where("profileId", "==", profileId)
    );
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      return snap2.docs.map((d) => ({ id: d.id, ...d.data() })) as Listing[];
    }
  } catch {
    // ignore
  }

  // Final: nothing found
  return [] as Listing[];
}

export default function MasterProfileClient({ id }: Props) {
  const [loading, setLoading] = useState(true);
  const [master, setMaster] = useState<MasterProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (!db) throw new Error('Firestore "db" not initialized');

        // 1) Load the master profile by URL id
        const tryCollections = ["profiles", "masters"];
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
            const q = query(
              collection(db, c),
              where("uid", "==", id),
              limit(1)
            );
            const qs = await getDocs(q);
            if (!qs.empty) {
              const d = qs.docs[0];
              found = { id: d.id, ...(d.data() as any) };
              break;
            }
          }
        }

        if (!found) throw new Error("Master not found");
        if (cancelled) return;
        setMaster(found);

        // 3) Resolve potential owner uid from profile
        const ownerUid =
          (found as any).uid ||
          (found as any).userId ||
          (found as any).ownerId ||
          (found as any).userUID ||
          found.id;

        // 4) Load listings with robust linkage strategy
        const rawListings = await fetchListingsForMaster(ownerUid, id);
        if (cancelled) return;

        // Resolve cover URLs in parallel, but keep everything else untouched
        const items = await Promise.all(
          rawListings.map(async (it) => {
            const url = await resolveCoverUrl(it);
            return { ...it, _coverUrl: url ?? null };
          })
        );

        setListings(items);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load master");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading…</div>;
  if (error)
    return <div className="p-6 text-sm text-red-600">Error: {error}</div>;
  if (!master) return <div className="p-6 text-sm">Master not found</div>;

  const cityLabel = formatCity(master.city, master.cityName);
  const lat = master.city?.lat;
  const lng = master.city?.lng;
  const links = (master as any).links || (master as any).socials || {};
  const about =
    (master as any).about ||
    (master as any).bio ||
    (master as any).aboutMe ||
    (master as any).description;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <a href="/masters" className="text-sm underline">
        &larr; Back to Masters
      </a>

      <div className="mt-4 rounded-xl border p-4 bg-white/60">
        <div className="flex items-center gap-4">
          {(() => {
            const avatar =
              master.avatarUrl ||
              master.photoURL ||
              master.imageUrl ||
              master.imageURL ||
              master.image ||
              "";
            return avatar ? (
              <img
                src={avatar}
                alt={master.displayName || master.nickname || "Master"}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
            );
          })()}
          <div>
            <h1 className="text-xl font-semibold">
              {master.displayName || master.nickname || "Master"}
            </h1>
            {cityLabel && (
              <div className="text-sm text-gray-600">{cityLabel}</div>
            )}
            {!!master.services?.length && <Chips items={master.services} />}
            {!!master.languages?.length && <Chips items={master.languages} />}
          </div>
        </div>

        {/* Contact buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {links.phone && (
            <a
              href={`tel:${links.phone}`}
              className="rounded-lg border px-3 py-1.5 text-sm"
            >
              Call
            </a>
          )}
          {links.email && (
            <a
              href={`mailto:${links.email}`}
              className="rounded-lg border px-3 py-1.5 text-sm"
            >
              Email
            </a>
          )}
          {links.whatsapp && (
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-sm"
            >
              WhatsApp
            </a>
          )}
          {links.instagram && (
            <a
              href={links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-sm"
            >
              Instagram
            </a>
          )}
          {links.website && (
            <a
              href={links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-sm"
            >
              Website
            </a>
          )}
        </div>
      </div>

      {about ? (
        <div className="mt-4 rounded-xl border bg-white/60 p-4">
          <div className="text-base font-semibold">About the master</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
            {about}
          </p>
        </div>
      ) : null}

      {lat != null && lng != null ? (
        <div className="mt-4">
          <MapPreview lat={lat} lng={lng} />
          {cityLabel && (
            <div className="mt-2 text-sm text-gray-600">{cityLabel}</div>
          )}
        </div>
      ) : null}

      {/* Listings */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Listings</h2>

        {loading && (
          <p className="mt-2 text-sm opacity-80">Loading listings…</p>
        )}

        {!loading && error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && listings.length === 0 && (
          <p className="mt-2 text-sm opacity-80">No listings yet.</p>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((lst: any) => (
              <PublicListingCard key={lst.id} listing={lst} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
