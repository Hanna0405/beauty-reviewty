"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuthUser() {
 const [user, setUser] = useState<User | null | undefined>(undefined);
 useEffect(() => {
 const off = onAuthStateChanged(auth, (u) => setUser(u));
 return () => off();
 }, []);
 return { user, loading: user === undefined };
}
