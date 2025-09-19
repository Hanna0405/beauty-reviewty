import { getAuth } from 'firebase/auth';

export async function authedJson(url: string, init?: RequestInit & { json?: any }) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first');

  const token = await user.getIdToken(); // this is valid on Firebase.User

  const headers = new Headers(init?.headers || {});
  headers.set('authorization', `Bearer ${token}`);
  headers.set('content-type', 'application/json');

  const res = await fetch(url, {
    ...init,
    method: init?.method || 'POST',
    headers,
    body: JSON.stringify(init?.json || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}
