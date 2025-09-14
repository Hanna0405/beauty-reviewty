"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { createContext, useContext, useEffect, useState } from "react";

type Role = "master" | "client" | "admin";
type AppUser = { uid: string; email: string | null };
type UserProfile = {
 displayName?: string;
 role?: Role;
 avatarUrl?: string | null;
 city?: string;
 services?: string[];
 languages?: string[];
};

type Ctx = {
 user: AppUser | null;
 profile: UserProfile | null;
 role: Role;
 loading: boolean;
 logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
 user: null,
 profile: null,
 role: "client",
 loading: true,
 logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = useState<AppUser | null>(null);
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [role, setRole] = useState<Role>("client");
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const unsub = onAuthStateChanged(auth, async (fbUser) => {
 setLoading(true);
 try {
 if (!fbUser) {
 setUser(null);
 setProfile(null);
 setRole("client");
 return;
 }
 const u: AppUser = { uid: fbUser.uid, email: fbUser.email };
 setUser(u);
 const snap = await getDoc(doc(db, "users", fbUser.uid));
 if (snap.exists()) {
 const data = snap.data() as UserProfile;
 setProfile(data);
 setRole((data.role as Role) || "client");
 } else {
 setProfile(null);
 setRole("client");
 }
 } catch {
 setProfile(null);
 setRole("client");
 } finally {
 setLoading(false);
 }
 });
 return () => unsub();
 }, []);

 async function logout() {
 await signOut(auth);
 }

 return (
 <AuthContext.Provider value={{ user, profile, role, loading, logout }}>
 {children}
 </AuthContext.Provider>
 );
}

export const useAuth = () => useContext(AuthContext);