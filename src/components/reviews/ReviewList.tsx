'use client';
import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase.client';

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
  const [items, setItems] = useState<any[]>([]);

  if (!subjectId || typeof subjectId !== 'string') {
    return <p className="text-sm text-muted-foreground">No reviews yet</p>;
  }

  useEffect(() => {
    const colRef = subjectType === 'master'
      ? collection(doc(db, 'masters', subjectId), 'reviews')
      : collection(db, 'reviews');
    
    const q = subjectType === 'master' 
      ? query(colRef, orderBy('createdAt', 'desc'))
      : query(colRef, where('listingId', '==', subjectId), where('isPublic', '==', true));

    return onSnapshot(q, (snap) => {
      const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(reviews);
    });
  }, [subjectType, subjectId]);

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
                  {r.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </span>
                {user?.uid === (r.authorUid || r.authorId) && (
                  <button
                    onClick={async () => {
                      if (confirm('Delete this review?')) {
                        const { deleteDoc, doc } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase');
                        
                        if (subjectType === 'master') {
                          await deleteDoc(doc(db, 'masters', subjectId, 'reviews', r.id));
                        } else {
                          await deleteDoc(doc(db, 'reviews', r.id));
                        }
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
