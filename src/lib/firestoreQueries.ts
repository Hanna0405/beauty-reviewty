'use client';
import { collection, getDocs, query, where, orderBy, limit, startAfter, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { matchesAllFilters } from '@/lib/filtering';

import type { TagOption } from '@/types/tags';

export type MasterFilters = {
  city?: string;
  cityKey?: string;
  cityPlaceId?: string;
  services?: TagOption[];
  languages?: TagOption[];
  minRating?: number;
  name?: string; // client-side contains
};

export async function fetchMastersOnce(filters: MasterFilters, pageSize = 60, cursor?: DocumentData) {
  const colRef = collection(db, 'masters');
  
  // Build base constraints (without role filtering)
  const buildConstraints = (): QueryConstraint[] => {
    const cons: QueryConstraint[] = [];
    
    // Optional city filter
    if ((filters as any).cityPlaceId) {
      cons.push(where('city.placeId', '==', (filters as any).cityPlaceId));
    } else if (filters.city) {
      cons.push(where('city.name', '==', filters.city));
    }
    
    // Optional rating filter
    if (typeof filters.minRating === 'number' && filters.minRating > 0) {
      cons.push(where('rating', '>=', Math.max(0, Math.min(5, filters.minRating))));
    }
    
    // Optional services filter
    if (filters.services && filters.services.length > 0) {
      cons.push(where('serviceKeys', 'array-contains-any', filters.services.map(s => s.key).slice(0, 10)));
    }
    
    // Optional languages filter
    if (filters.languages && filters.languages.length > 0) {
      cons.push(where('languageKeys', 'array-contains-any', filters.languages.map(l => l.key).slice(0, 10)));
    }
    
    cons.push(orderBy('displayName'));
    if (cursor) cons.push(startAfter(cursor));
    cons.push(limit(pageSize));
    
    return cons;
  };

  // Try to run two separate queries for role filtering (since Firestore doesn't support OR)
  const constraints = buildConstraints();
  
  // Query 1: role === 'master'
  const cons1 = [...constraints, where('role', '==', 'master')];
  const snap1 = await getDocs(query(colRef, ...cons1));
  
  // Query 2: isMaster === true
  const cons2 = [...constraints, where('isMaster', '==', true)];
  const snap2 = await getDocs(query(colRef, ...cons2));
  
  // Merge results and remove duplicates by id
  const allDocs = [...snap1.docs, ...snap2.docs];
  const uniqueDocs = new Map();
  allDocs.forEach(doc => {
    uniqueDocs.set(doc.id, doc);
  });
  
  let items: any[] = Array.from(uniqueDocs.values()).map(d => ({ id: d.id, ...d.data() }));

  // Apply client-side filters (name search, etc.)
  items = items.filter(it => {
    return matchesAllFilters(it, {
      ...filters,
      services: filters.services?.map(s => s.key) || [],
      languages: filters.languages?.map(l => l.key) || [],
    }, /*isMaster*/ true);
  });

  return {
    items,
    nextCursor: allDocs.length ? allDocs[allDocs.length - 1] : undefined,
  };
}

export type ListingFilters = {
  city?: string;
  cityKey?: string;
  cityPlaceId?: string;
  services?: TagOption[];
  languages?: TagOption[];
  minRating?: number;
};

export async function fetchListingsOnce(filters: ListingFilters, pageSize = 60, cursor?: DocumentData) {
  const colRef = collection(db, 'listings');
  const cons: QueryConstraint[] = [];

  if ((filters as any).cityPlaceId) cons.push(where('city.placeId', '==', (filters as any).cityPlaceId));
  else if (filters.city) cons.push(where('city.name', '==', filters.city));
  if (typeof filters.minRating === 'number') cons.push(where('rating', '>=', Math.max(0, Math.min(5, filters.minRating))));

  const hasServices = !!(filters.services && filters.services.length);
  const hasLanguages = !!(filters.languages && filters.languages.length);
  if (hasServices) cons.push(where('serviceKeys', 'array-contains-any', filters.services!.map(s => s.key).slice(0, 10)));
  else if (hasLanguages) cons.push(where('languageKeys', 'array-contains-any', filters.languages!.map(l => l.key).slice(0, 10)));

  // If you don't have createdAt, you can change to orderBy('title')
  cons.push(orderBy('createdAt', 'desc'));
  if (cursor) cons.push(startAfter(cursor));
  cons.push(limit(pageSize));

  const snap = await getDocs(query(colRef, ...cons));
  let items: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // STRICT post-filter
  items = items.filter(it => matchesAllFilters(it, filters as any, /*isMaster*/ false));

  return {
    items,
    nextCursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined,
  };
}
