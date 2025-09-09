import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Listing } from '@/types';

// Helper function to strip undefined values
function stripUndefined(obj: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// Create a new listing
export async function createListing(ownerId: string, partial: Partial<Listing>): Promise<string> {
  try {
    const now = serverTimestamp();
    const data = {
      ownerUid: ownerId,
      isPublished: partial.isPublished ?? false,
      title: partial.title ?? "",
      about: partial.about ?? "",
      city: partial.city ?? "",
      location: partial.location ?? null,
      services: partial.services ?? [],
      languages: partial.languages ?? [],
      photos: partial.photos ?? [],
      status: partial.status ?? "active",
      priceFrom: partial.priceFrom ?? null,
      priceTo: partial.priceTo ?? null,
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, "listings"), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

// Update an existing listing
export async function updateListing(id: string, partial: Partial<Listing>): Promise<void> {
  try {
    const docRef = doc(db, 'listings', id);
    const updateData = stripUndefined({
      ...partial,
      updatedAt: serverTimestamp(),
      // NEVER overwrite createdAt - it should remain stable
    });
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

// Save listing (create or update)
export async function saveListing(ownerUid: string, listingId: string | null, data: Partial<Listing>): Promise<string> {
  if (listingId) {
    await updateListing(listingId, data);
    return listingId;
  } else {
    return await createListing(ownerUid, data);
  }
}
