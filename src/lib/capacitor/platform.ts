import { Capacitor } from "@capacitor/core";

/** True when running inside the Capacitor iOS/Android native shell. */
export function isCapacitorNativePlatform(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}
