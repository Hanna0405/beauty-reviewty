import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query as fsQuery, 
  where, 
  orderBy, 
  serverTimestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Master, SearchFiltersValue } from '@/types';

// Get a single master listing by ID
export async function getById(id: string): Promise<Master | null> {
  try {
    const docRef = doc(db, 'masters', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Master;
    }
    return null;
  } catch (error) {
    console.error('Error getting master by ID:', error);
    throw error;
  }
}

// Get all listings for a specific owner
export async function listByOwner(uid: string): Promise<Master[]> {
  try {
    const q = fsQuery(
      collection(db, 'masters'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Master[];
  } catch (error) {
    console.error('Error getting masters by owner:', error);
    throw error;
  }
}

// Query masters with filters
export async function query(filters: Partial<SearchFiltersValue>): Promise<Master[]> {
  try {
    let q = fsQuery(collection(db, 'masters'), where('status', '==', 'active'));

    // Apply filters
    if (filters.city) {
      q = fsQuery(q, where('city', '==', filters.city));
    }

    if (filters.service) {
      q = fsQuery(q, where('services', 'array-contains', filters.service));
    }

    if (filters.languages && filters.languages.length > 0) {
      q = fsQuery(q, where('languages', 'array-contains-any', filters.languages));
    }

    // Price filter
    if (filters.price && filters.price !== 'all') {
      let minPrice = 0;
      let maxPrice = Infinity;
      
      switch (filters.price) {
        case 'low':
          maxPrice = 50;
          break;
        case 'mid':
          minPrice = 50;
          maxPrice = 150;
          break;
        case 'high':
          minPrice = 150;
          break;
      }
      
      if (minPrice > 0) {
        q = fsQuery(q, where('priceFrom', '>=', minPrice));
      }
      if (maxPrice < Infinity) {
        q = fsQuery(q, where('priceTo', '<=', maxPrice));
      }
    }

    const querySnapshot = await getDocs(q);
    let results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Master[];

    // Text search filter (client-side for now)
    if (filters.q) {
      const searchTerm = filters.q.toLowerCase();
      results = results.filter(master => 
        master.title.toLowerCase().includes(searchTerm) ||
        master.about?.toLowerCase().includes(searchTerm) ||
        master.services.some(service => service.toLowerCase().includes(searchTerm))
      );
    }

    return results;
  } catch (error) {
    console.error('Error querying masters:', error);
    throw error;
  }
}

// Create a new master listing
export async function create(uid: string, data: Partial<Master>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'masters'), {
      uid,
      ...data,
      status: data.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating master listing:', error);
    throw error;
  }
}

// Update an existing master listing
export async function update(id: string, data: Partial<Master>): Promise<void> {
  try {
    const docRef = doc(db, 'masters', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating master listing:', error);
    throw error;
  }
}

// Remove a master listing
export async function remove(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'masters', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing master listing:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function getByOwner(uid: string): Promise<Master | null> {
  const listings = await listByOwner(uid);
  return listings.length > 0 ? listings[0] : null;
}

export async function upsert(uid: string, data: Partial<Master>): Promise<void> {
  const existing = await getByOwner(uid);
  if (existing) {
    await update(existing.id, data);
  } else {
    await create(uid, data);
  }
}
