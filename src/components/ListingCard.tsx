import Image from 'next/image';
import Link from 'next/link';
import { SafeText } from '@/lib/safeText';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
  listing: any; // expects { id, title, city, services, languages, photos?, rating? }
};

// Cache for profile lookups to avoid duplicate queries
const profileCache = new Map<string, string>();

async function resolveProfileDocId(listing: any): Promise<string | null> {
  // 1. If listing.profileId exists, use it
  if (listing.profileId) {
    return listing.profileId;
  }

  // 2. Try to find owner UID from various possible fields
  const ownerUid = listing.masterUid || listing.ownerUid || listing.authorUid || listing.userUid;
  if (!ownerUid) {
    return null;
  }

  // 3. Check cache first
  if (profileCache.has(ownerUid)) {
    return profileCache.get(ownerUid) || null;
  }

  try {
    // 4. Query profiles collection where uid == ownerUid
    const q = query(collection(db, 'profiles'), where('uid', '==', ownerUid));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      profileCache.set(ownerUid, ''); // Cache negative result
      return null;
    }

    const profileDocId = snap.docs[0].id;
    profileCache.set(ownerUid, profileDocId);
    return profileDocId;
  } catch (error) {
    console.error('Error resolving profile:', error);
    return null;
  }
}

export default function ListingCard({ listing }: Props) {
  const [profileDocId, setProfileDocId] = useState<string | null>(null);
  const cover = listing?.photos?.[0]?.url ?? null;

  useEffect(() => {
    resolveProfileDocId(listing).then(setProfileDocId);
  }, [listing]);

  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-neutral-100">
        {cover ? (
          <Image src={cover} alt={listing.title ?? 'Listing'} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium">{listing.title ?? 'Listing'}</h3>
          <Link href={`/listing/${String(listing.id)}`} className="text-sm underline">Open</Link>
        </div>
        <div className="text-sm text-gray-600"><SafeText value={listing.cityName ?? listing?.city?.name ?? listing?.city} /></div>
        <div className="mt-1 line-clamp-1 text-sm"><SafeText value={listing.serviceNames ?? listing?.services} /></div>
        <div className="text-xs text-gray-500"><SafeText value={listing.languageNames ?? listing?.languages} /></div>
        {typeof listing.rating === 'number' && <div className="text-xs">Rating: {listing.rating}★</div>}
        
        {/* Master Profile Link */}
        {profileDocId && (
          <div className="mt-2">
            <Link 
              href={`/profile/${profileDocId}`} 
              className="text-xs text-pink-600 hover:text-pink-800 underline"
            >
              View Master Profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
