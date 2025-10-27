"use client";

import { useEffect, useState } from "react";
import { firebaseApp } from "@/lib/firebase.client";
import { getAuth, type Auth, signInWithEmailAndPassword } from "firebase/auth";

/**
 * Hook for safely initializing Firebase Auth on client side.
 * Handles cases where FirebaseApp is not yet ready or
 * where network requests fail temporarily (common on localhost).
 */
export function useFirebaseAuth() {
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!firebaseApp) return;

    // Small retry loop in case network or SDK not ready yet
    const tryInit = () => {
      try {
        const a = getAuth(firebaseApp);
        setAuth(a);
      } catch (err) {
        console.warn("[useFirebaseAuth] Auth init failed, retrying...", err);
        if (retryCount < 3) {
          setTimeout(() => setRetryCount((c) => c + 1), 500);
        }
      }
    };

    tryInit();
  }, [mounted, firebaseApp, retryCount]);

  return auth;
}

/**
 * Helper for email/password login with safe error messages.
 */
export async function emailPasswordLogin(
  auth: Auth | null,
  email: string,
  password: string
) {
  if (!auth) {
    throw new Error("Auth not ready yet. Please wait a moment.");
  }

  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err: any) {
    // More user-friendly errors
    if (err.code === "auth/network-request-failed") {
      throw new Error(
        "Network error: please check your internet connection or reload the page."
      );
    }
    if (
      err.code === "auth/invalid-credential" ||
      err.code === "auth/wrong-password"
    ) {
      throw new Error("Invalid email or password.");
    }
    if (err.code === "auth/user-not-found") {
      throw new Error("No user found with this email.");
    }
    throw err;
  }
}
