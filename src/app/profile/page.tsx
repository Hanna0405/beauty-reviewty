'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
 const router = useRouter();
 const { user, logout } = useAuth();
 const [p, setP] = useState<any|null>(null);
 const [loading, setLoading] = useState(true);
 const [deleting, setDeleting] = useState(false);

 useEffect(() => {
 if (!user) {
 setP(null);
 setLoading(false);
 return;
 }
 const unsub = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
 setP(snap.exists() ? { id: snap.id, ...snap.data() } : null);
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
 <div className="text-gray-500">{p.city}</div>
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
 <div><span className="font-medium">Services:</span> {Array.isArray(p.services) && p.services.length ? p.services.join(', ') : '—'}</div>
 <div><span className="font-medium">Languages:</span> {Array.isArray(p.languages) && p.languages.length ? p.languages.join(', ') : '—'}</div>
 {p.instagram && <div><a className="text-pink-600 underline" href={p.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></div>}
 {p.tiktok && <div><a className="text-pink-600 underline" href={p.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></div>}
 {p.website && <div><a className="text-pink-600 underline" href={p.website} target="_blank" rel="noopener noreferrer">Website</a></div>}
 </div>
 </div>
 );
}