"use client";

import React, {
 createContext,
 useContext,
 useEffect,
 useState,
 type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

type AuthContextValue = {
 user: User | null;
 loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const auth = getAuth(app);
 const unsub = onAuthStateChanged(auth, (u) => {
 setUser(u ?? null);
 setLoading(false);
 });
 return () => unsub();
 }, []);

 return (
 <AuthContext.Provider value={{ user, loading }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth(): AuthContextValue {
 const ctx = useContext(AuthContext);
 if (!ctx) {
 throw new Error("useAuth must be used within AuthProvider");
 }
 return ctx;
}
