'use client';
import { collection, getDocs, query, where, orderBy, limit, startAfter, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { matchesAllFilters } from '@/lib/filtering';

import type { TagOption } from '@/types/tags';

// Helper functions for normalizing different document storage formats
function extractKeys(it: any, base: 'service' | 'language'): string[] {
  // Try <base>Keys first (array of strings)
  const keysField = `${base}Keys`;
  const arrK = (it && Array.isArray(it[keysField])) ? it[keysField] as string[] : null;
  if (arrK) return arrK.filter(Boolean);

  // Try plural field: services / languages
  const plural = base === 'service' ? 'services' : 'languages';
  const arr = (it && Array.isArray(it[plural])) ? it[plural] : null;
  if (!arr) return [];

  // If array of strings
  if (arr.length && typeof arr[0] === 'string') {
    return (arr as string[]).filter(Boolean);
  }
  // If array of objects with {key}
  if (arr.length && typeof arr[0] === 'object' && arr[0] && 'key' in arr[0]) {
    return (arr as Array<{key?: string}>).map(x => x?.key).filter(Boolean) as string[];
  }
  return [];
}

function hasAnyOverlap(have: string[], need: string[]) {
  if (!have.length || !need.length) return false;
  const set = new Set(have);
  for (const k of need) if (set.has(k)) return true;
  return false;
}

export type MasterFilters = {
  city?: string;
  cityKey?: string;
  cityPlaceId?: string;
  services?: Array<{ key: string; name: string; emoji?: string }>;
  languages?: Array<{ key: string; name: string; emoji?: string }>;
  minRating?: number;
  name?: string; // client-side contains
};

export async function fetchMastersOnce(filters: MasterFilters, pageSize = 60, cursor?: DocumentData) {
  const colRef = collection(db, 'masters');
  
  // Build base constraints (without role filtering)
  const buildConstraints = (): { constraints: QueryConstraint[]; used: 'service' | 'language' | null } => {
    const constraints: QueryConstraint[] = [];
    
    // Optional city filter
    if ((filters as any).cityPlaceId) {
      constraints.push(where('city.placeId', '==', (filters as any).cityPlaceId));
    } else if (filters.city) {
      constraints.push(where('city.name', '==', filters.city));
    }
    
    // Optional rating filter
    if (typeof filters.minRating === 'number' && filters.minRating > 0) {
      constraints.push(where('rating', '>=', Math.max(0, Math.min(5, filters.minRating))));
    }
    
    // Choose only ONE array-contains-any to use server-side
    const serviceKeys = filters.services?.map(s => s.key).slice(0, 10) || [];
    const languageKeys = filters.languages?.map(l => l.key).slice(0, 10) || [];
    
    let used: 'service' | 'language' | null = null;
    if (serviceKeys.length && languageKeys.length) {
      if (serviceKeys.length >= languageKeys.length) {
        constraints.push(where('serviceKeys', 'array-contains-any', serviceKeys));
        used = 'service';
      } else {
        constraints.push(where('languageKeys', 'array-contains-any', languageKeys));
        used = 'language';
      }
    } else if (serviceKeys.length) {
      constraints.push(where('serviceKeys', 'array-contains-any', serviceKeys));
      used = 'service';
    } else if (languageKeys.length) {
      constraints.push(where('languageKeys', 'array-contains-any', languageKeys));
      used = 'language';
    }
    
    constraints.push(orderBy('displayName'));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));
    
    return { constraints, used };
  };

  // Try to run two separate queries for role filtering (since Firestore doesn't support OR)
  const { constraints, used } = buildConstraints();
  
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

  // Apply the remaining filter(s) client-side using the normalizer
  const serviceKeys = filters.services?.map(s => s.key) || [];
  const languageKeys = filters.languages?.map(l => l.key) || [];
  
  // If we did NOT use services on server but UI has services selected:
  if (used !== 'service' && serviceKeys.length) {
    items = items.filter(it => hasAnyOverlap(extractKeys(it, 'service'), serviceKeys));
  }
  // If we did NOT use languages on server but UI has languages selected:
  if (used !== 'language' && languageKeys.length) {
    items = items.filter(it => hasAnyOverlap(extractKeys(it, 'language'), languageKeys));
  }

  // Apply client-side filters (name search, etc.)
  items = items.filter(it => {
    return matchesAllFilters(it, {
      ...filters,
      services: serviceKeys,
      languages: languageKeys,
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
  services?: Array<{ key: string; name: string; emoji?: string }>;
  languages?: Array<{ key: string; name: string; emoji?: string }>;
  minRating?: number;
};

export async function fetchListingsOnce(filters: ListingFilters, pageSize = 60, cursor?: DocumentData) {
  const colRef = collection(db, 'listings');
  const cons: QueryConstraint[] = [];

  if ((filters as any).cityPlaceId) cons.push(where('city.placeId', '==', (filters as any).cityPlaceId));
  else if (filters.city) cons.push(where('city.name', '==', filters.city));
  if (typeof filters.minRating === 'number') cons.push(where('rating', '>=', Math.max(0, Math.min(5, filters.minRating))));

  // Choose only ONE array-contains-any to use server-side
  const serviceKeys = filters.services?.map(s => s.key).slice(0, 10) || [];
  const languageKeys = filters.languages?.map(l => l.key).slice(0, 10) || [];
  
  let arrayFilterUsed: 'services' | 'languages' | null = null;
  if (serviceKeys.length && languageKeys.length) {
    // pick the larger selection to narrow results more
    if (serviceKeys.length >= languageKeys.length) {
      cons.push(where('serviceKeys', 'array-contains-any', serviceKeys));
      arrayFilterUsed = 'services';
    } else {
      cons.push(where('languageKeys', 'array-contains-any', languageKeys));
      arrayFilterUsed = 'languages';
    }
  } else if (serviceKeys.length) {
    cons.push(where('serviceKeys', 'array-contains-any', serviceKeys));
    arrayFilterUsed = 'services';
  } else if (languageKeys.length) {
    cons.push(where('languageKeys', 'array-contains-any', languageKeys));
    arrayFilterUsed = 'languages';
  }

  // If you don't have createdAt, you can change to orderBy('title')
  cons.push(orderBy('createdAt', 'desc'));
  if (cursor) cons.push(startAfter(cursor));
  cons.push(limit(pageSize));

  const snap = await getDocs(query(colRef, ...cons));
  let items: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Apply the second array filter client-side (if needed)
  if (arrayFilterUsed !== 'services' && serviceKeys.length) {
    items = items.filter(it => Array.isArray(it.serviceKeys) && it.serviceKeys.some((k: string) => serviceKeys.includes(k)));
  }
  if (arrayFilterUsed !== 'languages' && languageKeys.length) {
    items = items.filter(it => Array.isArray(it.languageKeys) && it.languageKeys.some((k: string) => languageKeys.includes(k)));
  }

  // STRICT post-filter
  items = items.filter(it => matchesAllFilters(it, filters as any, /*isMaster*/ false));

  return {
    items,
    nextCursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined,
  };
}
