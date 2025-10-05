'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

type Listing = any;

async function fetchListingsForProfile(db: any, profileId: string): Promise<Listing[]> {
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

function TagsLine({ title, items, fallbackItems }:{
 title: string;
 items?: any[];
 fallbackItems?: any[];
}) {
 const formatted = formatTagList(items, fallbackItems);
 if (!formatted) return null;
 return (
 <p>
 <strong>{title}: </strong>
 {formatted}
 </p>
 );
}

export default function ProfilePage() {
 const router = useRouter();
 const { user, logout } = useAuth();
 const [p, setP] = useState<any|null>(null);
 const [listings, setListings] = useState<Listing[]>([]);
 const [loading, setLoading] = useState(true);
 const [deleting, setDeleting] = useState(false);

 useEffect(() => {
 if (!user) {
 setP(null);
 setLoading(false);
 return;
 }
 const unsub = onSnapshot(doc(db, 'profiles', user.uid), async (snap) => {
   const profileData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
   setP(profileData);
   
   // Load listings for this profile
   if (profileData && db) {
     try {
       const userListings = await fetchListingsForProfile(db, user.uid);
       setListings(userListings);
     } catch (error) {
       console.error('Error loading listings:', error);
       setListings([]);
     }
   } else {
     setListings([]);
   }
   
   setLoading(false);
 });
 return () => unsub();
 }, [user]);

 async function deleteFromStorageByPath(path: string) {
 const res = await fetch('/api/delete-file', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ path })
 });
 if (!res.ok) throw new Error('Failed to delete file from storage');
 }

 async function handleDelete(includeListings: boolean) {
 if (!user) return;
 const yes = window.confirm(includeListings
 ? 'Delete your profile and ALL your listings? This cannot be undone.'
 : 'Delete your profile? This cannot be undone.');
 if (!yes) return;

 try {
 setDeleting(true);

 // 1) Delete avatar in Storage by path (unified pattern)
 if (p?.avatarPath) {
 await deleteFromStorageByPath(p.avatarPath);
 }

 // 2) Optionally delete all listings of this user (by ownerId)
 if (includeListings) {
 const q = query(collection(db, 'listings'), where('ownerId', '==', user.uid));
 const snap = await getDocs(q);
 const batch = writeBatch(db);
 snap.forEach((d) => batch.delete(d.ref));
 await batch.commit();
 }

 // 3) Delete the profile document
 await deleteDoc(doc(db, 'profiles', user.uid));

 // 4) Sign out and go home
 await logout();
 router.replace('/');

 } catch (err) {
 console.error('[Profile] delete failed', err);
 alert('Failed to delete profile. Please try again.');
 } finally {
 setDeleting(false);
 }
 }

 if (loading) return <div className="p-6">Loading...</div>;
 if (!user) return <div className="p-6">Please log in</div>;
 if (!p) return <div className="p-6">No profile yet. <a href="/profile/edit" className="text-pink-600 underline">Create now</a></div>;

 return (
 <div className="max-w-3xl mx-auto p-6 space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 {p.avatarUrl ? (
 <Image src={p.avatarUrl} alt={p.displayName || 'Avatar'} width={80} height={80} className="rounded-full object-cover h-20 w-20" />
 ) : (
 <div className="h-20 w-20 rounded-full bg-pink-500 text-white flex items-center justify-center text-2xl">
 {(p.displayName?.[0] ?? user.email?.[0] ?? 'M').toUpperCase()}
 </div>
 )}
 <div>
 <div className="text-2xl font-semibold">{p.displayName || 'Unnamed'}</div>
 <div className="text-gray-500">{formatCity(p.city)}</div>
 </div>
 </div>
 <div className="flex gap-2">
 {/* View (public) */}
 <Link
 href={`/profile/${user.uid}`}
 className="px-4 py-2 rounded-lg border hover:bg-gray-50"
 >
 View
 </Link>

 {/* Edit */}
 <Link
 href="/profile/edit"
 className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
 >
 Edit
 </Link>

 {/* Delete */}
 <button
 disabled={deleting}
 onClick={() => handleDelete(/* includeListings */ true)}
 className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
 title="Delete profile and all your listings"
 >
 {deleting ? 'Deleting…' : 'Delete'}
 </button>
 </div>
 </div>

 <div className="space-y-2">
 <TagsLine title="Services" items={p.services} fallbackItems={p.serviceNames} />
 <TagsLine title="Languages" items={p.languages} fallbackItems={p.languageNames} />
 {p.instagram && <div><a className="text-pink-600 underline" href={p.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></div>}
 {p.tiktok && <div><a className="text-pink-600 underline" href={p.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></div>}
 {p.website && <div><a className="text-pink-600 underline" href={p.website} target="_blank" rel="noopener noreferrer">Website</a></div>}
 </div>

 {/* Listings Section */}
 {listings.length > 0 && (
 <div className="mt-6">
 <h3 className="text-lg font-semibold mb-4">My Listings</h3>
 <div className="grid gap-4 md:grid-cols-2">
 {listings.map((listing) => (
 <Link key={listing.id} href={`/listing/${listing.id}`} className="block rounded-lg border border-gray-200 bg-white/60 px-4 py-3 hover:bg-white shadow-sm transition">
 <div className="flex items-center justify-between">
 <div>
 <div className="font-medium text-gray-900">{listing.title || 'Untitled Listing'}</div>
 <div className="text-sm text-gray-500 mt-1">{listing.description || 'No description'}</div>
 {listing.price && (
 <div className="text-sm font-medium text-pink-600 mt-1">${listing.price}</div>
 )}
 </div>
 <span aria-hidden className="text-gray-400">→</span>
 </div>
 </Link>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}