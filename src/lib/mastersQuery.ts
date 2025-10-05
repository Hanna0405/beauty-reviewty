import { collection, query, where, orderBy, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type MastersFilters = {
  city?: string;
  service?: string | null;
  language?: string | null;
};

export function buildMastersQuery(filters: MastersFilters): Query {
  const { city, service, language } = filters;
  const col = collection(db, 'masters');

  const conds: any[] = [];
  
  // Role filtering: prefer role === 'master', fallback to isMaster === true
  conds.push(where('role', '==', 'master'));
  
  // Optional city filter
  if (city && city.trim()) {
    conds.push(where('cityName', '==', city.trim()));
  }
  
  // Optional service filter
  if (service) {
    conds.push(where('serviceKeys', 'array-contains', service));
  }
  
  // Optional language filter
  if (language) {
    conds.push(where('languageKeys', 'array-contains', language));
  }

  // IMPORTANT: orderBy must be LAST
  return query(col, ...conds, orderBy('displayName'));
}
