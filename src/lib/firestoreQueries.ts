import { collection, getDocs, query, where, orderBy, limit, startAfter, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { matchesAllFilters } from '@/lib/filtering';

export type MasterFilters = {
  city?: string;
  cityPlaceId?: string;
  services?: string[];
  languages?: string[];
  minRating?: number;
  name?: string; // client-side contains
};

export async function fetchMastersOnce(filters: MasterFilters, pageSize = 60, cursor?: DocumentData) {
  const colRef = collection(db, 'masters');
  const cons: QueryConstraint[] = [];

  // Server-side best-effort:
  if ((filters as any).cityPlaceId) cons.push(where('city.placeId', '==', (filters as any).cityPlaceId));
  else if (filters.city) cons.push(where('city.name', '==', filters.city));
  if (typeof filters.minRating === 'number') cons.push(where('rating', '>=', Math.max(0, Math.min(5, filters.minRating))));

  const hasServices = !!(filters.services && filters.services.length);
  const hasLanguages = !!(filters.languages && filters.languages.length);
  if (hasServices) cons.push(where('services', 'array-contains-any', (filters.services as string[]).slice(0, 10)));
  else if (hasLanguages) cons.push(where('languages', 'array-contains-any', (filters.languages as string[]).slice(0, 10)));

  cons.push(orderBy('displayName'));
  if (cursor) cons.push(startAfter(cursor));
  cons.push(limit(pageSize));

  const snap = await getDocs(query(colRef, ...cons));
  let items: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // STRICT post-filter (supports mixed schemas)
  items = items.filter(it => matchesAllFilters(it, filters, /*isMaster*/ true));

  return {
    items,
    nextCursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined,
  };
}

export type ListingFilters = {
  city?: string;
  cityPlaceId?: string;
  services?: string[];
  languages?: string[];
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
  if (hasServices) cons.push(where('services', 'array-contains-any', (filters.services as string[]).slice(0, 10)));
  else if (hasLanguages) cons.push(where('languages', 'array-contains-any', (filters.languages as string[]).slice(0, 10)));

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
