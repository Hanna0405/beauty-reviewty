"use client";

import { useEffect, useRef } from "react";
import type { Auth, UserCredential } from "firebase/auth";
import { getGoogleRedirectResultOnce } from "./googleSignIn";

/**
 * Completes Google sign-in when the app returns from signInWithRedirect.
 */
export function useGoogleRedirectResult(
  auth: Auth,
  onSuccess: (credential: UserCredential) => void | Promise<void>
) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    let active = true;

    (async () => {
      const credential = await getGoogleRedirectResultOnce(auth);
      if (!active || !credential?.user) return;
      handled.current = true;
      await onSuccessRef.current(credential);
    })();

    return () => {
      active = false;
    };
  }, [auth]);
}
