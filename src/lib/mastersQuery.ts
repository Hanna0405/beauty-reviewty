import { collection, query, where, orderBy, Query } from 'firebase/firestore';
import { db } from './firebase';

export type MastersFilters = {
  city?: string;
  service?: string | null;
  language?: string | null;
};

export function buildMastersQuery(filters: MastersFilters): Query {
  const { city, service, language } = filters;
  const col = collection(db, 'listings'); // change only if your collection is named differently

  const conds: any[] = [ where('status', '==', 'active') ];
  if (city && city.trim()) conds.push(where('city', '==', city.trim()));
  if (service) conds.push(where('services', 'array-contains', service));
  if (language) conds.push(where('languages', 'array-contains', language));

  // IMPORTANT: orderBy must be LAST
  return query(col, ...conds, orderBy('displayName'));
}
