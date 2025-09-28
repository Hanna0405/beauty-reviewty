'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';

// Lazy import Firebase to prevent server-side execution
let auth: any = null;
const getAuth = async () => {
 if (typeof window === 'undefined') return null;
 if (!auth) {
   const { auth: firebaseAuth } = await import('@/lib/firebase.client');
   auth = firebaseAuth;
 }
 return auth;
};

export function useAuthUser() {
 const [user, setUser] = useState<User | null | undefined>(undefined);
 useEffect(() => {
 let unsub: (() => void) | undefined;
 let mounted = true;

 (async () => {
   const authInstance = await getAuth();
   if (!authInstance || !mounted) {
     if (mounted) setUser(null);
     return;
   }

   unsub = onAuthStateChanged(authInstance, (u) => {
     if (mounted) setUser(u);
   });
 })();

 return () => {
   mounted = false;
   if (unsub) unsub();
 };
 }, []);
 return { user, loading: user === undefined };
}