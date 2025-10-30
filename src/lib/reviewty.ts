export type ReviewtyMaster = {
  id: string;
  slug?: string;
  displayName?: string;
  name?: string;
  cityName?: string;
  serviceNames?: string[];
  languageNames?: string[];
  workPhotos?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  [key: string]: any;
};

// NOTE:
// This file is now ONLY types and simple helpers that don't touch Firestore.
// Any Firestore fetching must happen either:
// - in /api/reviewty/[slug]/route.ts (server, using firestore/lite)
// - or in client code using the normal web SDK for writes.
// We intentionally DO NOT import firebase-admin or firebase/firestore here,
// to keep this file safe to import from React components.
