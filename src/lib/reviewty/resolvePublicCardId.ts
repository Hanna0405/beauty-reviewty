import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

/**
 * Returns Firestore docId for a public card.
 * If selectedCard already has .id — returns it directly.
 * Otherwise tries to resolve by slug/value/key.
 */
export async function resolvePublicCardId(selectedCard: any): Promise<string | null> {
  if (selectedCard?.id) return String(selectedCard.id);

  const slug = selectedCard?.slug ?? selectedCard?.value ?? selectedCard?.key;
  if (!slug) return null;

  const q = query(collection(db, 'publicCards'), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}
