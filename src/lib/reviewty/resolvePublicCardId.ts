import { getAdminDb } from '@/lib/firebaseAdmins';

/**
 * Returns Firestore docId for a public card.
 * If selectedCard already has .id — returns it directly.
 * Otherwise tries to resolve by slug/value/key.
 */
export async function resolvePublicCardId(selectedCard: any): Promise<string | null> {
  if (selectedCard?.id) return String(selectedCard.id);

  const slug = selectedCard?.slug ?? selectedCard?.value ?? selectedCard?.key;
  if (!slug) return null;

  const db = getAdminDb();
  const snap = await db.collection('publicCards').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}
