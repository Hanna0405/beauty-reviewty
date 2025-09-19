'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { fetchListingsByMasterUid, type Listing } from '@/lib/data/listings';
import { useAuth } from '@/contexts/AuthContext';
import { renderServiceTag, renderLanguageTag } from '@/lib/tags';

export default function PublicProfilePage() {
  const params = useParams();
  const uid = params?.uid as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<any|null>(null);
  const [masterListings, setMasterListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'profiles', uid));
        const profileData = snap.exists() ? { id: snap.id, uid: uid, ...snap.data() } : null;
        setProfile(profileData);
        
        // Load master's listings if profile exists
        if (profileData) {
          const isOwner = user?.uid && profileData?.uid && user.uid === profileData.uid;
          const listings = await fetchListingsByMasterUid(uid, { includeDrafts: !!isOwner });
          setMasterListings(listings);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid, user?.uid]);

 if (loading) return <div className="p-6 text-center">Loading...</div>;
 if (!profile) return <div className="p-6 text-center text-gray-500">Profile not found</div>;

 return (
 <div className="max-w-3xl mx-auto p-6 space-y-6">
 <div className="flex items-center gap-4">
 {profile.avatarUrl ? (
 <Image src={profile.avatarUrl} alt={profile.displayName || 'Avatar'} width={80} height={80} className="rounded-full object-cover h-20 w-20" />
 ) : (
 <div className="h-20 w-20 rounded-full bg-pink-500 text-white flex items-center justify-center text-2xl">
 {(profile.displayName?.[0] ?? 'M').toUpperCase()}
 </div>
 )}
 <div>
 <div className="text-2xl font-semibold">{profile.displayName || 'Unnamed'}</div>
 <div className="text-gray-500">{profile.city}</div>
 </div>
 </div>

 <div className="space-y-2">
 <div><span className="font-medium">Services:</span> {Array.isArray(profile.services) && profile.services.length ? profile.services.join(', ') : '—'}</div>
 <div><span className="font-medium">Languages:</span> {Array.isArray(profile.languages) && profile.languages.length ? profile.languages.join(', ') : '—'}</div>
 {profile.instagram && <div><a className="text-pink-600 underline" href={profile.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></div>}
 {profile.tiktok && <div><a className="text-pink-600 underline" href={profile.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></div>}
 {profile.website && <div><a className="text-pink-600 underline" href={profile.website} target="_blank" rel="noopener noreferrer">Website</a></div>}
 </div>

 {/* Listings Section */}
 <section className="mt-6">
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-lg font-semibold">Listings</h2>
 <a className="link" href={`/masters?view=listings&master=${profile.id}`}>View all</a>
 </div>
 {masterListings.length === 0 ? (
 <div className="text-gray-500">No active listings yet.</div>
 ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {masterListings.map((listing) => (
        <div key={listing.id} className="card bg-base-100 border">
          <figure className="aspect-video overflow-hidden">
            <img src={listing.photos?.[0]?.url ?? "/placeholder.jpg"} alt={listing.title ?? "Listing"} className="w-full h-full object-cover" />
          </figure>
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <h3 className="card-title text-base">{listing.title ?? "Listing"}</h3>
              {!listing.isActive && user?.uid === profile.uid && <span className="badge badge-ghost text-xs">draft</span>}
            </div>
            <div className="text-sm opacity-70">
              {profile.city ?? ""} {listing.priceFrom ? ` • from $${listing.priceFrom}` : ""}
            </div>
            
            {/* Service Tags */}
            {Array.isArray(listing.services) && listing.services.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {listing.services.slice(0, 3).map((s: string) => (
                  <span key={s} className="badge badge-sm">{renderServiceTag(s)}</span>
                ))}
                {listing.services.length > 3 && (
                  <span className="badge badge-sm badge-ghost">+{listing.services.length - 3}</span>
                )}
              </div>
            )}

            {/* Language Tags */}
            {Array.isArray(listing.languages) && listing.languages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {listing.languages.slice(0, 3).map((l: string) => (
                  <span key={l} className="badge badge-sm badge-outline">{renderLanguageTag(l)}</span>
                ))}
              </div>
            )}
            
            <div className="card-actions mt-3">
              <a className="btn btn-sm btn-outline" href={`/masters/${String(listing.id)}`}>View</a>
            </div>
          </div>
        </div>
      ))}
    </div>
 )}
 </section>
 </div>
 );
}
