"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authed"; user: User }
  | { status: "guest"; user: null };

export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setState({ status: "authed", user: u });
      else setState({ status: "guest", user: null });
    });
    return () => unsub();
  }, []);

  return state;
}
