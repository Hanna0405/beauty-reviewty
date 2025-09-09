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
  getFirestore, 
  orderBy, 
  serverTimestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  setDoc,
  GeoPoint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Master, Listing, SearchFiltersValue, MasterProfileFormData } from '@/types';
import { handleFirestoreErrorLegacy } from '@/lib/firestoreErrorHandler';

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

// Get a single master listing by ID
export async function getById(id: string): Promise<Master | null> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return null;
  }
  
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

// Get a single listing by ID
export async function getListingById(id: string): Promise<Listing | null> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return null;
  }
  
  try {
    const docRef = doc(db, 'listings', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Listing;
    }
    return null;
  } catch (error) {
    console.error('Error getting listing by ID:', error);
    throw error;
  }
}

// Get all listings for a specific owner
export async function listByOwner(uid: string): Promise<Master[]> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
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

// Get all listings for a specific owner (new listings collection)
export async function listListingsByOwner(ownerId: string): Promise<Listing[]> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firestore is not initialized. Returning empty listings list.");
    }
    return [];
  }
  try {
    const q = fsQuery(
      collection(db, 'listings'),
      where('ownerUid', '==', ownerId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Listing[];
  } catch (error) {
    console.error('Error getting listings by owner:', error);
    const errorMessage = handleFirestoreErrorLegacy(error);
    throw new Error(errorMessage);
  }
}

// Query masters with filters (legacy)
export async function query(filters: Partial<SearchFiltersValue>): Promise<Master[]> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firestore is not initialized. Returning empty masters list.");
    }
    return [];
  }
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

// Query public listings with filters (new listings collection)
export async function queryPublicListings(filters: {
  city?: string;
  service?: string | string[];
  languages?: string[];
  isPublished?: boolean;
}): Promise<Listing[]> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firestore is not initialized. Returning empty listings list.");
    }
    return [];
  }
  try {
    const filterArray = [
      where('isPublished', '==', filters.isPublished ?? true),
      filters.city ? where('city', '==', filters.city) : null,
      // Handle service filter - can be single string or array for IN query
      filters.service ? 
        (Array.isArray(filters.service) ? 
          where('service', 'in', filters.service) : 
          where('service', '==', filters.service)
        ) : null,
      // Handle languages filter - array-contains-any for multiple languages
      filters.languages && filters.languages.length > 0 ? 
        where('languages', 'array-contains-any', filters.languages) : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

    const q = fsQuery(
      collection(db, 'listings'),
      ...filterArray,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Listing[];
  } catch (error) {
    console.error('Error querying public listings:', error);
    const errorMessage = handleFirestoreErrorLegacy(error);
    throw new Error(errorMessage);
  }
}

// Query public masters with filters (masters collection)
export async function fetchPublicMasters(filters: {
  city?: string;
  service?: string;
  languages?: string[];
} = {}): Promise<Master[]> {
  if (!db) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
  try {
    const filterArray = [
      // Use isPublished field if it exists, otherwise fall back to status
      where('isPublished', '==', true),
      filters.city ? where('city', '==', filters.city) : null,
      // Handle service filter - check if service is in services array
      filters.service ? where('services', 'array-contains', filters.service) : null,
      // Handle languages filter - array-contains-any for multiple languages
      filters.languages && filters.languages.length > 0 ? 
        where('languages', 'array-contains-any', filters.languages) : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

    const q = fsQuery(
      collection(db, 'masters'),
      ...filterArray,
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Master[];
  } catch (error: any) {
    console.error('Error fetching public masters:', error);
    
    // If isPublished field doesn't exist, try with status field
    if (error?.code === 'failed-precondition' && error?.message?.includes('isPublished')) {
      try {
        const filterArray = [
          where('status', '==', 'active'),
          filters.city ? where('city', '==', filters.city) : null,
          filters.service ? where('services', 'array-contains', filters.service) : null,
          filters.languages && filters.languages.length > 0 ? 
            where('languages', 'array-contains-any', filters.languages) : null,
        ].filter((item): item is NonNullable<typeof item> => Boolean(item));

        const q = fsQuery(
          collection(db, 'masters'),
          ...filterArray,
          orderBy('updatedAt', 'desc'),
          limit(50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Master[];
      } catch (fallbackError) {
        console.error('Error fetching public masters (fallback):', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

// Create a new master listing
export async function create(uid: string, partial: Partial<Master>): Promise<string> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check Firebase settings.");
  }
  try {
    const now = serverTimestamp();
    const data = {
      uid,
      ownerId: uid, // Add ownerId for consistency
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
    
    const docRef = await addDoc(collection(db, "masters"), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating master listing:', error);
    throw error;
  }
}

// Update an existing master listing
export async function update(id: string, partial: Partial<Master>): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check Firebase settings.");
  }
  try {
    const docRef = doc(db, 'masters', id);
    const updateData = stripUndefined({
      ...partial,
      updatedAt: serverTimestamp(),
    });
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating master listing:', error);
    throw error;
  }
}

// Remove a master listing
export async function remove(id: string): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check Firebase settings.");
  }
  try {
    const docRef = doc(db, 'masters', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing master listing:', error);
    throw error;
  }
}

// Remove a listing from the listings collection
export async function removeListing(id: string): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check Firebase settings.");
  }
  try {
    const docRef = doc(db, 'listings', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing listing:', error);
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
  
  export type MasterProfilePayload = {
    name: string;
    city?: string;
    coords?: { lat: number; lng: number } | null;
    services?: string[];
    languages?: string[];
    priceMin?: number | null;
    priceMax?: number | null;
    about?: string | null;
    photos?: string[];
  };
  
  export async function saveMasterProfile(uid: string, data: MasterProfilePayload): Promise<void> {
    // Use the shared db instance
    const ref = doc(db, 'masters', uid); // one profile per master
    const payload: any = {
      name: data.name,
      city: data.city ?? null,
      services: data.services ?? [],
      languages: data.languages ?? [],
      priceMin: data.priceMin ?? null,
      priceMax: data.priceMax ?? null,
      about: data.about ?? null,
      photos: data.photos ?? [],
      updatedAt: serverTimestamp(),
    };
    if (data.coords && typeof data.coords.lat === 'number' && typeof data.coords.lng === 'number') {
      payload.coords = new GeoPoint(data.coords.lat, data.coords.lng);
    }
    await setDoc(ref, payload, { merge: true });
  }
