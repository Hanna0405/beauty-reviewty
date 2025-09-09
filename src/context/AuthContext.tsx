'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole } from '@/types';

type AuthState = {
user: User | null;
role: UserRole | null;
loading: boolean;
};

const AuthCtx = createContext<AuthState>({ user: null, role: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
const [state, setState] = useState<AuthState>({ user: null, role: null, loading: true });

useEffect(() => {
if (!auth) {
  setState({ user: null, role: null, loading: false });
  return;
}

const unsub = onAuthStateChanged(auth, async (u) => {
if (!u) {
setState({ user: null, role: null, loading: false });
return;
}
let role: UserRole | null = null;
try {
if (db) {
  const snap = await getDoc(doc(db, 'users', u.uid));
  if (snap.exists()) role = (snap.data().role as UserRole) ?? null;
}
} catch {}
setState({ user: u, role, loading: false });
});
return () => unsub();
}, []);

return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
return useContext(AuthCtx);
}