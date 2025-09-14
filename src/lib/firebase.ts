// Re-export from client-only Firebase for compatibility
export { app, auth, db, storage, googleProvider } from './firebase-client';

// Compatibility exports for existing code
export const requireAuth = () => {
  const { auth } = require('./firebase-client');
  return auth;
};
export const requireDb = () => {
  const { db } = require('./firebase-client');
  return db;
};
export const requireStorage = () => {
  const { storage } = require('./firebase-client');
  return storage;
};
export const getClientAuth = () => {
  const { auth } = require('./firebase-client');
  return auth;
};
export const getStorageSafe = () => {
  const { storage } = require('./firebase-client');
  return storage;
};
export const isFirebaseReady = () => true;
export const firebaseStatus = () => ({ ready: true, missing: [] });