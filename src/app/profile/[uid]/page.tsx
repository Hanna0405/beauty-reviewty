'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export default function PublicProfilePage() {
 const params = useParams();
 const uid = params?.uid as string;
 const [profile, setProfile] = useState<any|null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function load() {
 if (!uid) return;
 try {
 const snap = await getDoc(doc(db, 'profiles', uid));
 setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
 } catch (error) {
 console.error('Error loading profile:', error);
 } finally {
 setLoading(false);
 }
 }
 load();
 }, [uid]);

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
 </div>
 );
}
