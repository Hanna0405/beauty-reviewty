// Compatibility layer for old imports
// This file provides backward compatibility for existing imports
// while redirecting to the new client modules ONLY
// DO NOT import admin modules here as they will be pulled into client bundles

import { auth, db, storage, requireAuth, requireDb, requireStorage } from './firebase/client';
import { GoogleAuthProvider } from 'firebase/auth';

// Re-export safe client instances (null on server, initialized on client)
export { auth, db, storage };

// Re-export helper functions for client components
export { requireAuth, requireDb, requireStorage };

// Legacy compatibility exports for old function-based imports
export const clientAuth = () => requireAuth();
export const clientDb = () => requireDb();
export const clientStorage = () => requireStorage();
export const getClientAuth = () => requireAuth();
export const getStorageSafe = () => requireStorage();

// Legacy compatibility exports
export const isFirebaseReady = () => {
  return typeof window !== 'undefined' && auth !== null;
};

export const firebaseStatus = () => ({
  ready: isFirebaseReady(),
  missing: null as string | null,
  error: null as string | null,
});

// Google provider for auth (only create on client)
export const googleProvider = typeof window !== 'undefined' ? new GoogleAuthProvider() : null;
