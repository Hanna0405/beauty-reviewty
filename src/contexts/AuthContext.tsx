'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';

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

type AuthContextType = {
 user: User | null;
 loading: boolean;
 logout: () => Promise<void>;
 profile?: any; // For backward compatibility
 role?: string; // For backward compatibility
};

const AuthContext = createContext<AuthContextType>({
 user: null,
 loading: true,
 logout: async () => {},
 profile: undefined,
 role: undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let unsub: (() => void) | undefined;
 let mounted = true;

 (async () => {
   const authInstance = await getAuth();
   if (!authInstance || !mounted) {
     if (mounted) setLoading(false);
     return;
   }

   unsub = onAuthStateChanged(authInstance, (u) => {
     if (mounted) {
       setUser(u);
       setLoading(false);
     }
   });
 })();

 return () => {
   mounted = false;
   if (unsub) unsub();
 };
 }, []);

 const logout = async () => {
 const authInstance = await getAuth();
 if (authInstance) {
   await signOut(authInstance);
 }
 };

 return (
 <AuthContext.Provider value={{ user, loading, logout, profile: undefined, role: undefined }}>
 {children}
 </AuthContext.Provider>
 );
}

export const useAuth = () => useContext(AuthContext);