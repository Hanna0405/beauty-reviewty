// Compatibility layer for old firebase-client imports
import { requireAuth } from './firebase/client';

export const getFirebaseClientAuth = () => requireAuth();
