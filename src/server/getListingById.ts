import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // your client Firestore init; if you have server Admin, you can swap later

export async function getListingById(id: string) {
  // In App Router server components you should use Admin; but to keep it simple and non-breaking, we can fetch on client side too.
  // Provide a minimal wrapper; pages below will fetch on client if needed.
  return { id }; // placeholder for type only; actual client fetch is done in the page
}
