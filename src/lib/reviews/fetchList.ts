import type { ReviewDoc } from './types';

export async function fetchReviews(subject: { type: 'master'|'listing'; id: string }): Promise<ReviewDoc[]> {
  const params = new URLSearchParams({ type: subject.type, id: subject.id });
  const res = await fetch(`/api/reviews/list?${params.toString()}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load reviews');
  return (data.items || []) as ReviewDoc[];
}

