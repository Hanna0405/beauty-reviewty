import { doc, deleteDoc } from 'firebase/firestore';
import { requireDb, requireAuth } from '@/lib/firebase/client';

export async function deleteListingById(listingId: string) {
  const { user } = await requireAuth(); // throws if not signed in
  const db = requireDb();
  // Optional: authorize owner; adapt if you store ownerId on doc.
  // If you need strict ownership check, fetch doc and compare ownerId === user.uid.

  await deleteDoc(doc(db, 'listings', listingId));
  return { ok: true };
}
