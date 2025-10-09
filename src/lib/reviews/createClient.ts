import { getAuth } from 'firebase/auth';
import type { ReviewPhoto, ReviewSubject } from './types';

// Re-export types for convenience
export type { ReviewPhoto, ReviewSubject } from './types';

export async function createReviewViaApi(input: {
  subject: ReviewSubject;
  rating: number;
  text?: string;
  photos?: ReviewPhoto[];
}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in');
  const token = await user.getIdToken();

  const res = await fetch('/api/reviews/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Failed to submit review (${res.status})`);
  }
  return data; // { ok: true, id, updated? }
}

