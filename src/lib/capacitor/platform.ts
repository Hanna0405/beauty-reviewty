import { Capacitor } from "@capacitor/core";

/** True when running inside the Capacitor iOS/Android native shell. */
export function isCapacitorNativePlatform(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/** True when running inside the Capacitor iOS native shell (not Android, not mobile Safari). */
export function isCapacitorIosNative(): boolean {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "ios"
  );
}
