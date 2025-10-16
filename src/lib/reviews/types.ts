export type ReviewPhoto = { url: string; path: string };
export type ReviewSubject = { type: 'master'|'listing'; id: string };
export type ReviewDoc = {
  id: string;
  subject: ReviewSubject;
  subjectType: 'master'|'listing';
  subjectId: string;
  authorUid: string;
  rating: number;
  text: string;
  photos: ReviewPhoto[];
  createdAt?: { seconds: number; nanos?: number };
  updatedAt?: { seconds: number; nanos?: number };
  // Enriched by API:
  author?: { name?: string | null; photoURL?: string | null };
  createdAtISO?: string | null;
};

