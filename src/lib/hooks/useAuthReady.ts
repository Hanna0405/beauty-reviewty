"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app } from "@/lib/firebase/client";

export function useAuthReady() {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitialized(true);
    });
    return () => unsub();
  }, []);

  return { 
    user, 
    initialized, 
    ready: initialized, 
    uid: user?.uid || null 
  };
}

