'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { fetchThread } from '@/lib/reviews';
import { ThreadBlock } from '@/components/review/ThreadBlock';

export default function ThreadedReviewtyPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThreads() {
      setLoading(true);
      try {
        // Fetch public cards that have reviews
        const publicCardsQuery = query(
          collection(db, 'publicCards'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const publicCardsSnap = await getDocs(publicCardsQuery);
        const publicCards = publicCardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch threads for each public card
        const threadPromises = publicCards.map(async (card) => {
          const thread = await fetchThread(card.id);
          return thread;
        });

        const threadResults = await Promise.all(threadPromises);
        const validThreads = threadResults.filter(Boolean);
        
        setThreads(validThreads);
      } catch (error) {
        console.error('Error loading threads:', error);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, []);

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading threads...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Threaded Reviews</h1>
        <p className="text-gray-600">Reviews grouped by master</p>
      </header>

      <div className="space-y-6">
        {threads.map(thread => (
          <ThreadBlock key={thread.card.id} card={thread.card} reviews={thread.reviews} />
        ))}
      </div>

      {threads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No threaded reviews found
        </div>
      )}
    </div>
  );
}
