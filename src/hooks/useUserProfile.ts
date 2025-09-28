// src/hooks/useUserProfile.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { db } from '@/lib/firebase.client';
import { doc, onSnapshot } from 'firebase/firestore';

type Role = 'master' | 'client' | 'admin';
export type UserProfile = {
 uid: string;
 email?: string;
 displayName?: string;
 role?: Role | { value?: Role; label?: string } | { type?: Role };
 [k: string]: any;
};

function normalizeRole(r: UserProfile['role']): Role | undefined {
 if (!r) return undefined;
 if (typeof r === 'string') return r as Role;
 // поддержим возможные предыдущие форматы
 if ('value' in r && r.value) return r.value as Role;
 if ('type' in r && r.type) return r.type as Role;
 if ('label' in r && r.label) return (r.label as string).toLowerCase() as Role;
 return undefined;
}

export function useUserProfile() {
 const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const unsubAuth = onAuthStateChanged(auth, (u) => {
 setFirebaseUser(u);
 if (!u) {
 setProfile(null);
 setLoading(false);
 return;
 }
 const ref = doc(db, 'users', u.uid);
 const unsubDoc = onSnapshot(
 ref,
 (snap) => {
 if (!snap.exists()) {
 console.warn('[useUserProfile] users doc not found for uid:', u.uid);
 setProfile({ uid: u.uid });
 } else {
 const data = snap.data() as UserProfile;
 setProfile({ uid: u.uid, ...data });
 }
 setLoading(false);
 },
 (err) => {
 console.error('[useUserProfile] onSnapshot error:', err);
 setLoading(false);
 }
 );
 return () => unsubDoc();
 });
 return () => unsubAuth();
 }, []);

 const role = useMemo(() => normalizeRole(profile?.role), [profile?.role]);

 return { user: firebaseUser, profile, role, loading };
}
