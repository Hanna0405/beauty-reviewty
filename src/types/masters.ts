export type Master = {
 id: string;
 displayName: string;
 services?: string[];
 languages?: string[];
 city?: string;
 rating?: number;
 photoUrl?: string | null;
 location?: { lat: number; lng: number } | null; // optional
};
export type MastersSearchReq = {
 service?: string | null;
 city?: string | null;
 language?: string | null;
 minRating?: number | null;
 cursor?: string | null; // doc id to startAfter
 pageSize?: number | null; // default 20
};
export type MastersSearchRes = {
 ok: true;
 items: Master[];
 nextCursor: string | null;
} | { ok: false; error: string };
