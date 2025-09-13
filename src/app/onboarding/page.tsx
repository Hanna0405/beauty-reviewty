"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { requireAuth, requireDb } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

type Role = 'client' | 'master';

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const auth = requireAuth();
      if (!auth.currentUser) router.replace('/auth/login');
    } catch (error) {
      router.replace('/auth/login');
    }
  }, [router]);

  const saveClient = async (uid: string) => {
    const db = requireDb();
    await setDoc(doc(db, 'users', uid), {
      uid,
      role: 'client',
      name,
      createdAt: serverTimestamp(),
    }, { merge: true });
    router.push('/');
  };

  const saveMaster = async (uid: string) => {
    // геокод
    const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoRes.ok) throw new Error(geoData.error || 'Geocode error');

    // users
    const db = requireDb();
    await setDoc(doc(db, 'users', uid), {
      uid,
      role: 'master',
      name,
      createdAt: serverTimestamp(),
    }, { merge: true });

    // masters
    await addDoc(collection(db, 'masters'), {
      ownerId: uid,
      role: 'master',
      name,
      bio,
      city,
      location: { lat: geoData.lat, lng: geoData.lng },
      createdAt: serverTimestamp(),
      ratingAvg: 0,
      reviewsCount: 0,
      services: [],
      photoUrls: [],
      priceMin: 0,
      priceMax: 0,
    });

    router.push('/masters');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = requireAuth();
    const uid = auth.currentUser?.uid;
    if (!uid || !role) return;

    setLoading(true);
    try {
      if (role === 'client') await saveClient(uid);
      else await saveMaster(uid);
    } catch (e: any) {
      alert(e.message ?? 'Onboarding error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-semibold mb-6">Welcome! Choose your role</h1>

      {/* шаг 1 — роль */}
      <div className="flex gap-3 mb-6">
        <button
          className={`px-3 py-2 rounded border ${role === 'client' ? 'bg-pink-600 text-white' : ''}`}
          onClick={() => setRole('client')}
        >
          I am a client
        </button>
        <button
          className={`px-3 py-2 rounded border ${role === 'master' ? 'bg-pink-600 text-white' : ''}`}
          onClick={() => setRole('master')}
        >
          I am a master
        </button>
      </div>

      {/* шаг 2 — форма */}
      {role && (
        <form onSubmit={onSubmit} className="space-y-4 max-w-md">
          <input
            className="w-full border p-2 rounded"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {role === 'master' && (
            <>
              <textarea
                className="w-full border p-2 rounded"
                placeholder="Short bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="City (e.g. Toronto)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      )}
    </main>
  );
}
