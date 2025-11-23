'use client';
import { collection, getDocs, query, where, orderBy, limit, startAfter, DocumentData, QueryConstraint, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { matchesAllFilters } from '@/lib/filtering';
import { shouldMasterBeVisibleInPublicSearch } from '@/lib/settings/masterVisibility';

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

// Post-filter helper: ensure item includes ALL selected keys
function includesAll(haystack: string[], needles: string[]) {
  if (!needles?.length) return true;
  if (!Array.isArray(haystack)) return false;
  return needles.every(k => haystack.includes(k));
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
  const buildConstraints = (): QueryConstraint[] => {
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
    
    // Normalize filter inputs - extract keys from UI objects
    const selectedServiceKeys = (filters.services ?? []).map(s => s.key).filter(Boolean);
    const selectedLanguageKeys = (filters.languages ?? []).map(l => l.key).filter(Boolean);
    
    // Use only ONE array filter in Firestore (prefer services if both are selected)
    // The second filter will be applied client-side
    if (selectedServiceKeys.length > 0) {
      // Services filter: use array-contains for single, array-contains-any for multiple
      if (selectedServiceKeys.length === 1) {
        constraints.push(where('serviceKeys', 'array-contains', selectedServiceKeys[0]));
      } else {
        constraints.push(where('serviceKeys', 'array-contains-any', selectedServiceKeys.slice(0, 10)));
      }
    } else if (selectedLanguageKeys.length > 0) {
      // Languages filter: only use if services are NOT selected
      if (selectedLanguageKeys.length === 1) {
        constraints.push(where('languageKeys', 'array-contains', selectedLanguageKeys[0]));
      } else {
        constraints.push(where('languageKeys', 'array-contains-any', selectedLanguageKeys.slice(0, 10)));
      }
    }
    
    constraints.push(orderBy('displayName'));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));
    
    return constraints;
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
  
  let items: any[] = Array.from(uniqueDocs.values()).map(d => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data,
      // Ensure serviceKeys and languageKeys are always present as arrays
      serviceKeys: extractKeys(data, 'service'),
      languageKeys: extractKeys(data, 'language')
    };
  });

  // Normalize selected keys for post-filtering
  const selectedServiceKeys = (filters.services ?? []).map(s => s.key).filter(Boolean);
  const selectedLanguageKeys = (filters.languages ?? []).map(l => l.key).filter(Boolean);
  
  // Post-filter: ensure items include ALL selected services and languages
  // This enforces "must include ALL" for multi-select cases
  items = items.filter(item => {
    return includesAll(item.serviceKeys, selectedServiceKeys) 
        && includesAll(item.languageKeys, selectedLanguageKeys);
  });

  // Apply client-side filters (name search, etc.)
  items = items.filter(it => {
    return matchesAllFilters(it, {
      ...filters,
      services: selectedServiceKeys,
      languages: selectedLanguageKeys,
    }, /*isMaster*/ true);
  });

  // Filter by master visibility: exclude masters with isPublicProfile === false
  // Note: This requires async checks, so we do it in a loop
  const visibilityFiltered: any[] = [];
  for (const item of items) {
    const masterUid = item.uid || item.userId || item.ownerId || item.userUID || item.id;
    if (masterUid) {
      try {
        const isVisible = await shouldMasterBeVisibleInPublicSearch(masterUid);
        if (isVisible) {
          visibilityFiltered.push(item);
        }
      } catch (error) {
        // On error, include the item (backward compatible)
        console.warn('[fetchMastersOnce] Error checking visibility for master:', masterUid, error);
        visibilityFiltered.push(item);
      }
    } else {
      // If no UID found, include it (backward compatible)
      visibilityFiltered.push(item);
    }
  }

  return {
    items: visibilityFiltered,
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

  // Normalize filter inputs - extract keys from UI objects
  const selectedServiceKeys = (filters.services ?? []).map(s => s.key).filter(Boolean);
  const selectedLanguageKeys = (filters.languages ?? []).map(l => l.key).filter(Boolean);
  
  // Use only ONE array filter in Firestore (prefer services if both are selected)
  // The second filter will be applied client-side
  if (selectedServiceKeys.length > 0) {
    // Services filter: use array-contains for single, array-contains-any for multiple
    if (selectedServiceKeys.length === 1) {
      cons.push(where('serviceKeys', 'array-contains', selectedServiceKeys[0]));
    } else {
      cons.push(where('serviceKeys', 'array-contains-any', selectedServiceKeys.slice(0, 10)));
    }
  } else if (selectedLanguageKeys.length > 0) {
    // Languages filter: only use if services are NOT selected
    if (selectedLanguageKeys.length === 1) {
      cons.push(where('languageKeys', 'array-contains', selectedLanguageKeys[0]));
    } else {
      cons.push(where('languageKeys', 'array-contains-any', selectedLanguageKeys.slice(0, 10)));
    }
  }

  // If you don't have createdAt, you can change to orderBy('title')
  cons.push(orderBy('createdAt', 'desc'));
  if (cursor) cons.push(startAfter(cursor));
  cons.push(limit(pageSize));

  const snap = await getDocs(query(colRef, ...cons));
  let items: any[] = snap.docs.map(d => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data,
      // Ensure serviceKeys and languageKeys are always present as arrays
      serviceKeys: extractKeys(data, 'service'),
      languageKeys: extractKeys(data, 'language')
    };
  });

  // Post-filter: ensure items include ALL selected services and languages
  // This enforces "must include ALL" for multi-select cases
  items = items.filter(item => {
    return includesAll(item.serviceKeys, selectedServiceKeys) 
        && includesAll(item.languageKeys, selectedLanguageKeys);
  });

  // STRICT post-filter
  items = items.filter(it => matchesAllFilters(it, filters as any, /*isMaster*/ false));

  return {
    items,
    nextCursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined,
  };
}
