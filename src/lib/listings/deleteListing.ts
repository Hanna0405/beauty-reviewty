import { doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';

export async function deleteListingById(listingId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  // we already imported ready-to-use db
  // just use db

  // Optional: authorize owner; adapt if you store ownerId on doc.
  // If you need strict ownership check, fetch doc and compare ownerId === user.uid.

  await deleteDoc(doc(db, 'listings', listingId));
  return { ok: true };
}
