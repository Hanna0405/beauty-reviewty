'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchReviews } from '@/lib/reviews/fetchList';
import type { ReviewDoc } from '@/lib/reviews/types';

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} aria-hidden className={i <= value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      ))}
      <span className="sr-only">{value} of 5</span>
    </div>
  );
}

interface ReviewListProps {
  subjectType: 'master' | 'listing';
  subjectId: string;
}

export function ReviewList({ subjectType, subjectId }: ReviewListProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);

  if (!subjectId || typeof subjectId !== 'string') {
    return <p className="text-sm text-muted-foreground">No reviews yet</p>;
  }

  async function loadReviews() {
    try {
      setLoading(true);
      const reviews = await fetchReviews({ type: subjectType, id: subjectId });
      setItems(reviews);
    } catch (e: any) {
      console.error('[ReviewList] load failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [subjectType, subjectId]);

  if (loading) return <div className="py-8 text-center text-sm text-gray-500">Loading reviews...</div>;
  if (!items.length) return <p className="text-sm text-gray-500">No reviews yet</p>;

  return (
    <div className="mt-4 space-y-4">
      <ul className="divide-y rounded border">
        {items.map((r) => (
          <li key={r.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                </span>
                {user?.uid === r.authorUid && (
                  <button
                    onClick={async () => {
                      if (confirm('Delete this review?')) {
                        const { deleteDoc, doc } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase');
                        await deleteDoc(doc(db, 'reviews', r.id));
                        loadReviews();
                      }
                    }}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            {r.text && <p className="text-gray-800 whitespace-pre-wrap">{r.text}</p>}
            
            {!!r.photos?.length && (
              <div className="flex gap-2 flex-wrap">
                {r.photos.map((p: any, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.path ?? p.url ?? i}
                    src={p.url}
                    alt={`review photo ${i+1}`}
                    className="h-24 w-24 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
