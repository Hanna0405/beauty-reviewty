import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MasterProfile, Listing } from '@/types/models';

function assertDbReady() {
  if (!db) throw new Error('Firestore "db" not initialized – check /lib/firebase.ts and env.');
}

const PROFILE_COLLECTIONS = ['profiles', 'masters']; // try both

export async function getMasterById(idOrUid: string): Promise<MasterProfile|null> {
  assertDbReady();
  // 1) try direct doc in 'profiles' or 'masters'
  for (const colName of PROFILE_COLLECTIONS) {
    const snap = await getDoc(doc(db, colName, idOrUid));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as any) };
    }
  }
  
  // 2) fallback: search by uid field
  for (const colName of PROFILE_COLLECTIONS) {
    const q = query(collection(db, colName), where('uid','==', idOrUid), limit(1));
    const qs = await getDocs(q);
    if (!qs.empty) {
      const d = qs.docs[0];
      return { id: d.id, ...(d.data() as any) };
    }
  }
  
  return null;
}

export async function getListingsByMaster(master: MasterProfile): Promise<Listing[]> {
  assertDbReady();
  const uid = master?.uid || master?.id; // prefer uid
  if (!uid) return [];
  
  const col = collection(db, 'listings');
  
  // Try multiple owner field variations
  const ownerFields = ['ownerUid', 'profileUid', 'masterUid', 'userUid', 'authorUid'];
  const allListings: Listing[] = [];
  
  for (const field of ownerFields) {
    try {
      // Primary query: field == uid AND status == 'active'
      let q1 = query(col, where(field, '==', uid), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
      let snap = await getDocs(q1);
      if (!snap.empty) {
        const listings = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        allListings.push(...listings);
      }
    } catch (error) {
      // If composite index is missing, try without status filter
      try {
        let q2 = query(col, where(field, '==', uid), orderBy('createdAt', 'desc'));
        let snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const listings = snap2.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          // Filter for active status on client side
          const activeListings = listings.filter(l => l.status === 'active');
          allListings.push(...activeListings);
        }
      } catch (fallbackError) {
        console.warn(`Failed to query listings by ${field}:`, fallbackError);
      }
    }
  }
  
  // Remove duplicates by id
  const uniqueListings = new Map();
  allListings.forEach(listing => {
    uniqueListings.set(listing.id, listing);
  });
  
  return Array.from(uniqueListings.values());
}
