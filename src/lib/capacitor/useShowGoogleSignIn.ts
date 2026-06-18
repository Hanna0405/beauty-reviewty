"use client";

import { useEffect, useState } from "react";

import { isCapacitorIosNative } from "./platform";

/**
 * Whether third-party Google Sign-In UI should render.
 * Hidden on Capacitor iOS (App Store Guideline 4.8); visible elsewhere after mount.
 */
export function useShowGoogleSignIn(): boolean {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    setShow(!isCapacitorIosNative());
  }, []);

  return show === true;
}
