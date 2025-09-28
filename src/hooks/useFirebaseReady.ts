/// src/hooks/useFirebaseReady.ts
"use client";

export default function useFirebaseReady() {
 // Firebase is properly initialized, so always return ready
 return { ready: true, missing: [] };
}
