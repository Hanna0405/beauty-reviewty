'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchReviews } from '@/lib/reviews/fetchList';
import type { ReviewDoc } from '@/lib/reviews/types';
import { ReviewPhotos } from './ReviewPhotos';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

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
  if (!items.length) return <div className="p-6 text-center text-gray-500 rounded border">No reviews yet</div>;

  return (
    <div className="mt-4 space-y-3">
      {items.map((r) => (
        <div key={r.id} className="rv-fade-in border rounded-lg p-4 bg-white shadow-sm">
          {/* Author info + date */}
          <div className="flex items-center gap-3 mb-3">
            <ProfileAvatar user={r.author} size={36} className="border border-gray-200" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{r.author?.name || 'User'}</div>
              <div className="text-xs text-gray-500">
                {r.createdAtISO ? new Date(r.createdAtISO).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
              </div>
            </div>
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
          
          {/* Rating */}
          <div className="mb-2">
            <Stars value={r.rating} />
          </div>
          
          {/* Review text */}
          {r.text && <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-3">{r.text}</p>}
          
          {/* Photos */}
          <ReviewPhotos review={r} />
        </div>
      ))}
    </div>
  );
}
