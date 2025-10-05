'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { renderServiceTag, renderLanguageTag } from '@/lib/tags';
import Link from 'next/link';

type Listing = any;

// Helper functions for safe rendering
function formatCity(city?: any): string {
  if (!city) return '';
  if (typeof city === 'string') return city;
  return (city.cityName || city.formatted || '').trim();
}

function formatTag(t: any): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return [t.emoji ?? '', t.name ?? ''].filter(Boolean).join(' ').trim();
}

function formatTagList(items?: any[], fallback?: any[]): string {
  const arr = Array.isArray(items) && items.length ? items : (Array.isArray(fallback) ? fallback : []);
  return arr.map(formatTag).filter(Boolean).join(', ');
}

// Fetch listings for profile using multiple possible owner fields
async function fetchListingsForProfile(profileId: string): Promise<Listing[]> {
  const candidates = [
    ['masterUid', profileId],
    ['ownerUid', profileId],
    ['authorUid', profileId],
    ['userUid', profileId],
    ['profileId', profileId],
  ];
  const results: Record<string, Listing> = {};
  for (const [field, value] of candidates) {
    try {
      const q = query(collection(db, 'listings'), where(field as any, '==', value));
      const snap = await getDocs(q);
      snap.forEach(d => { results[d.id] = { id: d.id, ...d.data() }; });
    } catch {}
  }
  return Object.values(results);
}

export default function PublicProfilePage() {
  const params = useParams();
  const uid = params?.uid as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<any|null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'profiles', uid));
        const profileData = snap.exists() ? { id: snap.id, uid: uid, ...snap.data() } : null;
        setProfile(profileData);
        
        // Load listings for this profile using universal search
        if (profileData) {
          try {
            const userListings = await fetchListingsForProfile(uid);
            setListings(userListings);
          } catch (error) {
            console.error('Error loading listings:', error);
            setListings([]);
          }
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
 <div className="text-gray-500">{formatCity(profile.city)}</div>
 </div>
 </div>

 <div className="space-y-2">
 <div><span className="font-medium">Services:</span> {formatTagList(profile.services, profile.serviceNames) || '—'}</div>
 <div><span className="font-medium">Languages:</span> {formatTagList(profile.languages, profile.languageNames) || '—'}</div>
 {profile.instagram && <div><a className="text-pink-600 underline" href={profile.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></div>}
 {profile.tiktok && <div><a className="text-pink-600 underline" href={profile.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></div>}
 {profile.website && <div><a className="text-pink-600 underline" href={profile.website} target="_blank" rel="noopener noreferrer">Website</a></div>}
 </div>

 {/* Listings Section */}
 {listings.length > 0 && (
 <section className="mt-6">
 <h2 className="text-lg font-semibold mb-4">My Listings</h2>
 <div className="grid gap-4 md:grid-cols-2">
 {listings.map((listing) => (
 <Link key={listing.id} href={`/listing/${listing.id}`} className="block">
 <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
 <h4 className="font-medium text-gray-900">{listing.title || 'Untitled Listing'}</h4>
 <p className="text-sm text-gray-600 mt-1">{listing.description || 'No description'}</p>
 {listing.price && (
 <p className="text-sm font-medium text-pink-600 mt-2">${listing.price}</p>
 )}
 </div>
 </Link>
 ))}
 </div>
 </section>
 )}
 </div>
 );
}
