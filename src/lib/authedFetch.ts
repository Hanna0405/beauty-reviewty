import { getAuth } from 'firebase/auth';
import { app } from './firebase.client';

export async function getAuthIdToken(): Promise<string> {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
}

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getAuthIdToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export type AuthedJson<T> = { ok: true; data: T } | { ok: false; error: string };

export async function authFromRequest(_req?: Request): Promise<string|null> {
 try {
 const auth = getAuth(app);
 const user = auth.currentUser;
 return user?.uid ?? null;
 } catch { return null; }
}
