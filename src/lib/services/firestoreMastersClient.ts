"use client";

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
  DocumentData,
  setDoc,
  GeoPoint
} from 'firebase/firestore';
import { requireDb } from '@/lib/firebase/client';
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
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return null;
  }
  
  try {
    const docRef = doc(requireDb(), 'masters', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Master;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching master by ID:', error);
    return null;
  }
}

// Get a single listing by ID
export async function getListingById(id: string): Promise<Listing | null> {
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return null;
  }
  
  try {
    const docRef = doc(requireDb(), 'listings', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Listing;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching listing by ID:', error);
    return null;
  }
}

// List masters by owner
export async function listByOwner(uid: string): Promise<Master[]> {
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
  try {
    const q = fsQuery(
      collection(requireDb(), 'masters'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Master[];
  } catch (error) {
    console.error('Error listing masters by owner:', error);
    return [];
  }
}

// List listings by owner
export async function listListingsByOwner(ownerId: string): Promise<Listing[]> {
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
  try {
    const q = fsQuery(
      collection(requireDb(), 'listings'),
      where('ownerUid', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Listing[];
  } catch (error) {
    console.error('Error listing listings by owner:', error);
    return [];
  }
}

// Query masters with filters
export async function query(filters: Partial<SearchFiltersValue>): Promise<Master[]> {
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
  try {
    const constraints: any[] = [];
    
    if (filters.city) {
      constraints.push(where('city', '==', filters.city));
    }
    
    if (filters.service) {
      constraints.push(where('services', 'array-contains', filters.service));
    }
    
    if (filters.languages && filters.languages.length > 0) {
      constraints.push(where('languages', 'array-contains-any', filters.languages));
    }
    
    // Note: minRating is not available in SearchFiltersValue type
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(50));
    
    const q = fsQuery(collection(requireDb(), 'masters'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Master[];
  } catch (error) {
    console.error('Error querying masters:', error);
    return [];
  }
}

// Query public listings
export async function queryPublicListings(filters: {
  city?: string;
  service?: string;
  language?: string;
  minRating?: number;
  limit?: number;
}): Promise<Listing[]> {
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
  try {
    const constraints: any[] = [where('status', '==', 'published')];
    
    if (filters.city) {
      constraints.push(where('city', '==', filters.city));
    }
    
    if (filters.service) {
      constraints.push(where('services', 'array-contains', filters.service));
    }
    
    if (filters.language) {
      constraints.push(where('languages', 'array-contains', filters.language));
    }
    
    if (filters.minRating) {
      constraints.push(where('ratingAvg', '>=', filters.minRating));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(filters.limit || 50));
    
    const q = fsQuery(collection(requireDb(), 'listings'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Listing[];
  } catch (error) {
    console.error('Error querying public listings:', error);
    return [];
  }
}

// Fetch public masters
export async function fetchPublicMasters(filters: {
  city?: string;
  service?: string;
  language?: string;
  minRating?: number;
  limit?: number;
}): Promise<Master[]> {
  if (!requireDb()) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    return [];
  }
  
  try {
    const constraints: any[] = [where('status', '==', 'active')];
    
    if (filters.city) {
      constraints.push(where('city', '==', filters.city));
    }
    
    if (filters.service) {
      constraints.push(where('services', 'array-contains', filters.service));
    }
    
    if (filters.language) {
      constraints.push(where('languages', 'array-contains', filters.language));
    }
    
    if (filters.minRating) {
      constraints.push(where('ratingAvg', '>=', filters.minRating));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(filters.limit || 50));
    
    const q = fsQuery(collection(requireDb(), 'masters'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Master[];
  } catch (error) {
    console.error('Error fetching public masters:', error);
    return [];
  }
}

// Create a new master
export async function create(uid: string, partial: Partial<Master>): Promise<string> {
  if (!requireDb()) {
    throw new Error("Firestore is not initialized (missing env).");
  }
  
  try {
    const data = {
      ...stripUndefined(partial),
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(requireDb(), 'masters'), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating master:', error);
    throw error;
  }
}

// Update a master
export async function update(id: string, partial: Partial<Master>): Promise<void> {
  if (!requireDb()) {
    throw new Error("Firestore is not initialized (missing env).");
  }
  
  try {
    const data = {
      ...stripUndefined(partial),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = doc(requireDb(), 'masters', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating master:', error);
    throw error;
  }
}

// Remove a master
export async function remove(id: string): Promise<void> {
  if (!requireDb()) {
    throw new Error("Firestore is not initialized (missing env).");
  }
  
  try {
    const docRef = doc(requireDb(), 'masters', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing master:', error);
    throw error;
  }
}

// Remove a listing
export async function removeListing(id: string): Promise<void> {
  if (!requireDb()) {
    throw new Error("Firestore is not initialized (missing env).");
  }
  
  try {
    const docRef = doc(requireDb(), 'listings', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing listing:', error);
    throw error;
  }
}

// Get master by owner
export async function getByOwner(uid: string): Promise<Master | null> {
  const masters = await listByOwner(uid);
  return masters.length > 0 ? masters[0] : null;
}

// Upsert a master
export async function upsert(uid: string, data: Partial<Master>): Promise<void> {
  if (!requireDb()) {
    throw new Error("Firestore is not initialized (missing env).");
  }
  
  try {
    const docRef = doc(requireDb(), 'masters', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await update(uid, data);
    } else {
      await create(uid, data);
    }
  } catch (error) {
    console.error('Error upserting master:', error);
    throw error;
  }
}

// Save master profile
type MasterProfilePayload = {
  displayName?: string;
  city?: string;
  about?: string;
  services?: string[];
  languages?: string[];
  avatarUrl?: string;
  status?: 'active' | 'inactive';
};

export async function saveMasterProfile(uid: string, data: MasterProfilePayload): Promise<void> {
  if (!requireDb()) {
    throw new Error("Firestore is not initialized (missing env).");
  }
  
  try {
    const docRef = doc(requireDb(), 'masters', uid);
    const docSnap = await getDoc(docRef);
    
    const profileData = {
      ...stripUndefined(data),
      updatedAt: serverTimestamp(),
    };
    
    if (docSnap.exists()) {
      await updateDoc(docRef, profileData);
    } else {
      await setDoc(docRef, {
        ...profileData,
        uid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving master profile:', error);
    throw error;
  }
}
